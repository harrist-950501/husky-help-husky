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

const MAXSTAR = 5;

(function() {
  window.addEventListener("load", init);

  /**
   * Initializes the main page: loads items and sets up search, layout toggle,
   * sidebar navigation, and logout button event listeners.
   */
  function init() {
    checkLocalStorage();

    id("nav-toggle-btn").addEventListener("click", navToggle);
    id("open-cart-page").addEventListener("click", openCartPage);
    id("open-history-page").addEventListener("click", openHistroyPage);
    id("open-profile-page").addEventListener("click", openProfilePage);
    id("logout-btn").addEventListener("click", logout);

    // id("search-bar").addEventListener("input", checkSearch);
    id("search-btn").addEventListener("click", itemSearch);
    // id("search-btn").disabled = "true";
    id("unsearch-btn").addEventListener("click", loadItems);
    // id("category-filter").addEventListener("change", checkFilter);

    id("layout-toggle").addEventListener("click", toggleLayout);

    loadItems();
  }

  function checkLocalStorage() {
    let layout = localStorage.getItem("board-layout");
    if (!layout) {
      localStorage.setItem("board-layout", "list");
    } else if (layout === "grid") {
      id("item-board").classList.toggle("grid-layout");
    }

    let cart = localStorage.getItem("cart");
    if (!cart) {
      let cart = {};
      localStorage.setItem("cart", JSON.stringify(cart));
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

      items.forEach(async (item) => {
        let card = await createItemCard(item);
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
    window.location.href = "/index.html";
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
  function openHistroyPage() {
    window.location.href = "/history-page/history.html";
  }

  /**
   * Opens the profile page.
   */
  function openProfilePage() {
    window.location.href = "/profile-page/profile.html";
  }

  /**
   * Searches for items using the current keyword and category filter
   * and updates the item board so that only matching items are shown.
   */
  async function itemSearch() {
    let url = "/items/search?";
    let keyword = id("search-bar").value.trim();
    if (keyword !== "") {
      url += "search=" + keyword + "&";
    }
    let category = id("category-filter").value;
    if (category !== "") {
      url += "filter=" + category;
    }

    let isJson = true;
    let searchItems = await dataFetch(url, isJson);

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
  async function createItemCard(item) {
    let card = gen("article");
    card.classList.add("item-card");
    card.id = item.id;

    card.appendChild(createCardImg(item.title));
    card.appendChild(await createCardInfo(item));
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
  async function createCardInfo(item) {
    const info = gen("section");
    info.classList.add("info");

    info.appendChild(createInfoTitle(item));
    info.appendChild(createInfoCategory(item));
    info.appendChild(await createInfoRating(item));
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
  async function createInfoRating(item) {
    const rating = gen("p");
    rating.classList.add("rating");
    // rating.textContent = "☆☆☆☆☆ ";
    // rating.textContent = "★★★★☆ ";

    const ratingNum = gen("span");
    // let ratingValue = "4.0 / 5";
    // ratingNum.textContent = ratingValue;

    let isJson = true;
    let ratingValue = await dataFetch("/items/" + item.id + "/ratings", isJson);
    let avgStar = parseInt(ratingValue.average);
    let maxStar = 5;
    let count = ratingValue.count;

    let star = "";
    for (let i = 0; i < maxStar; i++) {
      if (i < avgStar) {
        star += "★";
      } else {
        star += "☆";
      }
    }

    if (count === 0 || avgStar === null) {
      ratingNum.textContent = "No ratings yet";
    } else {
      rating.textContent = star + " ";
      ratingNum.textContent = avgStar + " / " + maxStar + " (" + count + ")";
    }

    // rating.textContent = star + " ";
    // ratingNum.textContent = avgStar + " / " + maxStar + " (" + count + ")";
    // console.log(ratingValue)
    // fetch(`/items/${item.id}/ratings`)
    //   .then(resp => {
    //     if (!resp.ok) {
    //       throw new Error("Failed to load rating.");
    //     }
    //     return resp.json();
    //   })
    //   .then(summary => {
    //     if (summary && summary.count > 0 && summary.average !== null) {
    //       const avg = Number(summary.average);
    //       const rounded = Math.round(avg);

    //       // Rena: lmk if u have better choice
    //       const filled = "★★★★★".slice(0, rounded);
    //       const empty = "☆☆☆☆☆".slice(0, MAXSTAR - rounded);

    //       starsSpan.textContent = filled + empty;
    //       valueSpan.textContent = ` ${avg.toFixed(1)} / 5`;
    //       countSpan.textContent = ` (${summary.count})`;
    //     } else {
    //       rating.textContent = "No ratings yet";
    //     }
    //   })
    //   .catch(err => {
    //     console.error("Error fetching rating for item", item.id, err);
    //     rating.textContent = "Rating unavailable";
    //   });

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
    cartBtn.addEventListener("click", addItemToCart);

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

  function getRatingValue(item) {
    // fetch rating summary for this item

    fetch(`/items/${item.id}/ratings`)
      .then(resp => {
        if (!resp.ok) {
          throw new Error("Failed to load rating.");
        }
        return resp.json();
      })
      .then(summary => {
        if (summary && summary.count > 0 && summary.average !== null) {
          const avg = Number(summary.average);
          const rounded = Math.round(avg);

          // Rena: lmk if u have better choice
          const filled = "★★★★★".slice(0, rounded);
          const empty = "☆☆☆☆☆".slice(0, MAXSTAR - rounded);

          starsSpan.textContent = filled + empty;
          valueSpan.textContent = ` ${avg.toFixed(1)} / 5`;
          countSpan.textContent = ` (${summary.count})`;
        } else {
          rating.textContent = "No ratings yet";
        }
      })
      .catch(err => {
        console.error("Error fetching rating for item", item.id, err);
        rating.textContent = "Rating unavailable";
      });
  }

  function addItemToCart() {
    let cart = JSON.parse(localStorage.getItem("cart"));
    let itemId = this.parentElement.parentElement.id;
    if (cart[itemId] !== undefined) {
      cart[itemId] =  cart[itemId] + 1;
    } else {
      cart[itemId] = 1;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  /**
   * Toggles between the list view and an inline detail view for a single item card.
   * When entering detail view, only the selected item's full information is shown.
   */
  function toggleItemDetail() {
    qs("#content header").classList.toggle("hidden");

    let items = qsa(".item-card");
    items.forEach(item => {
      item.classList.toggle("hidden");
    });

    let card = id(this.parentElement.parentElement.id);

    if (card.classList.contains("detail-view")) {
      let layout = localStorage.getItem("board-layout");
      if (layout === "grid") {
        id("item-board").classList.add("grid-layout");
      }

      card.querySelector(".title").addEventListener("click", toggleItemDetail);
      card.querySelector(".img-container img").addEventListener("click", toggleItemDetail);
    } else {
      id("item-board").classList.remove("grid-layout");

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

  /**
   * Update the global status message area.
   *
   * @param {string} title - Short heading text for the status area.
   * @param {string|Error} message - Detailed status text or Error.
   * @param {boolean} isError - When true, apply error styling
   */
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