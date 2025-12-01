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
  const threeSec = 3000;

  // Cached items from the server so we can filter client-side.
  let allItems = [];
  let statusFadeTimer = null;

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
   * Creates a complete <article> item card, including media and body sections.
   * This is the main entry point used by renderItems().
   *
   * @param {Object} it - Item row from the backend (id, title, seller_id, etc.).
   * @returns {HTMLElement} The constructed <article> card element.
   */
  function createCardElement(it) {
    const card = document.createElement("article");
    card.classList.add("item");
    card.dataset.itemId = it.id;

    const media = createCardMedia();
    const body = createCardBody(it);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  /**
   * Creates the media container for an item card.
   * Currently empty since the database does not include images yet, but
   * this function exists to keep structure modular for future extension.
   *
   * @returns {HTMLElement} <div> representing the media section.
   */
  function createCardMedia() {
    const media = document.createElement("div");
    media.className = "card-media";
    return media;
  }

  /**
   * Builds the full body section for an item card, including title,
   * description, price, stock, and the Buy button.
   *
   * @param {Object} it - Full item row.
   * @returns {HTMLElement} The <div> card-body section ready to insert.
   */
  function createCardBody(it) {
    const body = document.createElement("div");
    body.className = "card-body";

    addCardTitleSection(body, it);
    addCardDescription(body, it);
    addCardPrice(body, it);
    addCardStockAndButton(body, it);

    return body;
  }

  /**
   * Inserts the item title and seller/category metadata into the card body.
   *
   * @param {HTMLElement} body - Card body container.
   * @param {Object} it - Item row with title, seller_id, and category fields.
   */
  function addCardTitleSection(body, it) {
    const h3 = document.createElement("h3");
    h3.textContent = it.title || "Item";
    body.appendChild(h3);

    const meta = document.createElement("p");
    meta.className = "muted";
    const category = it.category ? " • " + it.category : "";
    meta.textContent = "Seller #" + it.seller_id + category;
    body.appendChild(meta);
  }

  /**
   * Adds a description paragraph to the card body if the item has one.
   *
   * @param {HTMLElement} body - Card body container.
   * @param {Object} it - Item row possibly containing a description.
   */
  function addCardDescription(body, it) {
    if (!it.description) {
      return;
    }
    const desc = document.createElement("p");
    desc.className = "description";
    desc.textContent = it.description;
    body.appendChild(desc);
  }

  /**
   * Adds a formatted price line to the card body if a price is provided.
   *
   * @param {HTMLElement} body - Card body container.
   * @param {Object} it - Item row with a numeric price field.
   */
  function addCardPrice(body, it) {
    if (typeof it.price !== "number") {
      return;
    }
    const price = document.createElement("p");
    price.className = "price";
    price.textContent = "$" + it.price.toFixed(2);
    body.appendChild(price);
  }

  /**
   * Adds a stock count and Buy button to the card body. The Buy button
   * disables itself automatically for items with zero stock.
   *
   * @param {HTMLElement} body - Card body container.
   * @param {Object} it - Item row with stock and id fields.
   */
  function addCardStockAndButton(body, it) {
    if (typeof it.stock === "number") {
      const stock = document.createElement("p");
      stock.className = "stock";
      stock.textContent = "Stock: " + it.stock;
      body.appendChild(stock);
    }

    const buyBtn = document.createElement("button");
    buyBtn.type = "button";
    buyBtn.className = "buy-btn";

    if (typeof it.stock === "number" && it.stock <= 0) {
      buyBtn.disabled = true;
      buyBtn.textContent = "Out of stock";
    } else {
      buyBtn.textContent = "Buy";
      buyBtn.addEventListener("click", function() {
        handleBuy(it);
      });
    }

    body.appendChild(buyBtn);
  }

  /**
   * Public entry point for handling a user’s Buy request.
   * Delegates purchase logic to performPurchase() and reports result
   * to the user using showStatus().
   *
   * @param {Object} item - Item row containing id and price information.
   */
  function handleBuy(item) {
    performPurchase(item)
      .then(msg => showStatus(msg, false))
      .catch(err => showStatus("Could not complete purchase: " + err.message, true));
  }

  /**
   * Sends a POST /buy request to the backend and returns a resolved
   * message string on success, or rejects with an Error on failure.
   * Also triggers a refresh via loadItems() after a successful purchase.
   *
   * @param {Object} item - Item being purchased.
   * @returns {Promise<string>} Resolves with success message text.
   */
  async function performPurchase(item) {
    const resp = await fetch("/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BUYER_ID: CURRENT_USER_ID,
        ITEM_ID: item.id
      })
    });

    const text = await resp.text();

    if (!resp.ok) {
      throw new Error(text || "Purchase failed.");
    }

    loadItems().catch(err => {
      console.error("Error reloading items:", err);
    });

    return text || "Purchase complete!";
  }

  /**
   * Updates the status message text and fades it in, then automatically
   * fades it out after a short delay by toggling a "visible" CSS class.
   *
   * @param {string} message - Message text to display.
   * @param {boolean} isError - Whether to style the message as an error.
   * @returns {String} message.
   */
  function showStatus(message, isError) {
    const status = id("status-message");
    if (!status) {
      return message;
    }

    if (statusFadeTimer !== null) {
      clearTimeout(statusFadeTimer);
      statusFadeTimer = null;
    }

    status.textContent = message;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
    status.classList.add("visible");

    statusFadeTimer = setTimeout(function() {
      status.classList.remove("visible");
      statusFadeTimer = null;
    }, threeSec);
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