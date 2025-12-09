/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * cart.js
 * Manages the shopping cart page: renders items from localStorage-backed cart
 * data, supports quantity changes and item removal, handles order confirmation,
 * and submits bulk purchase requests to the backend.
 *
 * Backend endpoints used:
 *  - GET /items?id=<id>
 *  - POST /bulk-buy
 */

"use strict";

(function() {
  // The total price of all items in the cart
  let cartTotal = 0;

  window.addEventListener("load", init);

  /**
   * Initializes the cart page: prepares localStorage, loads cart items,
   * and registers event handlers for navigation and order actions.
   */
  function init() {
    checkLocalStorage();

    loadItems();

    qsa(".back-btn").forEach(button => {
      button.addEventListener("click", back);
    });

    id("confirm-btn").addEventListener("click", confirmOrder);
    id("submit-btn").addEventListener("click", submitOrder);
  }

  /**
   * Ensures required cart-related keys exist in localStorage and initializes
   * them when absent.
   */
  function checkLocalStorage() {
    let cart = localItemGet("cart");
    if (!cart) {
      cart = {};
      localItemSet("cart", cart);
    }

    let isConfirm = localItemGet("order-confirm");
    if (!isConfirm) {
      isConfirm = false;
      localItemSet("order-confirm", isConfirm);
    }
  }

  /**
   * Navigates back to the main marketplace page and clears any confirmed
   * order state.
   */
  function back() {
    disconfirmOrder();
    window.location.href = "/main-page/main.html";
  }

  /**
   * Loads items currently stored in the cart from the backend, renders
   * a cart card for each item, and initializes the cart total or an
   * empty-cart status when appropriate.
   */
  async function loadItems() {
    let emptyCheck = checkEmptyCart();
    if (!emptyCheck) {
      let cart = localItemGet("cart");
      let ids = Object.keys(cart);
      id("cart-count").textContent = ids.length;

      let board = id("cart-board");
      showStatus("Loading cart...", "Please wait", false);
      try {
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
        showStatus("Could not load cart", err.message, true);
      }
    } else {
      let title = emptyCheck[0];
      let message = emptyCheck[1];
      showStatus(title, message, false);
    }
  }

  /**
   * Creates a full cart card element for the given item and quantity.
   * @param {Object} item - Item object returned from the backend.
   * @param {number} quantity - Quantity of this item in the cart.
   * @return {HTMLElement} Article element representing the cart card.
   */
  function createCartCard(item, quantity) {
    let card = gen("article");
    card.classList.add("cart-card");
    card.id = item.id;
    card.dataset["seller_id"] = item["seller_id"];
    card.dataset.price = item.price;
    card.dataset.stock = item.stock;

    card.appendChild(createCardImg(item));
    card.appendChild(createCardMain(item));
    card.appendChild(createCardActions(item, quantity));

    return card;
  }

  /**
   * Creates the image section for a cart card.
   * @param {Object} item - Item object containing at least the title.
   * @return {HTMLElement} Section element containing the item image.
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
   * Converts an item title into a relative image path used for the card image.
   * @param {string} name - Item title to convert.
   * @return {string} Relative path to the corresponding image file.
   */
  function parseName(name) {
    name = name.toLowerCase();
    let result = "../img/";
    result += name.split(" ").join("-");
    result += ".jpg";
    return result;
  }

  /**
   * Creates the main information section (title, meta, price) for a cart card.
   * @param {Object} item - Item object from the backend.
   * @return {HTMLElement} Section element containing the main info.
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

  /**
   * Creates the action section for a cart card, including quantity controls,
   * subtotal display, and remove button.
   * @param {Object} item - Item object from the backend.
   * @param {number} quantity - Quantity of this item in the cart.
   * @return {HTMLElement} Section element containing action controls.
   */
  function createCardActions(item, quantity) {
    let actions = gen("section");
    actions.classList.add("card-actions");

    actions.appendChild(createQtyControl(item, quantity));
    actions.appendChild(createCardSubtotal(item.price, quantity));
    actions.appendChild(createCardRemoveBtn());

    return actions;
  }

  /**
   * Creates the quantity control section (minus button, count, plus button)
   * for a cart card and wires up the quantity change handlers.
   * @param {Object} item - Item object from the backend.
   * @param {number} quantity - Current quantity of this item in the cart.
   * @return {HTMLElement} Section element with quantity controls.
   */
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

  /**
   * Creates the per-item subtotal display for a cart card.
   * @param {number} price - Unit price of the item.
   * @param {number} quantity - Quantity of the item in the cart.
   * @return {HTMLElement} Paragraph element showing the item subtotal.
   */
  function createCardSubtotal(price, quantity) {
    let subtotal = gen("p");
    subtotal.classList.add("card-subtotal");
    subtotal.textContent = "$" + (price * quantity);
    return subtotal;
  }

  /**
   * Creates the remove button for a cart card and attaches its click handler.
   * @returns {HTMLElement} Button element that removes the item from the cart.
   */
  function createCardRemoveBtn() {
    let btn = gen("button");
    btn.classList.add("remove-btn");
    btn.textContent = "Remove";
    btn.addEventListener("click", cartRemove);
    return btn;
  }

  /**
   * Decreases the quantity of the clicked cart card by one.
   */
  function minusCardQty() {
    let card = this.closest(".cart-card");
    changeCartQty(card, -1);
  }

  /**
   * Increases the quantity of the clicked cart card by one.
   */
  function addCardQty() {
    let card = this.closest(".cart-card");
    changeCartQty(card, 1);
  }

  /**
   * Updates the quantity for a given cart card by the provided delta, persists
   * the change in localStorage, refreshes the card view, and adjusts the cart
   * total.
   * @param {HTMLElement} card - Cart card whose quantity is being changed.
   * @param {number} delta - Amount to add to the current quantity.
   */
  function changeCartQty(card, delta) {
    disconfirmOrder();

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

  /**
   * Updates the DOM view for a cart card after its quantity changes, keeping
   * the card display in sync with the stored quantity and subtotal.
   * @param {HTMLElement} card - Cart card to update.
   * @param {number} quantity - New quantity for the item.
   */
  function updateCardView(card, quantity) {
    if (quantity === 0) {
      cartRemove.call(card);

      let emptyCheck = checkEmptyCart();
      if (emptyCheck) {
        let title = emptyCheck[0];
        let message = emptyCheck[1];
        showStatus(title, message, false);
      }
    } else {
      let qtySpan = card.querySelector(".qty-control span");
      qtySpan.textContent = quantity;

      let price = parseInt(card.dataset.price);
      let total = card.querySelector(".card-subtotal");
      total.textContent = "$" + (price * quantity);

      let stock = parseInt(card.dataset.stock);
      let plusBtn = card.querySelector(".qty-plus");
      if (quantity === stock) {
        plusBtn.disabled = true;
      } else {
        plusBtn.disabled = false;
      }
    }
  }

  /**
   * Adjusts the global cart total by the given change amount and updates the
   * total price display.
   * @param {number} change - Amount to add to the current cart total.
   */
  function updateTotal(change) {
    let totalPrice = id("cart-total");
    cartTotal += change;
    totalPrice.textContent = "$" + cartTotal;
  }

  /**
   * Removes the associated cart card from the DOM and cart storage, updates
   * the cart total and count, and shows an empty-cart status when needed.
   */
  function cartRemove() {
    let card = this.closest(".cart-card");

    let cartId = card.id;
    let cart = localItemGet("cart");
    let qty = cart[cartId];

    let price = parseInt(card.dataset.price);
    let change = -1 * price * qty;
    updateTotal(change);

    card.remove();
    delete cart[cartId];
    localItemSet("cart", cart);

    let emptyCheck = checkEmptyCart();
    if (emptyCheck) {
      let title = emptyCheck[0];
      let message = emptyCheck[1];
      showStatus(title, message, false);
    } else {
      disconfirmOrder();
    }
  }

  /**
   * Checks whether the cart is empty and updates the cart-count display.
   * @returns {Array|null} [title, message, false] when the cart is empty;
   *                       otherwise null.
   */
  function checkEmptyCart() {
    let cart = localItemGet("cart");
    let cartNum = Object.keys(cart).length;
    id("cart-count").textContent = cartNum;
    if (cartNum === 0) {
      return ["Your cart is empty", "Add some items to your cart first!", false];
    }
    return null;
  }

  /**
   * Marks the current cart as confirmed, updates the status message,
   * and toggles the confirm/submit buttons.
   */
  function confirmOrder() {
    if (cartTotal === 0) {
      showStatus(
        "Your cart is empty",
        "You can't confirm with an empty cart!!",
        true
      );
    } else {
      localItemSet("order-confirm", true);

      showStatus(
        "Order confirmed!",
        "Submit your order now. " +
          "If you make any change or leave the shopping cart, it's no longer confirmed.",
         false
      );

      this.classList.add("hidden");
      id("submit-btn").classList.remove("hidden");
    }
  }

  /**
   * Clears any existing order-confirm state, updates the status message,
   * and restores the confirm/submit button visibility.
   */
  function disconfirmOrder() {
    let orderConfirm = localItemGet("order-confirm");
    if (orderConfirm) {
      localItemSet("order-confirm", false);

      showStatus(
        "Order disconfirmed!",
        "Looks like you made some changes, please re-confirm the order.",
        false
      );

      id("confirm-btn").classList.remove("hidden");
      id("submit-btn").classList.add("hidden");
    }
  }

  /**
   * Validates the cart, submits a bulk order to the backend,
   * and on success clears the cart and shows a confirmation code.
   */
  async function submitOrder() {
    let checkSelfBuy = checkSelfBuying();
    if (checkSelfBuy) {
      showStatus("Order Error", checkSelfBuy, true);
    } else {

      try {
        let confirmationCode = await handleBulkBuy();
        clearCart();
        showStatus("Order submited!", "Your confirmation code is " + confirmationCode, false);
      } catch (err) {
        showStatus("Could not submit order", err.message, true);
      }
    }
  }

  /**
   * Checks whether any item in the current cart belongs to the logged-in user.
   * @returns {string|null} Error message when the user is buying their own item;
   *                        otherwise null.
   */
  function checkSelfBuying() {
    let userId = localItemGet("userId");

    let cart = qsa(".cart-card");

    for (let card of cart) {
      let seller = parseInt(card.dataset["seller_id"]);

      if (userId === seller) {
        let cardTitle = card.querySelector(".card-title").textContent;
        return "You cannot buy your own item: " + cardTitle;
      }
    }

    return null;
  }

  /**
   * Builds and sends a bulk-buy request for all items in the cart and returns
   * the confirmation code from the backend.
   * @return {string} Confirmation code string returned by the backend.
   */
  async function handleBulkBuy() {
    let cart = localItemGet("cart");

    let postForm = buildBulkBuyForm(cart);

    let url = "/bulk-buy";
    let isJson = false;
    let confirmationCode = await dataFetch(url, isJson, postForm);

    return confirmationCode;
  }

  /**
   * Builds a FormData object representing a bulk-buy request for the given cart.
   * @param {Object} cart - Object mapping item ids to quantities.
   * @return {FormData} FormData containing a JSON-encoded "items" array.
   */
  function buildBulkBuyForm(cart) {
    let form = new FormData();
    let items = [];

    for (let id in cart) {
      id = parseInt(id);

      let qty = cart[id];
      items.push({
        "id": id,
        "quantity": qty
      });
    }
    items = JSON.stringify(items);

    form.append("items", items);

    return form;
  }

  /**
   * Clears the cart and confirmation state from localStorage and the DOM and
   * resets the cart count and total display.
   */
  function clearCart() {
    localItemSet("cart", {});
    localItemSet("order-confirm", false);

    let board = id("cart-board");
    board.innerHTML = "";

    id("cart-count").textContent = "0";

    updateTotal(-1 * cartTotal);

  }

  /**
   * Retrieves and parses a JSON value from localStorage.
   * @param {string} key - localStorage key to read.
   * @returns {string} Parsed value stored under the given key, or null if not set.
   */
  function localItemGet(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  /**
   * Stringifies and stores a value in localStorage under the given key.
   * @param {string} key - localStorage key to write.
   * @param {*} value - Value to stringify and store.
   */
  function localItemSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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