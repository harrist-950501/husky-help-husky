/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 */

"use strict";

(function() {
  // The total price of all items in the cart
  let cartTotal = 0;

  window.addEventListener("load", init);

  function init() {
    checkLocalStorage();

    loadItems();

    qsa(".back-btn").forEach(button => {
      button.addEventListener("click", back);
    });
  }

  function checkLocalStorage() {
    let cart = localItemGet("cart");
    if (!cart) {
      cart = {};
      localItemSet("cart", cart);
    }
  }

  /**
   * Navigate back to the main page.
   */
  function back() {
    window.location.href = "/main-page/main.html";
  }

  async function loadItems() {
    let board = id("cart-board");

    let cart = localItemGet("cart");
    let ids = Object.keys(cart);
    id("cart-count").textContent = ids.length;
    if (!checkEmptyCart()) {
      try {
        showStatus("Loading cart...", "Please wait", false);

        let isJson = true;
        for (let i = 0; i < ids.length; i++) {
          let id = ids[i];
          let item = await dataFetch("/items?id=" + id, isJson);

          let cartQty = parseInt(cart[id]);
          cartTotal += item.price * cartQty;

          let card = createCartCard(item, cartQty);
          board.appendChild(card);
        }

        showStatus("Your Cart", "Review your items before purchase", false);

        updateTotal(0);
      } catch (err) {
        // Stop the code from keeping running, dataFetch already shows error message
      }
    }
  }

  /**
   * Creates a complete cart item card (<article.cart-card>).
   * @param {Object} item - item row from backend (id, title, category, price, ...).
   * @param {number} quantity - quantity stored in localStorage for this item.
   * @returns {HTMLElement} article.cart-card element.
   */
  function createCartCard(item, quantity) {
    let card = gen("article");
    card.classList.add("cart-card");
    card.id = item.id;
    card.dataset.stock = item.stock;
    card.dataset.price = item.price;

    card.appendChild(createCardImg(item));
    card.appendChild(createCardMain(item));
    card.appendChild(createCardActions(item, quantity));

    return card;
  }

  /**
   * Creates the image section of a cart card.
   * @param {Object} item - item data.
   * @returns {HTMLElement} section.cart-img element.
   */
  function createCardImg(item) {
    let imgSection = gen("section");
    imgSection.classList.add("card-img");

    let img = gen("img");
    img.src = parseName(item.title);
    img.alt = item.title;

    imgSection.appendChild(img);
    return imgSection;
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
   * Creates the main text section of a cart card:
   * title, meta line, and unit price.
   * @param {Object} item - item data.
   * @returns {HTMLElement} section.cart-main element.
   */
  function createCardMain(item) {
    let mainSection = gen("section");
    mainSection.classList.add("card-main");

    let title = gen("h3");
    title.classList.add("card-title");
    title.textContent = item.title;

    let meta = gen("p");
    meta.classList.add("card-meta");
    meta.textContent = item.category +
      " · Seller #" + item.seller_id +
      " · " + item.stock + " left";

    let price = gen("p");
    price.classList.add("card-price");
    price.textContent = "$" + item.price;

    mainSection.appendChild(title);
    mainSection.appendChild(meta);
    mainSection.appendChild(price);

    return mainSection;
  }

  function createCardActions(item, quantity) {
    let actions = gen("section");
    actions.classList.add("card-actions");

    actions.appendChild(createQtyControl(item, quantity));
    actions.appendChild(createCardSubtotal(item.price, quantity));
    actions.appendChild(createCardRemoveBtn());

    return actions;
  }

  function createQtyControl(item, quantity) {
    let box = gen("section");
    box.classList.add("qty-control");

    let minus = gen("button");
    minus.textContent = "-";
    minus.classList.add("qty-minus");
    minus.addEventListener("click", minusCardQty);

    let count = gen("span");
    count.textContent = quantity;

    let plus = gen("button");
    plus.textContent = "+";
    plus.classList.add("qty-plus");
    plus.addEventListener("click", addCardQty);

    if (quantity === item.stock) {
      plus.disabled = true;
    }

    box.appendChild(minus);
    box.appendChild(count);
    box.appendChild(plus);

    return box;
  }

  function createCardSubtotal(price, quantity) {
    let subtotal = gen("p");
    subtotal.classList.add("card-subtotal");
    subtotal.textContent = "$" + (price * quantity);
    return subtotal;
  }

  function createCardRemoveBtn() {
    let btn = gen("button");
    btn.classList.add("remove-btn");
    btn.textContent = "Remove";
    btn.addEventListener("click", cartRemove);
    return btn;
  }

  function minusCardQty() {
    let card = this.closest(".cart-card");
    changeCartQty(card, -1);
  }

  function addCardQty() {
    let card = this.closest(".cart-card");
    changeCartQty(card, 1);
  }

  function changeCartQty(card, delta) {
    let cartId = card.id;
    let cart = localItemGet("cart");
    let quantity = cart[cartId];

    quantity += delta;

    cart[cartId] = quantity;
    localItemSet("cart", cart);

    updateCardView(card, quantity);

    let price = parseInt(card.dataset.price);
    let change = price * delta;
    updateTotal(change);
  }

  function updateCardView(card, quantity) {
    if (quantity === 0) {
      cartRemove.call(card);
      checkEmptyCart();
    } else {
      let qtySpan = card.querySelector(".qty-control span");
      qtySpan.textContent = quantity;

      let price = parseInt(card.dataset.price);
      let total = card.querySelector(".card-subtotal");
      total.textContent = "$" + (price * quantity);

      let stock = parseInt(card.dataset.stock);
      let plusBtn  = card.querySelector(".qty-plus");
      if (quantity === stock) {
        plusBtn.disabled = true;
      } else {
        plusBtn.disabled = false;
      }
    }
  }

  function updateTotal(change) {
    let totalPrice = id("cart-total");
    cartTotal += change;
    totalPrice.textContent = "$" + cartTotal;
  }

  function cartRemove() {
    let card = this.closest(".cart-card");
    card.remove();

    let cartId = card.id;
    let cart = localItemGet("cart");
    delete cart[cartId];
    localItemSet("cart", cart);

    checkEmptyCart();
  }

  function checkEmptyCart() {
    let cart = localItemGet("cart");
    let cartNum = Object.keys(cart).length;
    id("cart-count").textContent = cartNum;
    if (cartNum === 0) {
      showStatus("Your cart is empty", "Add some items to your cart first!", false);
      return true;
    }
    return false;
  }

  /**
   * Public entry point for handling a user’s Buy request.
   * Delegates purchase logic to performPurchase() and reports result
   * to the user using showStatus().
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

    // Rena: I changed this corresponding buy fetch bc the backend also changes im dead.
    const resp = await fetch("/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: item.id
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

  function localItemGet(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  function localItemSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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