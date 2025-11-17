/**
 * The javascript file for histroy.html
 * It allows following interactivity:
 *    A back button to main page
 */

"use strict";
(function() {
  window.addEventListener("load", init);

  /**
   * Initialize toggle functionality.
   * Rendering item list on main page
   */
  function init() {
    id("back").addEventListener("click", back);
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