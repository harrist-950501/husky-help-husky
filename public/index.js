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
  const REMEMBERED_USERNAME_KEY = "rememberedUsername";

  /**
   * Initializes the auth page by wiring the form submit handler.
   */
  async function init() {
    // One handler for both login and signup.
    id("auth-form").addEventListener("submit", handleAuthSubmit);
    await restoreRememberedUsername();
  }

  /**
   * Master submit handler: decides login vs signup based on which button was pressed.
   * @param {SubmitEvent} evt - Form submit event.
   */
  async function handleAuthSubmit(evt) {
    evt.preventDefault();
    hideStauts();
    const mode = getModeFromSubmitter(evt.submitter);
    const username = valueOf("#username");
    const password = valueOf("#password");
    const email = valueOf("#email");

    const validation = validateAuthInputs(mode, username, password, email);
    if (validation !== null) {
      showStatus("Invalid input", validation, true);
    } else {
      try {
        const endpoint = mode === "signup" ? "/signup" : "/login";
        let isJson = true;
        const body = buildAuthBody(mode, username, password, email);
        let data = await dataFetch(endpoint, isJson, body);
        persistLoginAndRedirect(data);
      } catch (err) {
        if (mode === "signup") {
          showStatus("Failed signup:", err.message, true);
        } else {
          showStatus("Failed login:", err.message, true);
        }
      }
    }
  }

  /**
   * Get trimmed value of an input element.
   * @param {string} sel - CSS selector.
   * @returns {string} Trimmed value or "" if not found.
   */
  function valueOf(sel) {
    const el = qs(sel);
    return el ? el.value.trim() : "";
  }

  /**
   * Determine the auth mode ("login" or "signup") from the submitting button.
   * @param {HTMLElement|null} submitter - The button element that triggered submit.
   * @returns {string} "login" or "signup" depending on the button's data-mode.
   */
  function getModeFromSubmitter(submitter) {
    return submitter && submitter.dataset &&
      submitter.dataset.mode ? submitter.dataset.mode : "login";
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
    if (!username || !password) {
      return "Please enter both username and password.";
    }
    if (mode === "signup" && !email) {
      return "Please enter an email for signup.";
    }
    return null;
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
    let body = new FormData();
    body.append("username", username);
    body.append("password", password);
    body.append("remember", id("remember").checked);
    if (mode === "signup") {
      body.append("email", email);
    }
    return body;
  }

  /**
   * Fetches data from the given URL using GET or POST and returns the response
   * as parsed JSON or plain text.
   * @param {string} url - Endpoint URL to request.
   * @param {boolean} isJson - Whether to parse the response as JSON (true) or text.
   * @param {FormData} [postParams] - Optional form data to send via POST.
   * @returns {Object|string} Parsed JSON data or response text from the request.
   */
  async function dataFetch(url, isJson, postParams) {
    try {
      let response;
      if (postParams) {
        response = await fetch(url, {method: "POST", body: postParams});
      } else {
        response = await fetch(url);
      }
      await statusCheck(response);
      if (isJson) {
        return await response.json();
      }
      return await response.text();
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Persist the user data returned from the server and navigate to the main page.
   * @param {{id:number,username:string}} data - Server response containing user id and username.
   */
  function persistLoginAndRedirect(data) {
    localStorage.setItem("userId", data.id);
    localStorage.setItem("username", data.username);
    if (id("remember").checked) {
      localStorage.setItem(REMEMBERED_USERNAME_KEY, data.username);
    } else {
      localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    }
    window.location.href = "main-page/main.html";
  }

  /**
   * Prefills username only when a remembered username exists and session is valid.
   */
  async function restoreRememberedUsername() {
    const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
    if (!rememberedUsername) {
      return;
    }

    const validSession = await hasValidSession();
    if (validSession) {
      id("username").value = rememberedUsername;
      id("remember").checked = true;
    } else {
      localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    }
  }

  /**
   * Returns true when the current session cookie can access a protected endpoint.
   * @returns {Promise<boolean>} Whether session is still valid.
   */
  async function hasValidSession() {
    try {
      const response = await fetch("/session-status");
      await statusCheck(response);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Update the global status message area.
   * @param {string} title - Short heading text for the status area.
   * @param {string|Error} message - Detailed status text or Error.
   * @param {boolean} isError - When true, apply error styling
   */
  function showStatus(title, message, isError) {
    id("status-message").classList.remove("hidden");

    const status = id("status-message");

    status.querySelector("h2").textContent = title;
    status.querySelector("p").textContent = message;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
  }

  /**
   * Hides the status message.
   */
  function hideStauts() {
    id("status-message").classList.add("hidden");
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }
})();
