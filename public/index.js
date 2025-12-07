/**
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


  /**
   * Determine the auth mode ("login" or "signup") from the submitting button.
   * @param {HTMLElement|null} submitter - The button element that triggered submit.
   * @returns {string} "login" or "signup" depending on the button's data-mode.
   */
    const mode = getModeFromSubmitter(evt.submitter);
    const username = valueOf("#username");
    const password = valueOf("#password");
    const email = valueOf("#email");

    const validation = validateAuthInputs(mode, username, password, email);
    if (validation !== true) {
      return showError(validation);
    }

    const endpoint = mode === "signup" ? "/signup" : "/login";
    const body = buildAuthBody(mode, username, password, email);

    try {
      const data = await sendAuthRequest(endpoint, body);
      persistLoginAndRedirect(data);
    } catch (err) {
      console.error(err);
      showError(err.message || "Network error. Please try again.");
    }
  }

  function getModeFromSubmitter(submitter) {
    return submitter && submitter.dataset && submitter.dataset.mode ? submitter.dataset.mode : "login";
  }

  /**
   * Validate form input values for auth.
   * @param {string} mode - "login" or "signup".
   * @param {string} username - Username value.
   * @param {string} password - Password value.
   * @param {string} email - Email value (may be empty for login).
   * @returns {true|string} Returns true when valid, otherwise an error message string.
   */
  function validateAuthInputs(mode, username, password, email) {
    if (!username || !password) return "Please enter both username and password.";
    if (mode === "signup" && !email) return "Please enter an email for signup.";
    return true;
  }

  /**
   * Build the request body object for authentication requests.
   * @param {string} mode - "login" or "signup".
   * @param {string} username - Username value.
   * @param {string} password - Password value.
   * @param {string} email - Email value (for signup).
   * @returns {Object} Plain object suitable for JSON.stringify in fetch body.
   */
  function buildAuthBody(mode, username, password, email) {
    const body = {username, password};
    if (mode === "signup") body.email = email;
    return body;
  }

  /**
   * Send authentication request to the server and return parsed JSON on success.
   * @param {string} endpoint - API endpoint (e.g. "/login" or "/signup").
   * @param {Object} body - Plain object to be JSON-stringified as request body.
   * @returns {Promise<Object>} Parsed JSON response from server.
   * @throws {Error} When response is not ok; error message contains server text.
   */
  async function sendAuthRequest(endpoint, body) {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg || "Authentication failed.");
    }
    return resp.json();
  }

  /**
   * Persist the user data returned from the server and navigate to the main page.
   * @param {{id:number,username:string}} data - Server response containing user id and username.
   */
  function persistLoginAndRedirect(data) {
    localStorage.setItem("userId", data.id);
    localStorage.setItem("username", data.username);
    window.location.href = "main-page/main.html";
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