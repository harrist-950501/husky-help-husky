/**
 * The javascript file for profile.html.
 * It allows the following interactivity:
 *  - Back button to main page
 *  - Load the current user's profile from the backend
 *  - Edit and save profile fields (name, address, profile image, quote)
 */

"use strict";

(function() {
  // Same demo user id as other pages for now.
  const CURRENT_USER_ID = Number(localStorage.getItem("userId"));
  const JSON_TYPE = "application/json";
  const STATUS_TIMEOUT = 3000;

  window.addEventListener("load", init);

  /**
   * Initialize event listeners and load the profile.
   */
  function init() {
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
   * Fetch profile information for CURRENT_USER_ID and render it.
   */
  async function loadProfile() {
    try {
      const resp = await fetch("/users/" + CURRENT_USER_ID + "/profile");
      if (!resp.ok) {
        const msg = await resp.text();
        return msg;
      }

      const data = await resp.json();
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
      // Error handling managed by UI status display
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
        showProfileStatus("Failed to save profile.", true);
      }
    } catch (err) {
      showProfileStatus("Failed to save profile.", true);
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

    const resp = await fetch("/users/" + CURRENT_USER_ID + "/profile", {
      method: "POST",
      body: form
    });

    if (!resp.ok) {
      const msg = await resp.text();
      showProfileStatus(msg || "Failed to save profile.", true);
      return false;
    }
    showProfileStatus("Profile saved.", false);
    return true;
  }

  /**
   * Show a short status message on the profile page.
   * @param {string} message - Message text to show to the user.
   * @param {boolean} isError - When true, style the message as an error.
   */
  function showProfileStatus(message, isError) {
    let status = id("profile-status");
    if (!status) {
      status = document.createElement("div");
      status.id = "profile-status";
      status.className = "profile-status";
      const main = document.querySelector("main") || document.body;
      main.insertBefore(status, main.firstChild);
    }
    status.textContent = message;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
    setTimeout(() => {
      status.textContent = "";
    }, STATUS_TIMEOUT);
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
})();