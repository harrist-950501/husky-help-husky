/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * history.js
 * Handles the transaction history page:
 *  - Back button to main page
 *  - Loads transactions from backend and renders them.
 *  - Sorting by time or price.
 *  - Allows buyers to rate items (POST /ratings).
 *
 * Backend endpoints used:
 *  - GET /history
 *  - POST /ratings
 */

"use strict";

(function() {
  const MAX_STARS = 5;

  // The transaction history grouded by code, for sorting purpose
  let transByCode = [];

  window.addEventListener("load", init);

  /**
   * Initializes the history page: checks login, wires UI controls, and loads transactions.
   */
  function init() {
    checkLocalStorage();

    id("back").addEventListener("click", back);

    id("transaction-sorting").addEventListener("change", applySortAndRender);

    loadHistory();
  }

  /**
   * Redirects to the login page when no user id is stored locally.
   */
  function checkLocalStorage() {
    let userId = localItemGet("userId", false);
    if (!userId) {
      window.location.href = "../index.html";
    }
  }

  /**
   * Navigate back to the main page.
   */
  function back() {
    window.location.href = "../main-page/main.html";
  }

  /**
   * Fetches and renders transaction history for the logged-in user.
   */
  async function loadHistory() {
    showStatus("Loading transactions...", "Please wait", false);

    try {
      let url = "/history";
      let isJson = true;
      let transactions = await dataFetch(url, isJson);
      if (transactions.length === 0) {
        showStatus("No transaction yet", "Go buy something first!", false);
      } else {
        transByCode = transGroup(transactions);

        renderTransactionList(transByCode);

        applySortAndRender();

        showStatus("Trantaction board", "Transaction load sucessful! Here you are!!", false);
      }
    } catch (err) {
      showStatus("Could not load transacitons", err.message, true);
    }
  }

  /**
   * Groups flat transaction rows by confirmation code and aggregates items.
   * Same (code, item_id) rows are merged and quantity is counted.
   * @param {Object[]} transactions - Flat transaction rows from /history.
   * @returns {Object[]} Array of grouped transactions by code.
   */
  function transGroup(transactions) {
    let groupsByCode = {};

    for (let tran of transactions) {
      const code = tran["confirmation_code"];

      if (!groupsByCode[code]) {
        groupsByCode[code] = {
          code: code,
          date: tran.date,
          items: [],
          itemCount: 0,
          totalPrice: 0
        };
      }

      let group = groupsByCode[code];

      let item = group.items.find(it => it.id === tran["item_id"]);

      if (!item) {
        item = {
          id: tran["item_id"],
          title: tran.title,
          price: tran.price,
          quantity: 0
        };
        group.items.push(item);
      }

      item.quantity += 1;
      group.itemCount += 1;
      group.totalPrice += tran.price;
    }

    return Object.values(groupsByCode);
  }

  /**
   * Applies the current sort option to grouped transactions and updates the board.
   */
  function applySortAndRender() {
    // Copy of transByCod, protect the original sequence
    let list = transByCode.slice();

    const sort = id("transaction-sorting").value;

    if (sort === "price") {
      list.sort(compareByPrice);
    } else {
      list.sort(compareByTime);
    }

    const board = id("transaction-board");

    list.forEach(tx => {
      board.appendChild(tx.node);
    });

    showStatus("Trantaction board", "Sorting applied: " + sort, false);
  }

  /**
   * Comparator for sorting transactions by time, newest first.
   * @param {Object} first - First transaction.
   * @param {Object} second - Second transaction.
   * @returns {number} Positive when first is older than second.
   */
  function compareByTime(first, second) {
    if (!first.date && !second.date) {
      return 0;
    }
    if (!first.date) {
      return 1;
    }
    if (!second.date) {
      return -1;
    }

    const timeA = new Date(first.date).getTime();
    const timeB = new Date(second.date).getTime();
    return timeB - timeA;
  }

  /**
   * Comparator for sorting transactions by price, highest first.
   * @param {Object} left - First transaction to compare.
   * @param {Object} right - Second transaction to compare.
   * @returns {number} Positive when left < right (for descending sort).
   */
  function compareByPrice(left, right) {
    const priceLeft = typeof left.totalPrice === "number" ? left.totalPrice : 0;
    const priceRight = typeof right.totalPrice === "number" ? right.totalPrice : 0;
    return priceRight - priceLeft;
  }

  /**
   * Renders each grouped transaction into the history board.
   * @param {Object[]} transactions - Transaction groups to display on the board.
   */
  function renderTransactionList(transactions) {
    let board = id("transaction-board");
    transactions.forEach(tx => {
      let article = createTransactionCard(tx);
      tx.node = article;
      board.appendChild(article);
    });
  }

  /**
   * Creates a transaction card and wires its subparts.
   * Card contains a header, an order list, and a rating footer.
   * @param {Object} tx - Transaction group object (code, date, items, totals).
   * @returns {HTMLElement} The created article element.
   */
  function createTransactionCard(tx) {
    const card = gen("article");
    card.classList.add("transaction-card");
    card.dataset.code = tx.code;
    card.dataset.date = tx.date;
    card.dataset.totalPrice = tx.totalPrice;
    card.dataset.itemCount = tx.itemCount;

    addTransactionHeader(card, tx);
    addTransactionList(card, tx);
    addTransactionFooter(card);

    return card;
  }

  /**
   * Adds the header section to a transaction card.
   * Header shows the order label, confirmation code, date, and summary.
   * @param {HTMLElement} card - Transaction card to append to.
   * @param {Object} tx - Transaction group object.
   */
  function addTransactionHeader(card, tx) {
    const header = gen("header");

    addHeaderMain(header, tx);
    addHeaderMeta(header, tx);

    card.appendChild(header);
  }

  /**
   * Adds the main header row: static "Order" label and confirmation code.
   * @param {HTMLElement} header - Header element to append to.
   * @param {Object} tx - Transaction group object.
   */
  function addHeaderMain(header, tx) {
    const main = gen("section");
    main.classList.add("main");

    const label = gen("p");
    label.classList.add("label");
    label.textContent = "ORDER";

    const code = gen("h3");
    code.classList.add("code");
    code.textContent = "#" + tx.code;

    main.appendChild(label);
    main.appendChild(code);
    header.appendChild(main);
  }

  /**
   * Adds the meta header row: purchase date and item/total summary.
   * @param {HTMLElement} header - Header element to append to.
   * @param {Object} tx - Transaction group object.
   */
  function addHeaderMeta(header, tx) {
    const meta = gen("section");
    meta.classList.add("meta");

    const date = gen("p");
    date.classList.add("date");
    date.textContent = tx.date;

    const summary = gen("p");
    summary.classList.add("summary");

    const count = tx.itemCount;
    summary.textContent = count +
      (count === 1 ? " item" : " items") +
      " · $" + (tx.totalPrice);

    meta.appendChild(date);
    meta.appendChild(summary);
    header.appendChild(meta);
  }

  /**
   * Adds the order list for all items in a transaction group.
   * @param {HTMLElement} card - Transaction card to append to.
   * @param {Object} tx - Transaction group object with an items array.
   */
  function addTransactionList(card, tx) {
    const list = gen("ul");
    list.classList.add("order-list");

    for (const item of tx.items) {
      list.appendChild(createOrderItem(item));
    }

    card.appendChild(list);
  }

  /**
   * Creates a single order row for one purchased item.
   * Row shows item title, quantity, unit price, and a Rate button.
   * @param {Object} item - Item object (id, title, quantity, price).
   * @returns {HTMLElement} The created li element.
   */
  function createOrderItem(item) {
    const li = gen("li");
    li.classList.add("order-item");
    li.dataset.itemId = item.id;

    const main = gen("section");
    main.classList.add("main");

    const title = gen("p");
    title.classList.add("title");
    title.textContent = item.title;

    const meta = gen("p");
    meta.classList.add("meta");

    meta.textContent = "Qty " + item.quantity + " · $" + item.price + " each";

    main.appendChild(title);
    main.appendChild(meta);

    const rateBtn = gen("button");
    rateBtn.classList.add("rate-btn");
    rateBtn.textContent = "Rate";
    rateBtn.addEventListener("click", showRatePanel);

    li.appendChild(main);
    li.appendChild(rateBtn);

    return li;
  }

  /**
   * Adds the rating footer panel to a transaction card.
   * Footer shows the current rating target and inputs for stars/comment.
   * @param {HTMLElement} card - Transaction card to append to.
   */
  function addTransactionFooter(card) {
    const footer = gen("footer");
    footer.classList.add("rate-panel", "hidden");

    addFooterTargetRow(footer);
    addFooterStarsRow(footer);
    addFooterCommentRow(footer);
    addFooterActionRow(footer);

    card.appendChild(footer);
  }

  /**
   * Adds the "Rating item" label and dynamic target title row.
   * @param {HTMLElement} footer - Footer element to append to.
   */
  function addFooterTargetRow(footer) {
    const label = gen("p");
    label.classList.add("target-label");
    label.textContent = "Rating item:";

    const targetTitle = gen("p");
    targetTitle.classList.add("target-title");

    footer.appendChild(label);
    footer.appendChild(targetTitle);
  }

  /**
   * Adds the stars select row to the rating footer.
   * @param {HTMLElement} footer - Footer element to append to.
   */
  function addFooterStarsRow(footer) {
    const starsRow = gen("section");

    const starsLabel = gen("label");
    starsLabel.textContent = "Stars:";

    const select = gen("select");
    select.classList.add("rate-stars");
    select.name = "stars";

    for (let i = 1; i <= MAX_STARS; i++) {
      const opt = gen("option");
      opt.value = String(i);
      opt.textContent = String(i);
      select.appendChild(opt);
    }

    starsLabel.appendChild(select);
    starsRow.appendChild(starsLabel);
    footer.appendChild(starsRow);
  }

  /**
   * Adds the comment textarea row to the rating footer.
   * @param {HTMLElement} footer - Footer element to append to.
   */
  function addFooterCommentRow(footer) {
    const commentRow = gen("section");

    const commentLabel = gen("label");
    commentLabel.textContent = "Comment:";

    const textarea = gen("textarea");
    textarea.classList.add("rate-comment");
    textarea.name = "comment";
    textarea.rows = 3;

    commentLabel.appendChild(textarea);
    commentRow.appendChild(commentLabel);
    footer.appendChild(commentRow);
  }

  /**
   * Adds the submit and cancel buttons row to the rating footer.
   * @param {HTMLElement} footer - Footer element to append to.
   */
  function addFooterActionRow(footer) {
    const actions = gen("section");
    actions.classList.add("rate-actions");

    const submitBtn = gen("button");
    submitBtn.classList.add("submit-btn");
    submitBtn.textContent = "Submit";
    submitBtn.addEventListener("click", handleRateSubmit);

    const cancelBtn = gen("button");
    cancelBtn.classList.add("cancel-btn", "secondary-btn");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", closeRatePanel);

    actions.appendChild(submitBtn);
    actions.appendChild(cancelBtn);
    footer.appendChild(actions);
  }

  /**
   * Shows the rating panel for the clicked order item and fills in its metadata.
   * @param {MouseEvent} evt - Click event from a Rate button.
   */
  function showRatePanel(evt) {
    const itemRow = evt.currentTarget.closest(".order-item");
    const card = itemRow.closest(".transaction-card");
    const footer = card.querySelector(".rate-panel");

    qsa(".rate-panel").forEach(panel => {
      if (panel !== footer) {
        panel.classList.add("hidden");
      }
    });

    const titleText = itemRow.querySelector(".title").textContent;
    const targetTitle = footer.querySelector(".target-title");
    const starsSelect = footer.querySelector(".rate-stars");
    const commentArea = footer.querySelector(".rate-comment");

    footer.dataset.itemId = itemRow.dataset.itemId;
    targetTitle.textContent = titleText;

    starsSelect.value = "1";
    commentArea.value = "";

    footer.classList.remove("hidden");
  }

  /**
   * Hides the rating panel for the current transaction card.
   * @param {MouseEvent} evt - Click event from the Cancel button.
   */
  function closeRatePanel(evt) {
    const footer = evt.currentTarget.closest(".rate-panel");
    hideRatePanel(footer);
  }

  /**
   * Utility to hide a rating panel element without affecting other cards.
   * @param {HTMLElement} footer - Rating panel footer element to hide.
   */
  function hideRatePanel(footer) {
    footer.classList.add("hidden");
  }

  /**
   * Submits the current rating for the selected item and updates page status.
   * @param {MouseEvent} evt - Click event from the Submit button.
   */
  async function handleRateSubmit(evt) {
    evt.preventDefault();

    const footer = evt.currentTarget.closest(".rate-panel");
    const itemId = footer.dataset.itemId;

    const starsSelect = footer.querySelector(".rate-stars");
    const commentArea = footer.querySelector(".rate-comment");

    const stars = Number(starsSelect.value);

    const comment = commentArea.value.trim();

    const form = new FormData();
    form.append("item_id", itemId);
    form.append("stars", stars);
    if (comment) {
      form.append("comment", comment);
    }

    showStatus("Submitting rating...", "Sending your rating. Please wait.", false);

    try {
      await dataFetch("/ratings", true, form);
      showStatus("Rating submitted", "Thank you for rating this item!", false);
      hideRatePanel(footer);
    } catch (err) {
      showStatus("Could not submit rating", err.message, true);
    }
  }

  /**
   * Retrieves a value from localStorage, optionally parsing it as JSON.
   * @param {string} key - localStorage key to read.
   * @param {boolean} isJson - Whether to parse the stored value as JSON.
   * @returns {string|Object|null} Parsed value if isJson is true, the raw string
   *          value otherwise, or null if the key is not set.
   */
  function localItemGet(key, isJson) {
    if (isJson) {
      return JSON.parse(localStorage.getItem(key));
    }
    return localStorage.getItem(key);
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