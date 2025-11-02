/* main.js (frontend-only)
 * Renders a small static list of items, with basic search and a layout toggle.
 * No networking, no storage.
 * Expected DOM:
 * - #search-bar
 * - #layout-toggle (optional)
 * - #item-grid
 */
"use strict";

(function() {
  window.addEventListener("DOMContentLoaded", init);

  // Tiny demo dataset. Replace with fetch later.
  const ITEMS = [
    {id: "bk-101", name: "CSE 143 Textbook", price: 25, image: "", tags: ["textbook","cs"]},
    {id: "lp-210", name: "Linear Algebra Notes", price: 5, image: "", tags: ["notes","math"]},
    {id: "kb-330", name: "Mechanical Keyboard", price: 45, image: "", tags: ["electronics"]},
    {id: "cs-500", name: "Laptop Stand", price: 12, image: "", tags: ["accessories"]}
  ];

  function init() {
    renderItems(ITEMS);
    const search = document.getElementById("search-bar");
    if (search) {
      search.addEventListener("input", debounce(onSearch, 200));
    }
    const layoutBtn = document.getElementById("layout-toggle");
    if (layoutBtn) {
      layoutBtn.addEventListener("click", toggleLayout);
    }
  }

  function onSearch(evt) {
    const que = (evt.target.value || "").trim().toLowerCase();
    const list = ITEMS.filter(it => {
      const hay = [it.name, (it.tags||[]).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(que) >= 0;
    });
    renderItems(list);
  }

  function toggleLayout() {
    const grid = document.getElementById("item-grid");
    if (grid) {
      grid.classList.toggle("list");
    }
  }

  function renderItems(items) {
    const grid = document.getElementById("item-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!items || !items.length) {
      const pTag = document.createElement("p");
      pTag.className = "muted";
      pTag.textContent = "No items found.";
      grid.appendChild(pTag);
      return;
    }
    items.forEach(it => {
      const card = document.createElement("article");
      card.className = "item-card";
      card.innerHTML = cardHTML(it);
      grid.appendChild(card);
    });
  }

  function cardHTML(it) {
    const img = it.image ? '<img alt="" src="' + it.image + '">' : "";
    const price = (it.price != null) ? "$" + it.price : "";
    const title = it.name || "Item";
    return [
      '<div class="card-media">', img, "</div>",
      '<div class="card-body">',
        "<h3>", title, "</h3>",
        price ? '<p class="price">' + price + "</p>" : "",
      "</div>"
    ].join("");
  }

  // Minimal debounce (no utils.js)
  function debounce(fn, ms) {
    let timer = null;
    return function() {
      clearTimeout(timer);
      const args = arguments;
      timer = setTimeout(function() { fn.apply(null, args); }, ms || 200);
    };
  }
})();
