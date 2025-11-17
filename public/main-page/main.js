/**
 * main.js (frontend-only)
 * Renders a small static list of items, with basic search and a layout toggle.
 * No networking, no storage.
 * Expected DOM:
 * - #search-bar
 * - #layout-toggle (optional)
 * - #item-grid
 *
 * It allows following interactivity:
 *    A logout button to login page
 *    In navigation bar, move to the target page
 */

"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  // Tiny demo dataset. Replace with fetch later.
  const ITEMS = [
    {id: "bk-101", name: "CSE 143 Textbook", price: 25, image: "", tags: ["textbook", "cs"]},
    {id: "lp-210", name: "Linear Algebra Notes", price: 5, image: "", tags: ["notes", "math"]},
    {id: "kb-330", name: "Mechanical Keyboard", price: 45, image: "", tags: ["electronics"]},
    {id: "cs-500", name: "Laptop Stand", price: 12, image: "", tags: ["accessories"]}
  ];

  const MSECOND = 100;

  /**
   * Initialize toggle functionality.
   * Rendering item list on main page
   */
  function init() {
    renderItems(ITEMS);
    const search = id("search-bar");
    if (search) {
      search.addEventListener("input", debounce(onSearch, MSECOND * 2));
    }
    const layoutBtn = id("layout-toggle");
    if (layoutBtn) {
      layoutBtn.addEventListener("click", toggleLayout);
    }
    id("logout-btn").addEventListener("click", logout);
    id("open-history-page").addEventListener("click", openHistroyPage);
    id("open-profile-page").addEventListener("click", openProfilePage);
  }

  /**
   * Logout. Back to login page
   */
  function logout() {
    window.location.href = "../login-page/login.html";
  }

  /**
   * Open transaction histroy page
   */
  function openHistroyPage() {
    window.location.href = "../history-page/history.html";
  }

  /**
   * Open profile page
   */
  function openProfilePage() {
    window.location.href = "../profile-page/profile.html";
  }

  /**
   * Handle search input events.
   * Filters the `ITEMS` array by searching against the item name and tags.
   *
   * @param {InputEvent} evt - The input event from the search element. The
   *   function reads `evt.target.value` to form the query.
   */
  function onSearch(evt) {
    const que = (evt.target.value || "").trim().toLowerCase();
    const list = ITEMS.filter(it => {
      const hay = [it.name, (it.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(que) >= 0;
    });
    renderItems(list);
  }

  /**
   * Toggle the item grid layout between grid and list views.
   * Adds/removes the `list` class on the `#item-grid` element. The CSS in
   * the project should define styles for `.list` to change the layout.
   */
  function toggleLayout() {
    const grid = id("item-grid");
    if (grid) {
      grid.classList.toggle("list");
    }
  }

  /**
   * Render a collection of item objects into the DOM element with id
   * `item-grid`.
   *
   * @param {Array<Object>} items - Array of item objects to render. Each item
   *   is expected to have `id`, `name`, `price`, `image`, and `tags` fields.
   * @returns {String} An warning of grid not found and nothing to render.
   *
   * If `items` is empty, the function inserts a muted "No items found." message.
   */
  function renderItems(items) {
    const grid = id("item-grid");
    if (!grid) {
      /*
       * If the expected container is missing, nothing to render.
       * Keep the behavior silent for the UI but log to aid debugging.
       */
      return "renderItems: #item-grid not found";
    }

    // Clear existing children without using innerHTML for safety.
    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    if (!items || !items.length) {
      const pTag = document.createElement("p");
      pTag.className = "muted";
      pTag.textContent = "No items found.";
      grid.appendChild(pTag);
      return;
    }

    items.forEach(it => {
      const card = createCardElement(it);
      grid.appendChild(card);
    });
  }

  /**
   * Create a DOM element representing an item card.
   * Uses DOM APIs (createElement, appendChild, textContent) instead of
   * setting `innerHTML` so content is safer and easier to manipulate.
   *
   * @param {Object} it - Item object.
   * @returns {HTMLElement} The constructed <article> element ready to append.
   */
  function createCardElement(it) {
    const card = document.createElement("article");
    card.classList.add("item");

    const media = document.createElement("div");
    media.className = "card-media";
    if (it.image) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = it.image;
      media.appendChild(img);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const h3 = document.createElement("h3");
    h3.textContent = it.name || "Item";
    body.appendChild(h3);

    if (it.price !== null && it.price !== undefined) {
      const pTag = document.createElement("p");
      pTag.className = "price";
      pTag.textContent = "$" + it.price;
      body.appendChild(pTag);
    }

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  /**
   * Return a debounced version of `fn` that waits `ms` milliseconds after the
   * last call before invoking. Useful for throttling rapid input events like
   * `input` on a text field.
   *
   * @param {Function} fn - Function to debounce.
   * @param {number} ms - Milliseconds to wait; defaults to SECOND constant.
   * @returns {Function} Debounced wrapper function.
   */
  function debounce(fn, ms) {
    let timer = null;
    return function() {
      clearTimeout(timer);
      const args = arguments;
      timer = setTimeout(function() {
        fn.apply(null, args);
      }, ms || MSECOND * 2);
    };
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