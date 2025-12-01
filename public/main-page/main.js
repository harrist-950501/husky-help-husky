/**
 * main.js
 * Renders marketplace items from the backend, supports search, layout toggle,
 * logout/navigation, and basic "buy" functionality.
 *
 * Backend endpoints used:
 *  - GET  /items
 *  - POST /buy
 */

"use strict";

(function() {
  // For now, assume demo logged-in user with id = 1 (see husky.db users table).
  const CURRENT_USER_ID = 1;
  const MSECOND = 100;

  // Cached items from the server so we can filter client-side.
  let allItems = [];

  window.addEventListener("DOMContentLoaded", init);

  /**
   * Initialize page: load items, hook up search, layout toggle, and nav.
   */
  function init() {
    loadItems();

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
   * Fetch items from backend and render them.
   */
  async function loadItems() {
    const grid = id("item-grid");
    if (grid) {
      grid.textContent = "Loading items...";
    }

    try {
      const resp = await fetch("/items");
      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || "Failed to load items.");
      }

      const data = await resp.json();
      // Expect data to be an array of rows from items table.
      allItems = Array.isArray(data) ? data : [];
      renderItems(allItems);
    } catch (err) {
      console.error(err);
      if (grid) {
        grid.textContent = "Could not load items.";
      }
    }
  }

  /**
   * Logout. Back to login page
   */
  function logout() {
    window.location.href = "../login-page/login.html";
  }

  /**
   * Open transaction history page
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
   * Filters cached items by searching against title and category.
   *
   * @param {InputEvent} evt - The input event from the search element.
   */
  function onSearch(evt) {
    const que = (evt.target.value || "").trim().toLowerCase();
    const source = allItems || [];
    if (!que) {
      renderItems(source);
      return;
    }

    const list = source.filter(it => {
      const title = (it.title || "").toLowerCase();
      const category = (it.category || "").toLowerCase();
      return title.indexOf(que) >= 0 || category.indexOf(que) >= 0;
    });
    renderItems(list);
  }

  /**
   * Toggle the item grid layout between grid and list views.
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
   * @param {Array<Object>} items - Array of item rows from the items table.
   */
  function renderItems(items) {
    const grid = id("item-grid");
    if (!grid) {
      return;
    }

    // Clear existing children.
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
   *
   * Expects backend item row shape:
   * {
   *   id: number,
   *   seller_id: number,
   *   title: string,
   *   category: string,
   *   description: string,
   *   price: number,
   *   stock: number,
   *   status: string | null,
   *   date: string
   * }
   *
   * @param {Object} it - Item object.
   * @returns {HTMLElement} The constructed <article> element.
   */
  function createCardElement(it) {
    const card = document.createElement("article");
    card.classList.add("item");
    card.dataset.itemId = it.id;

    const media = document.createElement("div");
    media.className = "card-media";
    // No image column in DB yet, so leave empty or add a placeholder later.

    const body = document.createElement("div");
    body.className = "card-body";

    const h3 = document.createElement("h3");
    h3.textContent = it.title || "Item";
    body.appendChild(h3);

    const meta = document.createElement("p");
    meta.className = "muted";
    const category = it.category ? " • " + it.category : "";
    meta.textContent = "Seller #" + it.seller_id + category;
    body.appendChild(meta);

    if (it.description) {
      const desc = document.createElement("p");
      desc.className = "description";
      desc.textContent = it.description;
      body.appendChild(desc);
    }

    if (typeof it.price === "number") {
      const price = document.createElement("p");
      price.className = "price";
      price.textContent = "$" + it.price.toFixed(2);
      body.appendChild(price);
    }

    if (typeof it.stock === "number") {
      const stock = document.createElement("p");
      stock.className = "stock";
      stock.textContent = "Stock: " + it.stock;
      body.appendChild(stock);
    }

    const buyBtn = document.createElement("button");
    buyBtn.type = "button";
    buyBtn.className = "buy-btn";
    buyBtn.textContent = "Buy";

    // Disable button if out of stock.
    if (typeof it.stock === "number" && it.stock <= 0) {
      buyBtn.disabled = true;
      buyBtn.textContent = "Out of stock";
    } else {
      buyBtn.addEventListener("click", function() {
        handleBuy(it);
      });
    }

    body.appendChild(buyBtn);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  /**
   * Handles buy button click: confirm and call backend /buy.
   * @param {Object} item - item object.
   */
  async function handleBuy(item) {
    const ok = window.confirm(
      "Buy \"" + (item.title || "this item") + "\" for $" + item.price + "?"
    );
    if (!ok) {
      return;
    }

    let purchaseDone = false;

    try {
      const resp = await fetch("/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          buyer_id: CURRENT_USER_ID,
          item_id: item.id
        })
      });

      const text = await resp.text();

      if (!resp.ok) {
        // This is a *real* backend error (missing params, out of stock, etc.)
        throw new Error(text || "Purchase failed.");
      }

      purchaseDone = true;
      alert(text || "Purchase complete!"); // "Item purchased successfully"

    } catch (err) {
      console.error(err);

      // If the fetch/response already succeeded but *something else* blew up
      // (like some DOM/string pattern issue), don't lie about the purchase.
      if (purchaseDone) {
        alert("Purchase succeeded, but we had trouble updating the page. " +
              "Please refresh to see the latest stock.");
      } else {
        alert("Could not complete purchase: " + err.message);
      }

      return; // don’t fall through to loadItems
    }

    // Reload items *after* purchase; if this throws, just log it, no scary alert.
    loadItems().catch(err => {
      console.error("Error reloading items:", err);
    });
  }

  /**
   * Return a debounced version of `fn` that waits `ms` milliseconds after the
   * last call before invoking it.
   *
   * @param {Function} fn - function to debounce.
   * @param {number} ms - delay in milliseconds.
   * @returns {Function} debounced function.
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