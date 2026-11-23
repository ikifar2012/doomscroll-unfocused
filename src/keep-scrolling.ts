(() => {
  "use strict";

  // Extra protection: this script is registered only after an explicit X opt-in.
  if (!["x.com", "twitter.com"].some((root) => location.hostname === root || location.hostname.endsWith(`.${root}`))) return;

  const nativePause = HTMLMediaElement.prototype.pause;
  const nativePlay = HTMLMediaElement.prototype.play;
  let currentVideo: HTMLVideoElement | undefined;
  let keepCurrentPlaying = false;
  let manualPauseUntil = 0;
  let manualPlayTarget: HTMLVideoElement | undefined;
  const events: { event: string; connected: boolean; paused: boolean; readyState: number }[] = [];
  const observed = new WeakSet<HTMLVideoElement>();
  let wasConnected = false;

  function record(event: string): void {
    if (!currentVideo) return;
    events.push({ event, connected: currentVideo.isConnected, paused: currentVideo.paused, readyState: currentVideo.readyState });
    if (events.length > 20) events.shift();
  }

  // Read on demand by the popup. No URLs, page content, or persistent logs.
  Object.defineProperty(window, "__doomscrollPlaybackReport", {
    configurable: true,
    value: () => ({
      player: currentVideo ? {
        connected: currentVideo.isConnected,
        paused: currentVideo.paused,
        ended: currentVideo.ended,
        readyState: currentVideo.readyState,
        networkState: currentVideo.networkState,
        errorCode: currentVideo.error?.code ?? null,
        protected: keepCurrentPlaying,
      } : null,
      events: events.slice(),
    }),
  });

  new MutationObserver(() => {
    if (!currentVideo) return;
    if (wasConnected && !currentVideo.isConnected) record("player-removed");
    else if (!wasConnected && currentVideo.isConnected) record("player-reattached");
    wasConnected = currentVideo.isConnected;
  }).observe(document, { childList: true, subtree: true });

  function hasProtectedVideo(): boolean {
    return Boolean(currentVideo && currentVideo.isConnected && !currentVideo.paused
      && !currentVideo.ended && !currentVideo.error
      && (keepCurrentPlaying || leavingViewport(currentVideo)));
  }

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

  function allowManualPause(video = currentVideo): void {
    manualPauseUntil = performance.now() + 350;
    manualPlayTarget = video;
  }

  function playerVideo(target: EventTarget | null): HTMLVideoElement | undefined {
    if (!(target instanceof Element)) return;
    if (target instanceof HTMLVideoElement) return target;
    return target.closest('[data-testid="videoPlayer"], [data-testid="videoComponent"]')
      ?.querySelector("video") ?? undefined;
  }

  function userChose(video: HTMLVideoElement): boolean {
    return video === manualPlayTarget && performance.now() < manualPauseUntil;
  }

  function isPlayerControl(target: EventTarget | null): boolean {
    return target instanceof Element
      && Boolean(target.closest('video, [data-testid="videoPlayer"], [data-testid="videoComponent"]'));
  }

  // Capture user intent before X's handlers call pause(). Never resume a video.
  for (const eventName of ["pointerdown", "click"]) {
    document.addEventListener(eventName, (event) => {
      if (event.isTrusted && isPlayerControl(event.target)) allowManualPause(playerVideo(event.target));
    }, true);
  }
  document.addEventListener("keydown", (event) => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')) return;
    if (["MediaPause", "MediaPlayPause", "MediaStop"].includes(event.key)
      || (isPlayerControl(target) && [" ", "Enter"].includes(event.key))
      || event.key.toLowerCase() === "k") allowManualPause(playerVideo(target));
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

  // Scrolling past another autoplaying video must not replace the chosen playback.
  HTMLMediaElement.prototype.play = function () {
    if (this instanceof HTMLVideoElement && this !== currentVideo
      && hasProtectedVideo() && !userChose(this)) {
      return Promise.reject(new DOMException("Another video is playing while you scroll.", "AbortError"));
    }
    return nativePlay.call(this);
  };

  // Native autoplay can bypass play(); stop that video, rather than the chosen one.
  document.addEventListener("play", (event) => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement) || outsideViewport(video)) return;
    if (video !== currentVideo && hasProtectedVideo() && !userChose(video)) {
      nativePause.call(video);
      return;
    }
    if (currentVideo && currentVideo !== video && leavingViewport(currentVideo)) {
      nativePause.call(currentVideo);
    }
    currentVideo = video;
    wasConnected = video.isConnected;
    record("playback-selected");
    if (!observed.has(video)) {
      observed.add(video);
      for (const eventName of ["pause", "emptied", "abort", "ended", "error", "waiting", "stalled"]) {
        video.addEventListener(eventName, () => {
          if (video === currentVideo) record(eventName);
        });
      }
    }
    keepCurrentPlaying = false;
    manualPauseUntil = 0;
    manualPlayTarget = undefined;
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
      // Keep the same playback protected when X reconciles its player on re-entry.
      keepCurrentPlaying = true;
      record("pause-blocked");
      return;
    }
    if (this === currentVideo) record("pause-allowed");
    if (this === currentVideo) keepCurrentPlaying = false;
    return nativePause.call(this);
  };
})();
