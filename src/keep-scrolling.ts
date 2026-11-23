(() => {
  "use strict";

  // Extra protection: this script is registered only after an explicit X opt-in.
  if (!["x.com", "twitter.com"].some((root) => location.hostname === root || location.hostname.endsWith(`.${root}`))) return;

  const nativePause = HTMLMediaElement.prototype.pause;
  let currentVideo: HTMLVideoElement | undefined;
  let manualPauseUntil = 0;

  function outsideViewport(video: HTMLVideoElement): boolean {
    const rect = video.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0
      && (rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth);
  }

  function leavingViewport(video: HTMLVideoElement): boolean {
    const rect = video.getBoundingClientRect();
    // Players can pause at an intersection threshold before the last pixel leaves.
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

  // Capture user intent before X's handlers call pause(). Never resume a video.
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

  // Media-key/browser media controls can use X's Media Session callbacks.
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

  // Let a new visible video take over instead of accumulating offscreen players.
  document.addEventListener("play", (event) => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement) || outsideViewport(video)) return;
    if (currentVideo && currentVideo !== video && leavingViewport(currentVideo)) {
      nativePause.call(currentVideo);
    }
    currentVideo = video;
    manualPauseUntil = 0;
  }, true);

  HTMLMediaElement.prototype.pause = function () {
    if (this instanceof HTMLVideoElement && this === currentVideo
      && this.isConnected && !this.paused && !this.ended
      && performance.now() >= manualPauseUntil && leavingViewport(this)) return;
    return nativePause.call(this);
  };
})();
