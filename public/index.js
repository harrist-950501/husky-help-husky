/**
<<<<<<< HEAD
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * index.js – Handles login and signup with backend authentication.
 *
 * Flow:
 *  - User fills username/password (and email for signup)
 *  - Clicks "Log In" → POST /login
 *  - Clicks "Sign Up" → POST /signup
 *  - Backend sets session cookie and returns {id, username}
 *  - We store id/username in localStorage and go to main page
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  /**
   * Initializes the auth page by wiring the form submit handler.
   */
  function init() {
    const form = document.querySelector("#auth-form") || document.querySelector("form");
    if (!form) {
      console.error("Auth form not found on index.html");
      return;
    }

    // One handler for both login and signup.
    form.addEventListener("submit", handleAuthSubmit);
  }

  /**
   * Master submit handler: decides login vs signup based on which button was pressed.
   * @param {SubmitEvent} evt - Form submit event.
   */
  async function handleAuthSubmit(evt) {
    evt.preventDefault();
    hideError();

    // identify which button was clicked
    const button = evt.submitter;
    const mode = button && button.dataset.mode ? button.dataset.mode : "login";

    const username = valueOf("#username");
    const password = valueOf("#password");
    const email = valueOf("#email"); // may be empty for login

    if (!username || !password) {
      return showError("Please enter both username and password.");
    }

    if (mode === "signup" && !email) {
      return showError("Please enter an email for signup.");
    }

    const endpoint = mode === "signup" ? "/signup" : "/login";
    const body = {username, password};

    if (mode === "signup") {
      body.email = email;
    }

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || "Authentication failed.");
      }

      const data = await resp.json();

      // Save logged-in user ID & name for later pages (history, etc.)
      localStorage.setItem("userId", data.id);
      localStorage.setItem("username", data.username);

      window.location.href = "main-page/main.html";
    } catch (err) {
      console.error(err);
      showError(err.message || "Network error. Please try again.");
    }
  }

  /**
   * Get trimmed value of an input element.
   * @param {string} sel - CSS selector.
   * @returns {string} Trimmed value or "" if not found.
   */
  function valueOf(sel) {
    const el = document.querySelector(sel);
    return el ? el.value.trim() : "";
  }

  /**
   * Displays an error message in #error or .error element.
   * @param {string} msg - Message to display.
   */
  function showError(msg) {
    const box = document.querySelector("#error") || document.querySelector(".error");
    if (box) {
      box.textContent = msg;
      box.classList.remove("hidden");
    } else {
      alert(msg);
    }
  }

  /**
   * Hides the error box if present.
   */
  function hideError() {
    const box = document.querySelector("#error") || document.querySelector(".error");
    if (box) {
      box.textContent = "";
      box.classList.add("hidden");
    }
  }

  /**
   * Logout handler (used from other pages, not index.html).
   * Clears cookie server-side and redirects to login page.
   */
  async function logout() {
    try {
      await fetch("/logout", {method: "POST"});
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      window.location.href = "../index.html";
    } catch (err) {
      console.error(err);
    }
  }

  window.logout = logout;
})();