/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 */

"use strict";

(function() {
  window.addEventListener("load", init);

  function init() {
    checkLocalStorage();

    loadItems();

    qsa(".back-btn").forEach(button => {
      button.addEventListener("click", back);
    });
  }

  function checkLocalStorage() {
    let cart = localStorage.getItem("cart");
    if (!cart) {
      cart = {};
      localStorage.setItem("cart", JSON.stringify(cart));
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

    let cart = JSON.parse(localStorage.getItem("cart"));
    let ids = Object.keys(cart);
    if (!checkEmptyCart()) {
      try {
        let isJson = true;
        for (let i = 0; i < ids.length; i++) {
          let id = ids[i];
          let item = await dataFetch("/items?id=" + id, isJson);
          let card = createCartCard(item, cart[id]);
          board.appendChild(card);
        }
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

    card.appendChild(createCartImg(item));
    card.appendChild(createCartMain(item));
    card.appendChild(createCartActions(item, quantity));

    return card;
  }

  /**
   * Creates the image section of a cart card.
   * @param {Object} item - item data.
   * @returns {HTMLElement} section.cart-img element.
   */
  function createCartImg(item) {
    let imgSection = gen("section");
    imgSection.classList.add("cart-img");

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
  function createCartMain(item) {
    let mainSection = gen("section");
    mainSection.classList.add("cart-main");

    let title = gen("h3");
    title.classList.add("cart-title");
    title.textContent = item.title;

    let meta = gen("p");
    meta.classList.add("cart-meta");
    meta.textContent = item.category +
      " · Seller #" + item.seller_id +
      " · " + item.stock + " left";

    let price = gen("p");
    price.classList.add("cart-price");
    price.textContent = "$" + item.price;

    mainSection.appendChild(title);
    mainSection.appendChild(meta);
    mainSection.appendChild(price);

    return mainSection;
  }

  function createCartActions(item, quantity) {
    let actions = gen("section");
    actions.classList.add("cart-actions");

    actions.appendChild(createQtyControl(quantity, item.stock));
    actions.appendChild(createCartSubtotal(item.price, quantity));
    actions.appendChild(createCartRemoveBtn());

    return actions;
  }

  function createQtyControl(quantity, stock) {
    let box = gen("section");
    box.classList.add("qty-control");

    let minus = gen("button");
    minus.textContent = "-";
    minus.classList.add("qty-minus");
    minus.addEventListener("click", minusCartQty);

    let count = gen("span");
    count.textContent = quantity;

    let plus = gen("button");
    plus.textContent = "+";
    plus.classList.add("qty-plus");
    plus.id = stock;
    plus.addEventListener("click", addCartQty);

    box.appendChild(minus);
    box.appendChild(count);
    box.appendChild(plus);

    return box;
  }

  function createCartSubtotal(price, quantity) {
    let subtotal = gen("p");
    subtotal.classList.add("cart-subtotal");
    subtotal.textContent = "$" + (price * quantity);
    return subtotal;
  }

  function createCartRemoveBtn() {
    let btn = gen("button");
    btn.classList.add("remove-btn");
    btn.textContent = "Remove";
    btn.addEventListener("click", removeCart);
    return btn;
  }

  function minusCartQty() {
    let cartId = this.closest(".cart-card").id;
    let cart = JSON.parse(localStorage.getItem("cart"));
    let qty = parseInt(cart[cartId]);

    let qtySpan = this.parentElement.querySelector("span");
    qty--;
    qtySpan.textContent = qty;
    cart[cartId] = qty;

    localStorage.setItem("cart", JSON.stringify(cart));

    this.parentElement.querySelector(".qty-plus").disabled = false;
    if (qty === 0) {
      let card = this.closest(".cart-card");
      card.remove();
      delete cart[cartId];
      localStorage.setItem("cart", JSON.stringify(cart));
      checkEmptyCart();
    }
  }

  function addCartQty() {
    let stock = parseInt(this.id);

    let cartId = this.closest(".cart-card").id;
    let cart = JSON.parse(localStorage.getItem("cart"));
    let qty = parseInt(cart[cartId]);

    let qtySpan = this.parentElement.querySelector("span");
    qty++;
    qtySpan.textContent = qty;
    cart[cartId] = qty;

    localStorage.setItem("cart", JSON.stringify(cart));

    if (qty === stock) {
      this.disabled = true;
    }
  }

  function removeCart() {
    let cartId = this.closest(".cart-card").id;
    let card = this.closest(".cart-card");
    card.remove();
    let cart = JSON.parse(localStorage.getItem("cart"));
    delete cart[cartId];
    localStorage.setItem("cart", JSON.stringify(cart));
    checkEmptyCart();
  }


  function checkEmptyCart() {
    let cart = JSON.parse(localStorage.getItem("cart"));
    let cartNum = Object.keys(cart).length;
    if(cartNum === 0) {
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