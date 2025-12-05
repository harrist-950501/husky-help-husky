/**
 * index.js – Handles real login with backend authentication.
 *
 * Flow:
 * 1. User submits login form
 * 2. Script sends POST /login to backend with username/password
 * 3. If backend validates credentials:
 *      - Backend sets login cookie
 *      - Redirect to main-page/main.html
 * 4. If invalid:
 *      - Show error message on login page
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  /**
   * Initialize the login form handler.
   * This attaches the real login handler (handleLogin) to the form submit event.
   */
  function init() {
    const form = document.querySelector("form");
    if (!form) {
      console.error("Login form not found on index.html");
      return;
    }
    form.addEventListener("submit", handleLogin);
  }

  /**
   * Reads the value of a text input and trims whitespace.
   *
   * @param {string} sel - CSS selector for the input
   * @returns {string}
   */
  function valueOf(sel) {
    const el = document.querySelector(sel);
    return el ? el.value.trim() : "";
  }

  /**
   * Shows an error message inside the .error box.
   *
   * @param {string} msg - Message to display
   */
  function showError(msg) {
    const box = document.querySelector(".error");
    if (box) {
      box.textContent = msg;
      box.classList.remove("hidden");
    }
  }

  /**
   * Clears and hides the error message box.
   */
  function hideError() {
    const box = document.querySelector(".error");
    if (box) {
      box.textContent = "";
      box.classList.add("hidden");
    }
  }

  /**
   * REAL LOGIN HANDLER — Called when user submits the login form.
   * Sends a POST /login request to backend.
   *
   * @param {SubmitEvent} evt
   */
  async function handleLogin(evt) {
    evt.preventDefault();
    hideError();

    const username = valueOf("#username");
    const password = valueOf("#password");

    if (!username || !password) {
      return showError("Please enter both username and password.");
    }

    try {
      const resp = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (resp.ok) {
        const data = await resp.json();

        // remember logged-in user for other pages
        localStorage.setItem("userId", data.id);
        localStorage.setItem("username", data.username);
        window.location.href = "main-page/main.html";
      } else {
        showError(await resp.text());
      }
    } catch (err) {
      console.error(err);
      showError("Network error. Please try again.");
    }
  }

  /**
   * LOGOUT HANDLER — Can be called from any page.
   * Sends POST /logout and clears cookie server-side.
   */
  async function logout() {
    try {
      await fetch("/logout", { method: "POST" });
      window.location.href = "../index.html";
    } catch (err) {
      console.error(err);
    }
  }
})();