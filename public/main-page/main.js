/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * main.js
 * Renders marketplace items from the backend, supports search by keyword
 * and category, layout toggling, navigation to other pages, and inline
 * detail view for individual items.
 *
 * Backend endpoints used:
 *  - GET /items
 *  - GET /items/search?search=<term>&filter=<category>
 */
"use strict";

(function() {
  const BASE_URL = "http://localhost:8000/";

  window.addEventListener("load", init);

  /**
   * Initializes the main page: loads items and sets up search, layout toggle,
   * sidebar navigation, and logout button event listeners.
   */
  function init() {
    checkPrefernce();

    id("nav-toggle-btn").addEventListener("click", navToggle);
    id("open-cart-page").addEventListener("click", openCartPage);
    id("open-history-page").addEventListener("click", openHistroyPage);
    id("open-profile-page").addEventListener("click", openProfilePage);
    id("logout-btn").addEventListener("click", logout);

    id("search-bar").addEventListener("input", checkSearch);
    id("search-btn").addEventListener("click", itemSearch);
    id("search-btn").disabled = "true";
    id("unsearch-btn").addEventListener("click", loadItems);
    id("category-filter").addEventListener("change", checkFilter);

    id("layout-toggle").addEventListener("click", toggleLayout);

    loadItems();
  }

  function checkPrefernce() {
    let layout = localStorage.getItem("board-layout");
    if (!layout) {
      localStorage.setItem("board-layout", "list");
    } else if (layout === "grid") {
      id("item-board").classList.toggle("grid-layout");
    }
  }

  /**
   * Enables or disables the search button depending on whether
   * a category in the filter is selected.
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

  /**
   * Toggles the navigation sidebar between expanded and collapsed views.
   */
  function navToggle() {
    qs("aside").classList.toggle("collapsed");
    qs("aside h1").classList.toggle("hidden");
    qs("aside section").classList.toggle("hidden");
    qs("aside footer").classList.toggle("hidden");
  }

  /**
   * Loads all items from the backend and renders them onto the item board.
   */
  async function loadItems() {
    let board = id("item-board");
    board.innerHTML = "";

    try {
      let isJson = true;
      let items = await dataFetch("/items", isJson);

      items.forEach(item => {
        let card = createCardElement(item);
        board.appendChild(card);
      });
    } catch (err) {
      // Stop the code from keeping running, dataFetch already shows error message
    }
  }

  /**
   * Logs out the current user and navigates back to the login page.
   */
  function logout() {
    window.location.href = "../index.html";
  }

  /**
   * Opens the shopping cart page.
   */
  function openCartPage() {
    window.location.href = "../cart-page/cart.html";
  }

  /**
   * Opens the transaction history page.
   */
  function openHistroyPage() {
    window.location.href = "../history-page/history.html";
  }

  /**
   * Opens the profile page.
   */
  function openProfilePage() {
    window.location.href = "../profile-page/profile.html";
  }

  /**
   * Searches for items using the current keyword and category filter
   * and updates the item board so that only matching items are shown.
   */
  async function itemSearch() {
    let url = "items/search?";
    let keyword = id("search-bar").value.trim();
    if (keyword !== "") {
      url += "search=" + keyword + "&";
    }
    let category = id("category-filter").value;
    if (category !== "") {
      url += "filter=" + category;
    }

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
   * Switches the item board between list and grid layouts.
   */
  function toggleLayout() {
    id("item-board").classList.toggle("grid-layout");

    let layout = localStorage.getItem("board-layout");
    if (layout === "list") {
      localStorage.setItem("board-layout", "grid");
    } else {
      localStorage.setItem("board-layout", "list");
    }
  }

  /**
   * Creates a complete <article> item card, including media and body sections.
   * This is the main entry point used by renderItems().
   * @param {Object} item - Item row from the backend (id, title, seller_id, etc.).
   * @returns {HTMLElement} The constructed <article> card element.
   */
  function createCardElement(item) {
    let card = gen("article");
    card.classList.add("item-card");
    card.id = item.id;

    card.appendChild(createCardImg(item.title));
    card.appendChild(createCardInfo(item));
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

    img.addEventListener("click", toggleItemDetail);

    imgContainer.appendChild(img);
    return imgContainer;
  }

  /**
   * Creates the info section (right side) of an item card,
   * including title, rating, description, price, meta info
   * and action buttons.
   * In list view, elements marked with the "detail" class are
   * initially hidden and can be revealed for the detail view.
   * @param {Object} item - Item data object from the backend.
   * @returns {HTMLElement} section.info element.
   */
  function createCardInfo(item) {
    const info = gen("section");
    info.classList.add("info");

    info.appendChild(createInfoTitle(item));
    info.appendChild(createInfoCategory(item));
    info.appendChild(createInfoRating());
    info.appendChild(createInfoDescription(item));
    info.appendChild(createInfoPrice(item));
    info.appendChild(createInfoMeta(item));
    info.appendChild(createInfoCartBtn());
    info.appendChild(createInfoBackBtn());

    let details = info.querySelectorAll(".detail");
    details.forEach(detail => {
      detail.classList.add("hidden");
    });

    return info;
  }

  /**
   * Creates the title element for an item card.
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} h2.title element.
   */
  function createInfoTitle(item) {
    const title = gen("h2");
    title.textContent = item.title;
    title.classList.add("title");

    title.addEventListener("click", toggleItemDetail);
    return title;
  }

  /**
   * Creates the category label that appears in detail mode.
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} p.category.detail element.
   */
  function createInfoCategory(item) {
    const category = gen("p");
    category.textContent = item.category;
    category.classList.add("category", "detail");
    return category;
  }

  /**
   * Creates the rating line (star icons + numeric rating).
   * @returns {HTMLElement} p.rating element containing a span.
   */
  function createInfoRating() {
    const rating = gen("p");
    rating.classList.add("rating");
    rating.textContent = "★★★★☆ ";

    const ratingNum = gen("span");
    ratingNum.textContent = "4 / 5";
    rating.appendChild(ratingNum);

    return rating;
  }

  /**
   * Creates the description paragraph for detail mode.
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} p.description.detail element.
   */
  function createInfoDescription(item) {
    const description = gen("p");
    description.textContent = item.description;
    description.classList.add("description", "detail");
    return description;
  }

  /**
   * Creates the price line for an item card.
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} p.price element.
   */
  function createInfoPrice(item) {
    const price = gen("p");
    price.textContent = "$" + item.price;
    price.classList.add("price");
    return price;
  }

  /**
   * Creates the seller / stock / posted meta info line
   * that appears only in detail mode.
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} p.meta-info.detail element.
   */
  function createInfoMeta(item) {
    const metaInfo = gen("p");
    metaInfo.textContent =
      "Seller: #" + item.seller_id +
      " · Stock: " + item.stock + " left" +
      " · Posted: " + item.date;
    metaInfo.classList.add("meta-info", "detail");
    return metaInfo;
  }

  /**
   * Creates the "Add to cart" button for an item card.
   * @returns {HTMLElement} button.cart-btn element.
   */
  function createInfoCartBtn() {
    const cartBtn = gen("button");
    cartBtn.textContent = "Add to cart";
    cartBtn.classList.add("cart-btn");

    return cartBtn;
  }

  /**
   * Creates the "Back to list" button that is only visible
   * in inline detail mode.
   * @returns {HTMLElement} button.back-btn.detail element.
   */
  function createInfoBackBtn() {
    const backBtn = gen("button");
    backBtn.textContent = "Back to list";
    backBtn.classList.add("back-btn", "detail");
    backBtn.addEventListener("click", toggleItemDetail);

    return backBtn;
  }

  /**
   * Toggles between the list view and an inline detail view for a single item card.
   * When entering detail view, only the selected item's full information is shown.
   */
  function toggleItemDetail() {
    qs("#content header").classList.toggle("hidden");
    id("item-board").classList.remove("grid-layout");

    let items = qsa(".item-card");
    items.forEach(item => {
      item.classList.toggle("hidden");
    });

    let card = id(this.parentElement.parentElement.id);

    if (card.classList.contains("detail-view")) {
      card.querySelector(".title").addEventListener("click", toggleItemDetail);
      card.querySelector(".img-container img").addEventListener("click", toggleItemDetail);
    } else {
      card.querySelector(".title").removeEventListener("click", toggleItemDetail);
      card.querySelector(".img-container img").removeEventListener("click", toggleItemDetail);
    }

    let info = card.querySelector(".info");
    let details = info.querySelectorAll(".detail");
    details.forEach(detail => {
      detail.classList.toggle("hidden");
    });

    card.classList.toggle("hidden");
    card.classList.toggle("detail-view");
  }

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
      showStatus("Product board ", "Browse items and add something you like", false);
      if (isJson) {
        return await response.json();
      }
      return await response.text();
    } catch (err) {
      showStatus("Website Error", err, true);
    }
  }

  function showStatus(title, message, isError) {
    const status = id("status-message");

    status.querySelector("h2").textContent = title;
    status.querySelector("p").textContent = message;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
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