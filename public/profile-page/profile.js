/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * The javascript file for profile.html.
 * It allows the following interactivity:
 *  - Back button to main page
 *  - Load the current user's profile from the backend
 *  - Edit and save profile fields (name, address, profile image, quote)
 */

"use strict";

(function() {
  let currentUserId = null;
  const STATUS_TIMEOUT = 3000;

  window.addEventListener("load", init);

  /**
   * Initialize event listeners and load the profile.
   */
  async function init() {
    let session = null;
    try {
      session = await dataFetch("/session-status", true);
    } catch (err) {
      window.location.href = "../index.html";
      return;
    }

    if (!session || !session.loggedIn || !session.userId) {
      window.location.href = "../index.html";
      return;
    }

    currentUserId = Number(session.userId);
    localStorage.setItem("userId", String(currentUserId));

    let backBtn = id("back");
    if (backBtn) {
      backBtn.addEventListener("click", back);
    }

    let editBtn = id("edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", enableEdit);
    }

    let saveBtn = id("save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", saveChanges);
    }

    let cancelBtn = id("cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", cancelEdit);
    }

    loadProfile();
  }

  /**
   * Fetch profile information for the logged-in user and render it.
   */
  async function loadProfile() {
    try {
      const data = await dataFetch("/users/" + currentUserId + "/profile", true);
      const displayName = data['display_name'] || data.username || "";
      const address = data.address || "";
      const quote = data.quote || "";

      if (displayName && id("name-display")) {
        id("name-display").textContent = displayName;
      }
      if (address && id("address-display")) {
        id("address-display").textContent = address;
      }
      if (quote && id("quote-display")) {
        id("quote-display").textContent = quote;
      }
    } catch (err) {
      showStatus("Could not load profile.", err.message, true);
    }
  }

  /**
   * Enable editing of profile fields.
   */
  function enableEdit() {
    toggleEditMode(true);

    // Pre-fill edit fields with current display values.
    if (id("name-edit") && id("name-display")) {
      id("name-edit").value = id("name-display").textContent.trim();
    }
    if (id("address-edit") && id("address-display")) {
      id("address-edit").value = id("address-display").textContent.trim();
    }
    if (id("quote-edit") && id("quote-display")) {
      id("quote-edit").value = id("quote-display").textContent.trim();
    }
  }

  /**
   * Save changes made to profile:
   *  - Update UI optimistically
   *  - Persist changes to backend
   */
  async function saveChanges() {
    const profile = getEditedProfileValues();

    updateDisplayElements(profile);
    toggleEditMode(false);

    try {
      const ok = await persistProfile(profile);
      if (!ok) {
        showStatus("Save failed.", "Failed to save profile.", true);
      }
    } catch (err) {
      showStatus("Save failed.", "Failed to save profile.", true);
    }
  }

  /**
   * Read edit fields and return normalized profile object.
   * @returns {{displayName: string, address: string, quote: string}} A normalized
   * profile object containing the edited values (empty strings when unset).
   */
  function getEditedProfileValues() {
    return {
      displayName: id("name-edit") ? id("name-edit").value.trim() : "",
      address: id("address-edit") ? id("address-edit").value.trim() : "",
      quote: id("quote-edit") ? id("quote-edit").value.trim() : ""
    };
  }

  /**
   * Update visible display elements with the provided profile values.
   * @param {{displayName:string,address:string,quote:string}} profile - Profile values to show.
   */
  function updateDisplayElements(profile) {
    if (id("name-display") && profile.displayName) {
      id("name-display").textContent = profile.displayName;
    }
    if (id("address-display") && profile.address) {
      id("address-display").textContent = profile.address;
    }
    if (id("quote-display")) {
      id("quote-display").textContent = profile.quote;
    }
  }

  /**
   * Persist profile to backend. Returns true on success, false otherwise.
   * @param {{displayName:string,address:string,quote:string}} profile - Profile to persist.
   * @returns {Promise<boolean>} True when saved successfully, false otherwise.
   */
  async function persistProfile(profile) {
    const form = new FormData();
    form.append("displayName", profile.displayName || "");
    form.append("address", profile.address || "");
    form.append("quote", profile.quote || "");

    try {
      await dataFetch("/users/" + currentUserId + "/profile", true, form);
      showStatus("Profile saved.", "Your changes were saved successfully.", false);
      return true;
    } catch (err) {
      if (err.message) {
        showStatus("Save failed.", err.message, true);
      } else {
        showStatus("Save failed.", "Failed to save profile.", true);
      }
      return false;
    }
  }

  /**
   * Show a short status message on the profile page.
   * @param {string} title - Short heading text for the status area.
   * @param {string} message - Message text to show to the user.
   * @param {boolean} isError - When true, style the message as an error.
   */
  function showStatus(title, message, isError) {
    const status = id("status-message");
    status.classList.remove("hidden");
    qs("#status-message h2").textContent = title;
    qs("#status-message p").textContent = message;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
    setTimeout(() => {
      status.classList.add("hidden");
      status.classList.remove("error");
      qs("#status-message h2").textContent = "";
      qs("#status-message p").textContent = "";
    }, STATUS_TIMEOUT);
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
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text.
   * @param {object} res - response to check for success/error.
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Cancel editing and revert to display mode without saving.
   * (Since we never mutated display values while editing,
   * simply hiding the edit fields is enough.)
   */
  function cancelEdit() {
    toggleEditMode(false);
  }

  /**
   * Toggle between edit and display modes.
   * @param {boolean} editing - true to show edit fields, false to show display.
   */
  function toggleEditMode(editing) {
    const show = editing ? "remove" : "add";
    const hide = editing ? "add" : "remove";

    if (id("name-display")) {
      id("name-display").classList[hide]("hidden");
    }
    if (id("address-display")) {
      id("address-display").classList[hide]("hidden");
    }
    if (id("name-edit")) {
      id("name-edit").classList[show]("hidden");
    }
    if (id("address-edit")) {
      id("address-edit").classList[show]("hidden");
    }
    if (id("quote-edit")) {
      id("quote-edit").classList[show]("hidden");
    }

    if (id("edit-btn")) {
      id("edit-btn").classList[editing ? "add" : "remove"]("hidden");
    }
    if (id("save-btn")) {
      id("save-btn").classList[editing ? "remove" : "add"]("hidden");
    }
    if (id("cancel-btn")) {
      id("cancel-btn").classList[editing ? "remove" : "add"]("hidden");
    }
  }

  /**
   * Back to main page.
   */
  function back() {
    window.location.href = "../main-page/main.html";
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
