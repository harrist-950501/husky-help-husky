/* theme.js (frontend-only)
 * Toggle theme live without saving preference.
 * - Button with id="theme-toggle" toggles data-theme="dark" on <html>.
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  function init() {
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
        }
      });
    }
  }
})();
