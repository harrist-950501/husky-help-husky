/**
 * The javascript file for profile.html
 * It allows following interactivity:
 *    A back button to main page
 */

"use strict";
(function() {
  window.addEventListener("load", init);

  /**
   * Initialize toggle functionality and event listeners
   */
  function init() {
    id("back").addEventListener("click", back);
    id("edit-btn").addEventListener("click", enableEdit);
    id("save-btn").addEventListener("click", saveChanges);
    id("cancel-btn").addEventListener("click", cancelEdit);
  }

  /**
   * Enable editing of profile fields
   */
  function enableEdit() {
    // Hide display elements and show edit fields
    id("name-display").classList.add("hidden");
    id("address-display").classList.add("hidden");
    id("name-edit").classList.remove("hidden");
    id("address-edit").classList.remove("hidden");
    
    // Show save and cancel buttons, hide edit button
    id("edit-btn").classList.add("hidden");
    id("save-btn").classList.remove("hidden");
    id("cancel-btn").classList.remove("hidden");

    // Set current values in edit fields
    id("name-edit").value = id("name-display").textContent.trim();
    id("address-edit").value = id("address-display").textContent.trim();
  }

  /**
   * Save changes made to profile
   */
  function saveChanges() {
    // Get new values
    const newName = id("name-edit").value.trim();
    const newAddress = id("address-edit").value.trim();

    // Update display elements
    id("name-display").textContent = newName;
    id("address-display").textContent = newAddress;

    // Return to display mode
    disableEdit();
  }

  /**
   * Cancel editing and revert changes
   */
  function cancelEdit() {
    disableEdit();
  }

  /**
   * Disable editing mode and show display elements
   */
  function disableEdit() {
    // Show display elements and hide edit fields
    id("name-display").classList.remove("hidden");
    id("address-display").classList.remove("hidden");
    id("name-edit").classList.add("hidden");
    id("address-edit").classList.add("hidden");

    // Show edit button, hide save and cancel buttons
    id("edit-btn").classList.remove("hidden");
    id("save-btn").classList.add("hidden");
    id("cancel-btn").classList.add("hidden");
  }

  /**
   * Back to main page
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