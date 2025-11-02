/**
 * login.js - Simple Login Form Handler
 *
 * This module implements a basic client-side login form validation.
 * Note: This is a minimal demo implementation - it only checks for non-empty
 * fields and does not perform actual authentication.
 *
 * Page Flow:
 * 1. User enters credentials
 * 2. On submit:
 *    - If both fields are non-empty → redirect to main.html
 *    - If any field is empty → show error message
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  /**
   * Initialize the login form handler.
   * Sets up the submit event listener on the form.
   *
   * @returns {void}
   * @throws {Error} If the form element is not found in the DOM
   */
  function init() {
    const form = document.querySelector("form");
    if (!form) {
      return "Cannot select form";
    }
    form.addEventListener("submit", onSubmit);
  }

  /**
   * Handle form submission events.
   * Validates the form and either shows an error or redirects to main.html.
   *
   * @param {SubmitEvent} evt - The form submission event
   * @returns {void}
   */
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

  /**
   * Get the trimmed value of an input element.
   *
   * @param {string} sel - CSS selector for the input element
   * @returns {string} The trimmed value of the input, or empty string if
   *                   the element is not found
   */
  function valueOf(sel) {
    const el = document.querySelector(sel);
    return el ? el.value.trim() : "";
  }

  /**
   * Display an error message in the .error element.
   *
   * @param {string} msg - The error message to display
   */
  function showError(msg) {
    const box = document.querySelector(".error");
    if (box) {
      box.textContent = msg;
      box.classList.remove("hidden");
    }
  }

  /**
   * Hide the error message box and clear its content.
   */
  function hideError() {
    const box = document.querySelector(".error");
    if (box) {
      box.textContent = "";
      box.classList.add("hidden");
    }
  }
})();
