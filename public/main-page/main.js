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

    // const search = id("search-bar");
    // if (search) {
    //   search.addEventListener("input", debounce(onSearch, MSECOND * 2));
    // }

    const layoutBtn = id("layout-toggle");
    if (layoutBtn) {
      layoutBtn.addEventListener("click", toggleLayout);
    }

    id("nav-toggle-btn").addEventListener("click", navToggle);
    id("logout-btn").addEventListener("click", logout);
    id("open-history-page").addEventListener("click", openHistroyPage);
    id("open-profile-page").addEventListener("click", openProfilePage);
  }

  function navToggle() {
    qs("aside").classList.toggle("collapsed");
    qs("aside h1").classList.toggle("hidden");
    qs("aside section").classList.toggle("hidden");
    qs("aside footer").classList.toggle("hidden");
  }

  /**
   * Fetch items from backend and render them.
   */
  async function loadItems() {
    let board = id("item-board");
    // board.textContent = "Loading items...";

    try {
      let res = await fetch("/items");
      res = await statusCheck(res);
      // if (!resp.ok) {
      //   const msg = await resp.text();
      //   throw new Error(msg || "Failed to load items.");
      // }

      let items = await res.json();
      items.forEach(item => {
        let card = createCardElement(item);
        board.appendChild(card);
      })
      // allItems = Array.isArray(data) ? data : [];
      // renderItems(allItems);
    } catch (err) {
      console.error(err);
      board.textContent = "Could not load items.";
    }
  }

  /**
   * Logout. Back to login page
   */
  function logout() {
    window.location.href = "../index.html";
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
   * @param {Object} item - Item row from the backend (id, title, seller_id, etc.).
   * @returns {HTMLElement} The constructed <article> card element.
   */
  function createCardElement(item) {
    let card = gen("article");
    card.classList.add("item-card");
    // card.id = item.id;

    // card.appendChild(metainfo);


    // let body = createCardBody(item);

    card.appendChild(createCardImg(item.title));
    card.appendChild(createCardMeta(item.title, item.price));
    return card;
  }

    /**
   * Converts a user name into an avatar image path by lowercasing it,
   * replacing spaces with hyphens, and appending the ".png" extension.
   * @param {string} name - User name to convert into an image file path.
   * @return {string} - Relative path to the corresponding avatar image.
   */
  function parseName(name) {
    name = name.toLowerCase();
    let result = "../img/";
    result += name.split(" ").join("-");
    result += ".jpg";
    return result;
  }

  /**
   * Creates the card container for an item card.
   * @param {Object} title - title of item.
   * @returns {HTMLElement} a <section> representing the imgae section.
   */
  function createCardImg(title) {
    let imgContainer = gen("section");
    imgContainer.classList.add("img-container");

    let img = gen("img");
    img.src = parseName(title);
    img.alt = title;

    imgContainer.appendChild(img);
    return imgContainer;
  }

  /**
   * Builds the meta info section for an item card, including title,
   * rating, price, and the add-to-cart button.
   * @param {Object} ItemTitle - title of item.
   * @param {Object} itemPrice - price of item.
   * @returns {HTMLElement} The <div> card-body section ready to insert.
   */
  function createCardMeta(ItemTitle, itemPrice) {
    let metainfo = gen("section");
    metainfo.classList.add("metainfo");

    let title = gen("h2");
    title.textContent = ItemTitle;
    title.classList.add("title");

    let rating = gen("p");
    rating.textContent = "★★★★☆ ";
    rating.classList.add("rating");

    let ratingNum = gen("span");
    ratingNum.textContent = "4 / 5";

    rating.appendChild(ratingNum);

    let price = gen("p");
    price.textContent = "$" + itemPrice;
    price.classList.add("price");

    let cartBtn = gen("button");
    cartBtn.textContent = "Add to cart";

    metainfo.appendChild(title);
    metainfo.appendChild(rating);
    metainfo.appendChild(price);
    metainfo.appendChild(cartBtn);

    return metainfo;
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
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} res - response to check for success/error
   * @return {object} - valid response if response was successful, otherwise rejected
   *                    Promise result
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Returns first element matching selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} - DOM object associated selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
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
   * Returns a element with the given tagname.
   * @param {string} tagname - HTML element tagname
   * @returns {HTMLElement} a HTML element that hasn't bind with DOM yet.
   */
  function gen(tagname) {
    return document.createElement(tagname);
  }
})();