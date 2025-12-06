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
 *  - GET /history/:user_id
 *  - POST /ratings
 */

"use strict";

(function() {

  /**
   * Same demo user id as main.js for now.
   * Logged-in user id, stored at login time.
   */
  const CURRENT_USER_ID = Number(localStorage.getItem("userId"));
  const JSON_TYPE = "application/json";
  const MAX_STARS = 5;
  let allTransactions = [];

  window.addEventListener("load", init);

  /**
   * Initialize page: wire back button, sorting, and load transaction history.
   */
  function init() {
    if (!CURRENT_USER_ID) {

      // not logged in or localStorage cleared, go back to login
      window.location.href = "../index.html";
      return;
    }
    let backBtn = id("back");
    if (backBtn) {
      backBtn.addEventListener("click", back);
    }

    let sortSelect = id("transaction-sorting");
    if (sortSelect) {
      sortSelect.addEventListener("change", applySortAndRender);
    }

    loadHistory();
  }

  /**
   * Fetch transaction history for CURRENT_USER_ID and render it.
   */
  async function loadHistory() {
    const board = id("transaction-board");
    if (board) {
      board.textContent = "Loading transactins...";
    }

    try {
      const resp = await fetch("/history");
      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || "Failed to load history.");
      }

      const data = await resp.json();
      allTransactions = Array.isArray(data) ? data : [];
      applySortAndRender();
    } catch (err) {
      console.error(err);
      if (board) {
        board.textContent = "Could not load transactions.";
      }
    }
  }

  /**
   * Applies the current sort selection to allTransactions and re-renders.
   */
  /**
   * Applies the current sort selection to allTransactions and re-renders.
   * @returns {void}
   */
  function applySortAndRender() {
    const select = id("transaction-sorting");
    const criterion = select ? select.value : "time";
    const list = allTransactions.slice();

    if (criterion === "price") {
      list.sort(compareByPrice);
    } else {
      list.sort(compareByTime);
    }

    renderTransactions(list);
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
    const priceLeft = typeof left.price === "number" ? left.price : 0;
    const priceRight = typeof right.price === "number" ? right.price : 0;
    return priceRight - priceLeft;
  }

  /**
   * Renders transaction data into the #transaction-board area.
   */
  /**
   * Render a list of transactions into the board element.
   * @param {Array<Object>} transactions - Array of transaction objects.
   * @returns {void}
   */
  function renderTransactions(transactions) {
    const board = id("transaction-board");
    if (!board) {
      return;
    }

    clearBoard(board);

    if (!transactions.length) {
      renderEmptyMessage(board);
      return;
    }

    renderTransactionList(board, transactions);
  }

  /**
   * Clear all children from an element.
   * @param {Element} board - Element to clear.
   * @returns {void}
   */
  function clearBoard(board) {
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }
  }

  /**
   * Show a friendly empty message.
   * @param {Element} board - Element to append message to.
   * @returns {void}
   */
  function renderEmptyMessage(board) {
    const pTag = document.createElement("p");
    pTag.textContent = "No transactions yet.";
    board.appendChild(pTag);
  }

  /**
   * Render each transaction into the board.
   * @param {Element} board - Container element.
   * @param {Array<Object>} transactions - Transactions to render.
   * @returns {void}
   */
  function renderTransactionList(board, transactions) {
    transactions.forEach(tx => {
      const article = createTransactionElement(tx);
      board.appendChild(article);
    });
  }

  /**
   * Creates a transaction article element and wires its subparts.
   * @param {Object} tx - Transaction object from the backend.
   * @returns {Element} The created article element.
   */
  function createTransactionElement(tx) {
    const article = document.createElement("article");
    article.className = "transaction";

    addTransactionTitle(article, tx);
    addTransactionMeta(article, tx);
    addTransactionPrice(article, tx);
    addTransactionDescription(article, tx);
    attachRatingUI(article, tx);

    return article;
  }

  /**
   * Add title element to a transaction article.
   * @param {Element} article - Article element to append to.
   * @param {Object} tx - Transaction object.
   * @returns {void}
   */
  function addTransactionTitle(article, tx) {
    const title = document.createElement("h3");
    title.textContent = tx.title || "Item #" + (tx.item_id || "");
    article.appendChild(title);
  }

  /**
   * Add metadata (role/date) to a transaction article.
   * @param {Element} article - Article element.
   * @param {Object} tx - Transaction object.
   * @returns {void}
   */
  function addTransactionMeta(article, tx) {
    const meta = document.createElement("p");
    meta.className = "muted";

    const roleText = tx.buyer_id === CURRENT_USER_ID ? "Buyer" : "Seller";
    const dateText = tx.date ? " on " + tx.date : "";
    meta.textContent = roleText + dateText;

    article.appendChild(meta);
  }

  /**
   * Add price display to a transaction article when present.
   * @param {Element} article - Article element.
   * @param {Object} tx - Transaction object.
   * @returns {void}
   */
  function addTransactionPrice(article, tx) {
    if (typeof tx.price !== "number") {
      return;
    }
    const price = document.createElement("p");
    price.className = "price";
    price.textContent = "Total: $" + tx.price.toFixed(2);
    article.appendChild(price);
  }

  /**
   * Add description paragraph when available.
   * @param {Element} article - Article element.
   * @param {Object} tx - Transaction object.
   * @returns {void}
   */
  function addTransactionDescription(article, tx) {
    if (!tx.description) {
      return;
    }
    const desc = document.createElement("p");
    desc.className = "description";
    desc.textContent = tx.description;
    article.appendChild(desc);
  }

  /**
   * Adds rating UI (button + display) to a transaction article
   * if the current user is the buyer.
   */
  /**
   * Attach rating UI for buyers. Creates a button and rating display.
   * @param {Element} article - Article element to attach to.
   * @param {Object} tx - Transaction object.
   * @returns {void}
   */
  function attachRatingUI(article, tx) {
    if (tx.buyer_id !== CURRENT_USER_ID) {
      return;
    }

    article.dataset.itemId = tx.item_id;

    const row = document.createElement("div");
    row.className = "rating-row";

    const btn = document.createElement("button");
    btn.className = "rate-btn";
    btn.textContent = "Rate this item";

    const display = document.createElement("p");
    display.className = "rating-display";

    // if we already have a rating stored show it immediately (use bracket notation for snake_case)
    if (typeof tx["user_rating"] === "number") {
      display.textContent = "Your rating: ⭐ " + tx["user_rating"];
    }

    btn.addEventListener("click", () => {
      showInlineRatingForm(article, tx, display);
    });

    row.appendChild(btn);
    row.appendChild(display);
    article.appendChild(row);
  }

  /**
   * Handles clicking on "Rate this item": prompts for stars/comment,
   * sends to backend, then updates the display text.
   */
  /**
   * Create star rating select dropdown.
   * @returns {Element} Select element with star options.
   */
  function createStarSelect() {
    const starLabel = document.createElement('label');
    starLabel.textContent = 'Stars: ';
    const starSelect = document.createElement('select');
    starSelect.name = 'stars';
    for (let i = 1; i <= MAX_STARS; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      starSelect.appendChild(opt);
    }
    starLabel.appendChild(starSelect);
    return starLabel;
  }

  /**
   * Create comment input textarea with label.
   * @returns {Element} Label containing textarea element.
   */
  function createCommentInput() {
    const commentLabel = document.createElement('label');
    commentLabel.textContent = ' Comment: ';
    const commentInput = document.createElement('textarea');
    commentInput.name = 'comment';
    commentInput.rows = 2;
    commentInput.cols = 30;
    commentLabel.appendChild(commentInput);
    return commentLabel;
  }

  /**
   * Build form with inputs and buttons.
   * @returns {Object} Object with form, starSelect, commentInput, submitBtn, cancelBtn, status.
   */
  function buildRatingFormElements() {
    const form = document.createElement('form');
    form.className = 'inline-rating-form';

    const starLabel = createStarSelect();
    const starSelect = starLabel.querySelector('select');
    const commentLabel = createCommentInput();
    const commentInput = commentLabel.querySelector('textarea');

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Submit';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';

    const status = document.createElement('span');
    status.className = 'rating-status';

    form.appendChild(starLabel);
    form.appendChild(commentLabel);
    form.appendChild(submitBtn);
    form.appendChild(cancelBtn);
    form.appendChild(status);

    return {form, starSelect, commentInput, submitBtn, cancelBtn, status};
  }

  /**
   * Handle form submission for rating.
   * @param {HTMLFormElement} form - Form element.
   * @param {HTMLSelectElement} starSelect - Star select element.
   * @param {HTMLTextAreaElement} commentInput - Comment textarea element.
   * @param {HTMLSpanElement} status - Status display element.
   * @param {Object} tx - Transaction object.
   * @param {Element} displayElem - Element to update after submission.
   * @returns {void}
   */
  function handleRatingSubmit(form, starSelect, commentInput, status, tx, displayElem) {
    const stars = Number(starSelect.value);
    if (!Number.isInteger(stars) || stars < 1 || stars > MAX_STARS) {
      status.textContent = `Enter a whole number 1-${MAX_STARS}`;
      return;
    }

    const comment = commentInput.value || '';
    tx['user_rating'] = stars;
    tx['user_comment'] = comment;

    const body = {
      'item_id': tx.item_id,
      'stars': stars,
      'comment': comment
    };

    submitRating(body)
      .then(() => {
        if (displayElem) {
          displayElem.textContent = 'Your rating: ' + tx['user_rating'] + '⭐️';
        }
        form.remove();
      })
      .catch(err => {
        console.error(err);
        status.textContent = err.message || 'Could not submit rating.';
      });
  }

  /**
   * Wire form submit and cancel events for rating submission.
   * @param {Object} elements - Form elements object from buildRatingFormElements.
   * @param {Object} tx - Transaction object.
   * @param {Element} displayElem - Display element to update after submission.
   * @returns {void}
   */
  function wireRatingFormEvents(elements, tx, displayElem) {
    const {form, starSelect, commentInput, cancelBtn, status} = elements;

    cancelBtn.addEventListener('click', () => form.remove());

    form.addEventListener('submit', evt => {
      evt.preventDefault();
      handleRatingSubmit(form, starSelect, commentInput, status, tx, displayElem);
    });
  }

  /**
   * Show an inline rating form instead of using prompt/alert.
   * @param {Element} container - Container article element.
   * @param {Object} tx - Transaction object.
   * @param {Element} displayElem - Element to update with rating text.
   * @returns {void}
   */
  function showInlineRatingForm(container, tx, displayElem) {
    // avoid creating multiple forms
    const existing = container.querySelector('.inline-rating-form');
    if (existing) {
      return;
    }

    const elements = buildRatingFormElements();
    wireRatingFormEvents(elements, tx, displayElem);

    // append form into the article after the rating row
    const row = container.querySelector('.rating-row') || container;
    row.appendChild(elements.form);
  }

  /**
   * Sends a POST /ratings request to the backend.
   * @param {Object} body - Request body with user_id, item_id, stars, comment.
   * @returns {Promise} Promise resolving to JSON response from server.
   */
  async function submitRating(body) {
    const resp = await fetch("/ratings", {
      method: "POST",
      headers: {"Content-Type": JSON_TYPE},
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg || "Failed to submit rating.");
    }

    return resp.json();
  }

  /**
   * Navigate back to the main page.
   */
  function back() {
    window.location.href = "../main-page/main.html";
  }

  /**
   * Shortcut for `document.getElementById`.
   * @param {string} idName - ID of element to find.
   * @returns {?Element} The element or null if not found.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

})();