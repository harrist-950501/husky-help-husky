/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * theme.js - Light/Dark Theme Toggle
 *
 * This module implements a simple theme toggle functionality that switches
 * between light and dark themes by modifying the `data-theme` attribute
 * on the root HTML element.
 *
 * Expected DOM Structure:
 * - Button with id="theme-toggle" must exist in the document
 * - CSS should define styles for html[data-theme="dark"]
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  /**
   * Initialize theme toggle functionality.
   * Finds the theme toggle button and attaches a click handler to switch
   * between light and dark themes by toggling the data-theme attribute.
   */
  function init() {
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", toggleTheme);
    }

    let theme = localStorage.getItem("page-color-theme");
    if (!theme) {
      localStorage.setItem("page-color-theme", "light");
    } else if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }

  /**
   * Toggle between light and dark themes.
   * - Dark theme: Sets data-theme="dark" on the <html> element
   * - Light theme: Removes data-theme attribute to revert to default styles
   *
   * @listens click
   * @fires Event when data-theme attribute changes
   */
  function toggleTheme() {
    let theme = localStorage.getItem("page-color-theme");
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("page-color-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("page-color-theme", "light");
    }
  }
})();
