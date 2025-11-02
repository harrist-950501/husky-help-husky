/* login.js (frontend-only)
 * Basic client-side "login" check:
 * - If username and password are non-empty -> go to main.html
 * - Else show .error
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  function init() {
    const form = document.querySelector("form");
    if (!form) return;
    form.addEventListener("submit", onSubmit);
  }

  function onSubmit(evt) {
    evt.preventDefault();
    hideError();
    const userName = valueOf("#username");
    const password = valueOf("#password");
    if (!userName || !password) {
      return showError("Please enter both username and password.");
    }
    // Simulate success: navigate to main page
    window.location.href = "main.html";
  }

  function valueOf(sel) {
    const el = document.querySelector(sel);
    return el ? el.value.trim() : "";
  }

  function showError(msg) {
    const box = document.querySelector(".error");
    if (box) {
      box.textContent = msg;
      box.classList.remove("hidden");
    }
  }

  function hideError() {
    const box = document.querySelector(".error");
    if (box) {
      box.textContent = "";
      box.classList.add("hidden");
    }
  }
})();
