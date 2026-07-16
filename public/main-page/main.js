/**
 * Name: Rena Yin & Harry Cheng
 * Husky Help Husky — Campus Marketplace Web App
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
  // Maximum star for rating
  const MAXSTAR = 5;

  // Holds the item IDs of the current search results
  let searchResult = [];

  window.addEventListener("load", init);

  /**
   * Initializes the main page: loads items and sets up search, layout toggle,
   * sidebar navigation, and logout button event listeners.
   */
  async function init() {
    checkLocalStorage();

    id("nav-toggle-btn").addEventListener("click", navToggle);
    id("open-cart-page").addEventListener("click", openCartPage);
    id("open-history-page").addEventListener("click", openHistoryPage);
    id("open-profile-page").addEventListener("click", openProfilePage);
    id("logout-btn").addEventListener("click", logout);

    id("search-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        checkSearch();
      }
    });
    id("search-input").addEventListener("input", updateSearchClearButton);
    id("search-clear-btn").addEventListener("click", clearSearchKeyword);
    id("search-btn").addEventListener("click", checkSearch);
    id("category-filter").addEventListener("change", checkSearch);

    id("layout-grid-btn").addEventListener("click", () => setLayout("grid"));
    id("layout-list-btn").addEventListener("click", () => setLayout("list"));

    await loadItems();
  }

  /**
   * Ensures required keys exist in localStorage and initializes them when absent.
   * Default board layout: "list"
   */
  function checkLocalStorage() {
    let layout = getSavedLayout();
    if (!layout) {
      localStorage.setItem("board-layout", "list");
      layout = "list";
    } else if (layout === "grid") {
      id("item-list").classList.add("grid-layout");
    }
    updateLayoutControl(layout);

    let cart = localStorage.getItem("cart");
    if (!cart) {
      cart = {};
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }

  /**
   * Toggles the navigation sidebar between expanded and collapsed views.
   */
  function navToggle() {
    qs("aside").classList.toggle("collapsed");
    qs("aside nav").classList.toggle("hidden");
    id("logout-section").classList.toggle("hidden");
  }

  /**
   * Opens the shopping cart page.
   */
  function openCartPage() {
    window.location.href = "/cart-page/cart.html";
  }

  /**
   * Opens the transaction history page.
   */
  function openHistoryPage() {
    window.location.href = "/history-page/history.html";
  }

  /**
   * Opens the profile page.
   */
  function openProfilePage() {
    window.location.href = "/profile-page/profile.html";
  }

  /**
   * Logs out the current user and navigates back to the login page.
   */
  async function logout() {
    try {
      let body = new FormData();
      await dataFetch("/logout", false, body);

      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("cart");
      localStorage.removeItem("board-layout");
      localStorage.removeItem("page-color-theme");

      window.location.href = "/index.html";
    } catch (err) {
      showStatus("Logout Error", "Failed to logout", true);
    }
  }

  /**
   * Applies the selected category as a filter pill, then refreshes the board
   * using the current keyword and active filter pills. If no keyword or pills
   * are active, all items are revealed.
   */
  function checkSearch() {
    trimSearchKeyword();
    let search = id("search-input").value;
    let filter = id("category-filter").value;

    updateSearchClearButton();
    updateFilterPills(filter);

    let filters = getActiveFilters();

    if (search !== "" || filters.length > 0) {
      itemSearch();
    } else {
      revealAllItems();
    }
  }

  /**
   * Removes leading and trailing whitespace from the search keyword input.
   */
  function trimSearchKeyword() {
    id("search-input").value = id("search-input").value.trim();
  }

  /**
   * Shows the search keyword clear button only when the input has text.
   */
  function updateSearchClearButton() {
    let hasKeyword = id("search-input").value !== "";
    id("search-clear-btn").classList.toggle("hidden", !hasKeyword);
  }

  /**
   * Clears only the search keyword, refreshes results with the active category,
   * and returns keyboard focus to the search input.
   */
  function clearSearchKeyword() {
    id("search-input").value = "";
    updateSearchClearButton();
    checkSearch();
    id("search-input").focus();
  }

  /**
   * Replaces the current filter pill with the given category filter.
   * Only one category pill is currently supported.
   * @param {string} filter - Category filter value selected from the dropdown.
   */
  function updateFilterPills(filter) {
    let pillContainer = id("filter-pills");
    pillContainer.innerHTML = "";

    if (filter === "") {
      return;
    }

    let pill = gen("div");
    pill.classList.add("filter-pill");
    pill.dataset.filter = filter;

    let label = gen("span");
    label.textContent = filter;

    let close = gen("span");
    close.textContent = "×";
    close.addEventListener("click", clearFilterPill);

    pill.appendChild(label);
    pill.appendChild(close);
    pillContainer.appendChild(pill);
  }

  /**
   * Removes the clicked filter pill, resets the category dropdown to "All",
   * and refreshes the board using any remaining keyword.
   */
  function clearFilterPill() {
    this.closest(".filter-pill").remove();
    id("category-filter").value = "";
    checkSearch();
  }

  /**
   * Loads all items from the backend and renders them onto the item board.
   */
  async function loadItems() {
    let board = id("item-list");
    board.innerHTML = "";

    try {
      let isJson = true;
      let items = await dataFetch("/items", isJson);

      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let card = await createItemCard(item);
        board.appendChild(card);

        searchResult.push(item.id);
      }
    } catch (err) {
      showStatus("Website Error", "Failed to load Item", true);
    }
  }

  /**
   * Searches for items using the current keyword and active filter pills,
   * then updates the board so that only matching items are shown.
   */
  async function itemSearch() {
    try {
      let url = buildSearchUrl();
      let isJson = true;
      let searchItems = await dataFetch(url, isJson);
      applySearchResults(searchItems);
    } catch (err) {
      showStatus("Website Error", "Failed to search Item", true);
    }
  }

  /**
   * Builds the search URL from the current keyword input and active filter pills.
   * The backend currently supports one category filter, so only the first active
   * pill is included.
   * @returns {string} Fully constructed URL for the search endpoint.
   */
  function buildSearchUrl() {
    let url = "/items/search?";
    let keyword = id("search-input").value.trim();

    if (keyword !== "") {
      url += "search=" + keyword + "&";
    }

    let filters = getActiveFilters();
    if (filters.length > 0) {
      url += "filter=" + filters[0];
    }

    return url;
  }

  /**
   * Reads the active filter values from the current filter pills.
   * @returns {string[]} Active category filters represented by filter pills.
   */
  function getActiveFilters() {
    let pills = qsa("#filter-pills .filter-pill");
    let filters = [];

    pills.forEach(pill => {
      filters.push(pill.dataset.filter);
    });

    return filters;
  }

  /**
   * Applies search results to the board: hides non-matches, reveals matches,
   * and sets an appropriate status message.
   * @param {Object[]} searchItems - search items returned from the backend.
   */
  function applySearchResults(searchItems) {
    let items = qsa(".item-card");
    items.forEach(item => item.classList.add("hidden"));

    searchResult = [];
    if (searchItems.length === 0) {
      showStatus("No matching items", "Try different keywords or categories", false);
      return;
    }

    searchItems.forEach(item => {
      let card = id(item.id);
      if (card) {
        card.classList.remove("hidden");
        searchResult.push(item.id);
      }
    });

    showStatus("Search Results", "Found " + searchItems.length + " matching items", false);
  }

  /**
   * Makes all item cards visible again.
   */
  function revealAllItems() {
    let items = qsa(".item-card");
    searchResult = [];
    items.forEach(item => {
      item.classList.remove("hidden");
      searchResult.push(item.id);
    });
    hideStatus();
  }

  /**
   * Reads the saved board layout value.
   * @returns {string|null} Current saved layout value.
   */
  function getSavedLayout() {
    return localStorage.getItem("board-layout");
  }

  /**
   * Switches the item board to the selected layout.
   * @param {string} layout - "grid" or "list".
   */
  function setLayout(layout) {
    if (getSavedLayout() === layout) {
      return;
    }

    localStorage.setItem("board-layout", layout);
    id("item-list").classList.toggle("grid-layout", layout === "grid");
    updateLayoutControl(layout);
  }

  /**
   * Updates segmented control active state to match the selected layout.
   * @param {string} layout - "grid" or "list".
   */
  function updateLayoutControl(layout) {
    let isGrid = layout === "grid";
    id("layout-grid-btn").classList.toggle("active", isGrid);
    id("layout-list-btn").classList.toggle("active", !isGrid);
    id("layout-grid-btn").setAttribute("aria-pressed", isGrid);
    id("layout-list-btn").setAttribute("aria-pressed", !isGrid);
  }

  /**
   * Creates a complete <article> item card, including media and body sections.
   * This is the main entry point used while loading items.
   * @param {Object} item - Item row from the backend (id, title, seller_id, etc.).
   * @returns {HTMLElement} The constructed <article> card element.
   */
  async function createItemCard(item) {
    let card = gen("article");
    card.classList.add("item-card");
    card.id = item.id;
    card.dataset.stock = item.stock;

    card.appendChild(createCardImg(item.title));
    card.appendChild(await createCardInfo(item));
    return card;
  }

  /**
   * Converts an item title into an image path by lowercasing it,
   * replacing spaces with hyphens, and appending the ".jpg" extension.
   * @param {string} name - Item title to convert into an image file path.
   * @return {string} - Relative path to the corresponding item image.
   */
  function parseName(name) {
    name = name.toLowerCase();
    let result = "../img/";
    result += name.split(" ").join("-");
    result += ".jpg";
    return result;
  }

  /**
   * Creates the image container for an item card.
   * @param {string} title - Title of the item.
   * @returns {HTMLElement} A <figure> representing the image section.
   */
  function createCardImg(title) {
    let imgContainer = gen("figure");
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
   * and action buttons. The detail elements are hidden until detail view.
   * @param {Object} item - Item data object from the backend.
   * @returns {HTMLElement} section.info element.
   */
  async function createCardInfo(item) {
    const info = gen("div");
    info.classList.add("info");

    info.appendChild(createInfoTitle(item));
    info.appendChild(createInfoCategory(item));
    info.appendChild(await createInfoRating(item));
    info.appendChild(createInfoDescription(item));
    info.appendChild(createInfoPrice(item));
    info.appendChild(createInfoMeta(item));
    info.appendChild(createInfoCartBtn(item));
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
   * @returns {HTMLElement} h3.title element.
   */
  function createInfoTitle(item) {
    const title = gen("h3");
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
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} p.rating element containing a span.
   */
  async function createInfoRating(item) {
    const rating = gen("p");
    rating.classList.add("rating");

    const starSpan = gen("span");
    starSpan.classList.add("rating-stars");

    try {
      let isJson = true;
      let ratings = await dataFetch("/items/" + item.id + "/ratings", isJson);
      let avgStar = ratings.average;
      if (avgStar) {
        avgStar = Math.round(avgStar * 10) / 10;
      } else {
        avgStar = 0;
      }
      let count = parseInt(ratings.count);

      let star = "";
      for (let i = 0; i < MAXSTAR; i++) {
        if (i < avgStar) {
          star += "★";
        } else {
          star += "☆";
        }
      }

      if (count !== 0) {
        starSpan.textContent = star + " ";
        starSpan.setAttribute("aria-hidden", "true");

        let numRating = gen("span");
        numRating.classList.add("rating-summary");
        numRating.textContent = avgStar + " / " + MAXSTAR + " (" + count + ")";
        rating.appendChild(starSpan);
        rating.appendChild(numRating);
      } else {
        rating.textContent = "No ratings yet";
      }
    } catch (err) {
      showStatus("Website Error", "Failed to load rating", true);
    }

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
      " · Stock: " + item.stock + " left";
    metaInfo.classList.add("meta-info", "detail");
    return metaInfo;
  }

  /**
   * Creates the "Add to cart" button for an item card.
   * @param {Object} item - Item data object.
   * @returns {HTMLElement} button.cart-btn element.
   */
  function createInfoCartBtn(item) {
    const cartBtn = gen("button");
    cartBtn.textContent = "Add to cart";
    cartBtn.classList.add("cart-btn");
    cartBtn.addEventListener("click", addItemToCart);

    let cart = JSON.parse(localStorage.getItem("cart"));
    let cartQty = cart[item.id];
    let stock = item.stock;
    if ((cartQty && cartQty >= stock) || stock === 0) {
      cartBtn.disabled = true;
      cartBtn.textContent = "Out of stock";
    }

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
    backBtn.classList.add("back-btn", "secondary-btn", "detail");
    backBtn.addEventListener("click", toggleItemDetail);

    return backBtn;
  }

  /**
   * Increments the quantity of the clicked item in shopping cart.
   */
  function addItemToCart() {
    let card = this.closest(".item-card");
    let cart = JSON.parse(localStorage.getItem("cart"));
    let itemId = card.id;

    let cartQty = cart[itemId];
    if (cart[itemId]) {
      cartQty++;
      cart[itemId] = cart[itemId] + 1;
    } else {
      cartQty = 1;
      cart[itemId] = 1;
    }

    let title = card.querySelector(".title").textContent;
    let stock = parseInt(card.dataset.stock);
    if (cartQty === stock) {
      this.disabled = true;
      this.textContent = "Out of stock";

      let msg = title + " has reached the stock limit (" + stock + ").";
      showStatus("Out of stock", msg, false);
    } else {
      let message = title + " (" + cartQty + " in cart, " + stock + " in stock)";
      showStatus("Added to cart", message, false);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
  }

  /**
   * Toggles between the list view and an inline detail view for a single item card.
   * When entering detail view, only the selected item's full information is shown.
   */
  function toggleItemDetail() {
    qs("#content header").classList.toggle("hidden");

    for (let itemId of searchResult) {
      id(itemId).classList.toggle("hidden");
    }

    let card = this.closest(".item-card");

    if (card.classList.contains("detail-view")) {
      // Exiting detail view
      hideStatus();

      let layout = localStorage.getItem("board-layout");
      if (layout === "grid") {
        id("item-list").classList.add("grid-layout");
      }

      card.querySelector(".title").addEventListener("click", toggleItemDetail);
      card.querySelector(".img-container img").addEventListener("click", toggleItemDetail);
    } else {
      // Entering detail view
      showStatus("Detail view", "Check out the item or return to the list", false);

      id("item-list").classList.remove("grid-layout");

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
   * Fetches data from the given URL using GET or POST and returns the response
   * as parsed JSON or plain text.
   * @param {string} url - Endpoint URL to request.
   * @param {boolean} isJson - Whether to parse the response as JSON (true) or text.
   * @param {FormData} [postParams] - Optional form data to send via POST.
   * @returns {Object|string} Parsed JSON data or response text from the request.
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
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Update the global status message area.
   * @param {string} title - Short heading text for the status area.
   * @param {string|Error} message - Detailed status text or Error.
   * @param {boolean} isError - When true, apply error styling
   */
  function showStatus(title, message, isError) {
    const status = id("status-message");
    status.classList.remove("hidden");

    status.querySelector("h2").textContent = title;
    status.querySelector("p").textContent = message;
    if (isError) {
      status.classList.add("error");
    } else {
      status.classList.remove("error");
    }
  }

  /**
   * Clears and hides the dynamic status message area.
   */
  function hideStatus() {
    const status = id("status-message");
    status.classList.add("hidden");
    status.classList.remove("error");
    status.querySelector("h2").textContent = "";
    status.querySelector("p").textContent = "";
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
