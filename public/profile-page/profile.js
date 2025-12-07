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
  const CURRENT_USER_ID = 1;
  const JSON_TYPE = "application/json";

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
        // Leave default placeholder values in the DOM.
        const msg = await resp.text();
        console.error("Failed to load profile:", msg);
        return;
      }

      const data = await resp.json();
      const displayName = data.display_name || data.username || "";
      const address = data.address || "";
      const img = data.profile_img || "";
      const quote = data.quote || "";

      if (displayName && id("name-display")) {
        id("name-display").textContent = displayName;
      }
      if (address && id("address-display")) {
        id("address-display").textContent = address;
      }
      if (img && id("profile-pic")) {
        id("profile-pic").src = img;
      }
      if (quote && id("quote-display")) {
        id("quote-display").textContent = quote;
      }
    } catch (err) {
      console.error(err);
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
    if (id("img-edit") && id("profile-pic")) {
      id("img-edit").value = id("profile-pic").getAttribute("src") || "";
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
    const newName = id("name-edit") ? id("name-edit").value.trim() : "";
    const newAddress = id("address-edit") ? id("address-edit").value.trim() : "";
    const newImg = id("img-edit") ? id("img-edit").value.trim() : "";
    const newQuote = id("quote-edit") ? id("quote-edit").value.trim() : "";

    // Update display elements.
    if (id("name-display") && newName) {
      id("name-display").textContent = newName;
    }
    if (id("address-display") && newAddress) {
      id("address-display").textContent = newAddress;
    }
    if (id("profile-pic") && newImg) {
      id("profile-pic").src = newImg;
    }
    if (id("quote-display")) {
      id("quote-display").textContent = newQuote;
    }

    toggleEditMode(false);

    // Persist to backend.
    try {
      const resp = await fetch("/users/" + CURRENT_USER_ID + "/profile", {
        method: "POST",
        headers: {
          "Content-Type": JSON_TYPE
        },
        body: JSON.stringify({
          display_name: newName,
          address: newAddress,
          profile_img: newImg,
          quote: newQuote
        })
      });

      if (!resp.ok) {
        const msg = await resp.text();
        alert(msg || "Failed to save profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    }
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
    if (id("img-edit")) {
      id("img-edit").classList[show]("hidden");
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