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
  const BASE_URL = "http://localhost:8000/"

  // For now, assume demo logged-in user with id = 1 (see husky.db users table).
  // const CURRENT_USER_ID = 1;
  // const MSECOND = 100;
  // const threeSec = 3000;

  window.addEventListener("DOMContentLoaded", init);

  /**
   * Initialize page: load items, hook up search, layout toggle, and nav.
   */
  async function init() {
    loadItems();

    id("search-bar").addEventListener("input", checkSearch);
    id("search-btn").addEventListener("click", itemSearch);
    id("search-btn").disabled = "true";
    id("unsearch-btn").addEventListener("click", loadItems);
    id("category-filter").addEventListener("change", checkFilter);

    // id("layout-toggle").addEventListener("click", toggleLayout);

    id("nav-toggle-btn").addEventListener("click", navToggle);
    // navToggle();
    id("logout-btn").addEventListener("click", logout);
    id("open-history-page").addEventListener("click", openHistroyPage);
    id("open-profile-page").addEventListener("click", openProfilePage);
  }

  /**
   * Enables or disables the search button depending on whether
   * a category in filter is selected.
   */
  function checkFilter() {
    if (this.value !== "") {
      id("search-btn").disabled = false;
    } else {
      id("search-btn").disabled = true;
    }
  }

  /**
   * Enables or disables the search button depending on whether
   * the search input has any non-whitespace characters.
   */
  function checkSearch() {
    if (this.value.trim() !== "") {
      id("search-btn").disabled = false;
    } else {
      id("search-btn").disabled = true;
    }
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
    board.innerHTML = "";
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
   * Performs a search for Yips containing the current search term,
   * and only shows those whose ids are returned by the API (others are hidden).
   */
  async function itemSearch() {
    // id("item-detail-view").classList.remove("hidden");
    // id("item-board").classList.add("hidden");
    // qs("aside").classList.add("collapsed");

    let url = "items/search?";
    let keyword = id("search-bar").value.trim();
    if (keyword !== "") {
      url += "search=" + keyword + "&";
    }
    let category = id("category-filter").value;
    if (category !== "") {
      url += "filter=" + category;
    }
    console.log(url);
    let isJson = true;
    let searchItems = await dataFetch(BASE_URL + url, isJson);
    id("search-btn").disabled = true;

    let items = qsa(".item-card");
    items.forEach(item => {
      item.classList.add("hidden");
    });

    searchItems.forEach(item => {
      id(item.id).classList.remove("hidden");
    });
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
    card.id = item.id;

    card.appendChild(createCardImg(item.title));
    card.appendChild(createCardMeta(item));
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
   * @param {Object} item - item row with needed data.
   * @returns {HTMLElement} The <div> card-body section ready to insert.
   */
  function createCardMeta(item) {
    let metainfo = gen("section");
    metainfo.classList.add("metainfo");

    let title = gen("h2");
    title.textContent = item.title;
    title.classList.add("title");

    let rating = gen("p");
    rating.textContent = "★★★★☆ ";
    rating.classList.add("rating");

    let ratingNum = gen("span");
    ratingNum.textContent = "4 / 5";

    rating.appendChild(ratingNum);

    let description = gen("p");
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

  // /**
  //  * Inserts the item title and seller/category metadata into the card body.
  //  *
  //  * @param {HTMLElement} body - Card body container.
  //  * @param {Object} it - Item row with title, seller_id, and category fields.
  //  */
  // function addCardTitleSection(body, it) {
  //   const h3 = document.createElement("h3");
  //   h3.textContent = it.title || "Item";
  //   body.appendChild(h3);

  //   const meta = document.createElement("p");
  //   meta.className = "muted";
  //   const category = it.category ? " • " + it.category : "";
  //   meta.textContent = "Seller #" + it.seller_id + category;
  //   body.appendChild(meta);
  // }

  // /**
  //  * Adds a description paragraph to the card body if the item has one.
  //  *
  //  * @param {HTMLElement} body - Card body container.
  //  * @param {Object} it - Item row possibly containing a description.
  //  */
  // function addCardDescription(body, it) {
  //   if (!it.description) {
  //     return;
  //   }
  //   const desc = document.createElement("p");
  //   desc.className = "description";
  //   desc.textContent = it.description;
  //   body.appendChild(desc);
  // }

  // /**
  //  * Adds a formatted price line to the card body if a price is provided.
  //  *
  //  * @param {HTMLElement} body - Card body container.
  //  * @param {Object} it - Item row with a numeric price field.
  //  */
  // function addCardPrice(body, it) {
  //   if (typeof it.price !== "number") {
  //     return;
  //   }
  //   const price = document.createElement("p");
  //   price.className = "price";
  //   price.textContent = "$" + it.price.toFixed(2);
  //   body.appendChild(price);
  // }

  // /**
  //  * Adds a stock count and Buy button to the card body. The Buy button
  //  * disables itself automatically for items with zero stock.
  //  *
  //  * @param {HTMLElement} body - Card body container.
  //  * @param {Object} it - Item row with stock and id fields.
  //  */
  // function addCardStockAndButton(body, it) {
  //   if (typeof it.stock === "number") {
  //     const stock = document.createElement("p");
  //     stock.className = "stock";
  //     stock.textContent = "Stock: " + it.stock;
  //     body.appendChild(stock);
  //   }

  //   const buyBtn = document.createElement("button");
  //   buyBtn.type = "button";
  //   buyBtn.className = "buy-btn";

  //   if (typeof it.stock === "number" && it.stock <= 0) {
  //     buyBtn.disabled = true;
  //     buyBtn.textContent = "Out of stock";
  //   } else {
  //     buyBtn.textContent = "Buy";
  //     buyBtn.addEventListener("click", function() {
  //       handleBuy(it);
  //     });
  //   }

  //   body.appendChild(buyBtn);
  // }

  // /**
  //  * Public entry point for handling a user’s Buy request.
  //  * Delegates purchase logic to performPurchase() and reports result
  //  * to the user using showStatus().
  //  *
  //  * @param {Object} item - Item row containing id and price information.
  //  */
  // function handleBuy(item) {
  //   performPurchase(item)
  //     .then(msg => showStatus(msg, false))
  //     .catch(err => showStatus("Could not complete purchase: " + err.message, true));
  // }

  // /**
  //  * Sends a POST /buy request to the backend and returns a resolved
  //  * message string on success, or rejects with an Error on failure.
  //  * Also triggers a refresh via loadItems() after a successful purchase.
  //  *
  //  * @param {Object} item - Item being purchased.
  //  * @returns {Promise<string>} Resolves with success message text.
  //  */
  // async function performPurchase(item) {
  //   const resp = await fetch("/buy", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({
  //       BUYER_ID: CURRENT_USER_ID,
  //       ITEM_ID: item.id
  //     })
  //   });

  //   const text = await resp.text();

  //   if (!resp.ok) {
  //     throw new Error(text || "Purchase failed.");
  //   }

  //   loadItems().catch(err => {
  //     console.error("Error reloading items:", err);
  //   });

  //   return text || "Purchase complete!";
  // }

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

  // /**
  //  * Return a debounced version of `fn` that waits `ms` milliseconds after the
  //  * last call before invoking it.
  //  *
  //  * @param {Function} fn - function to debounce.
  //  * @param {number} ms - delay in milliseconds.
  //  * @returns {Function} debounced function.
  //  */
  // function debounce(fn, ms) {
  //   let timer = null;
  //   return function() {
  //     clearTimeout(timer);
  //     const args = arguments;
  //     timer = setTimeout(function() {
  //       fn.apply(null, args);
  //     }, ms || MSECOND * 2);
  //   };
  // }

  /**
   * Fetches data from the given URL and handles errors by disabling controls and showing an
   * error message. Support GET and POST, return in JSON or Plain text.
   * @param {string} url - Endpoint URL to request.
   * @param {boolean} isJson - Whether to parse the response as JSON, otherwise Plain text.
   * @param {FormData} postParams - Optional form data to send via POST, null for GET
   * @return {Object|string} - Parsed JSON object or text response.
   */
  async function dataFetch(url, isJson, postParams) {
    try {
      let response;
      if (postParams) {
        response = await fetch(url, {method: "POST", body: postParams});
      } else {
        response = await fetch(url);
      }
      await statusCheck(response);
      if (isJson) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.log(error);
      // id("yipper-data").classList.add("hidden");
      // id("search-btn").disabled = true;
      // id("home-btn").disabled = true;
      // id("yip-btn").disabled = true;
      // id("error").classList.remove("hidden");
    }
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
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
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