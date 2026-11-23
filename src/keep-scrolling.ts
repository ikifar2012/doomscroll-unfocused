(() => {
  "use strict";

  if (!["x.com", "twitter.com"].some((root) => location.hostname === root || location.hostname.endsWith(`.${root}`))) return;

  const nativePause = HTMLMediaElement.prototype.pause;
  let currentVideo: HTMLVideoElement | undefined;
  let keepCurrentPlaying = false;
  let manualPauseUntil = 0;

  function leavingViewport(video: HTMLVideoElement): boolean {
    const rect = video.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0
      && (rect.top < 0 || rect.left < 0 || rect.bottom > innerHeight || rect.right > innerWidth);
  }

  function allowManualPause(): void {
    manualPauseUntil = performance.now() + 350;
  }

  function isPlayerControl(target: EventTarget | null): boolean {
    return target instanceof Element
      && Boolean(target.closest('video, [data-testid="videoPlayer"], [data-testid="videoComponent"]'));
  }

  // Recognize manual controls before the site's handlers call pause().
  for (const eventName of ["pointerdown", "click"]) {
    document.addEventListener(eventName, (event) => {
      if (event.isTrusted && isPlayerControl(event.target)) allowManualPause();
    }, true);
  }
  document.addEventListener("keydown", (event) => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')) return;
    if (["MediaPause", "MediaPlayPause", "MediaStop"].includes(event.key)
      || (isPlayerControl(target) && [" ", "Enter"].includes(event.key))
      || event.key.toLowerCase() === "k") allowManualPause();
  }, true);

  if ("MediaSession" in window) {
    const nativeSetActionHandler = MediaSession.prototype.setActionHandler;
    MediaSession.prototype.setActionHandler = function (action, handler) {
      if ((action === "pause" || action === "stop") && handler) {
        return nativeSetActionHandler.call(this, action, (details) => {
          allowManualPause();
          handler(details);
        });
      }
      return nativeSetActionHandler.call(this, action, handler);
    };
  }

  // Follow playback without starting, stopping, or replacing other videos.
  document.addEventListener("play", (event) => {
    if (!(event.target instanceof HTMLVideoElement)) return;
    currentVideo = event.target;
    keepCurrentPlaying = false;
    manualPauseUntil = 0;
  }, true);

  for (const eventName of ["ended", "emptied"]) {
    document.addEventListener(eventName, (event) => {
      if (event.target === currentVideo) keepCurrentPlaying = false;
    }, true);
  }

  HTMLMediaElement.prototype.pause = function () {
    if (this instanceof HTMLVideoElement && this === currentVideo
      && this.isConnected && !this.paused && !this.ended && !this.error
      && performance.now() >= manualPauseUntil
      && (keepCurrentPlaying || leavingViewport(this))) {
      // Retain protection on re-entry until manual pause or a new playback starts.
      keepCurrentPlaying = true;
      return;
    }
    if (this === currentVideo) keepCurrentPlaying = false;
    return nativePause.call(this);
  };
})();
