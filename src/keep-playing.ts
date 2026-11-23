(() => {
  "use strict";

  // Run before the site's scripts in their JS world, so visibility checks see these.
  for (const [property, value] of Object.entries({
    hidden: false,
    visibilityState: "visible",
    webkitHidden: false,
    webkitVisibilityState: "visible",
  })) {
    Object.defineProperty(document, property, {
      configurable: true,
      get: () => value,
    });
  }

  Object.defineProperty(document, "hasFocus", {
    configurable: true,
    writable: true,
    value: () => true,
  });

  // Capture on window before document and the site's later listeners.
  for (const eventName of ["visibilitychange", "webkitvisibilitychange"]) {
    window.addEventListener(eventName, (event) => {
      event.stopImmediatePropagation();
    }, true);
  }

  window.addEventListener("blur", (event) => {
    // Form controls must still blur normally (validation, menus, comments, etc.).
    if (event.target === window || event.target === document) {
      event.stopImmediatePropagation();
    }
  }, true);
})();
