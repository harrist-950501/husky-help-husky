/**
 * history.js
 * Handles the transaction history page:
 *  - Back button to main page
 *  - Loads transactions from backend and renders them.
 *
 * Backend endpoint used:
 *  - GET /history/:user_id
 */

"use strict";

(function() {
  // Same demo user id as main.js for now.
  const CURRENT_USER_ID = 1;
  let allTransactions = [];

  window.addEventListener("load", init);

  /**
   * Initialize page: wire back button and load transaction history.
   */
  function init() {
    id("back").addEventListener("click", back);
    id("transaction-sorting").addEventListener("change", applySortAndRender);

    loadHistory();
  }

  /**
   * Fetch transaction history for CURRENT_USER_ID and render it.
   */
  async function loadHistory() {
    const board = id("transaction-board");
    if (board) {
      board.textContent = "Loading transactions...";
    }

    try {
      const resp = await fetch("/history/" + CURRENT_USER_ID);
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
   * Applies the current sort selection to allTransactions and re-renders
   * the list using renderTransactions.
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
   * Assumes tx.date is a string that can be passed into Date().
   * @param {Object} first - First transaction.
   * @param {Object} second - Second transaction.
   * @returns {number} negative if a < b, positive if a > b, 0 if equal.
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
   * @param {Object} a - First transaction.
   * @param {Object} b - Second transaction.
   * @returns {number} negative if a < b, positive if a > b, 0 if equal.
   */
  function compareByPrice(a, b) {
    const priceA = typeof a.price === "number" ? a.price : 0;
    const priceB = typeof b.price === "number" ? b.price : 0;

    return priceB - priceA;
  }

  /**
   * Renders transaction data into the #transaction-board area by clearing the
   * previous content and either showing an empty message or displaying each
   * transaction using helper functions.
   * @param {Array<Object>} transactions - Array of transaction rows returned from backend.
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
   * Removes all existing children from a container element.
   * @param {HTMLElement} board - The container to clear.
   */
  function clearBoard(board) {
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }
  }

  /**
   * Displays a fallback "No transactions yet." message inside a container.
   * @param {HTMLElement} board - The container where the message is inserted.
   */
  function renderEmptyMessage(board) {
    const pTag = document.createElement("p");
    pTag.textContent = "No transactions yet.";
    board.appendChild(pTag);
  }

  /**
   * Iterates through a list of transactions and inserts each transaction’s
   * DOM element (created by createTransactionElement) into the container.
   * @param {HTMLElement} board - The container where transaction elements are added.
   * @param {Array<Object>} transactions - Array of transaction rows.
   */
  function renderTransactionList(board, transactions) {
    transactions.forEach(tx => {
      const article = createTransactionElement(tx);
      board.appendChild(article);
    });
  }

  /**
   * Creates a fully structured <article> element representing a single
   * transaction, including title, user role, date, price, and description.
   * @param {Object} tx - Transaction row containing item and transaction fields.
   * @returns {HTMLElement} The constructed DOM element representing the transaction.
   */
  function createTransactionElement(tx) {
    const article = document.createElement("article");
    article.className = "transaction";

    const title = document.createElement("h3");
    title.textContent = tx.title || "Item #" + tx.item_id;
    article.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "muted";
    const roleText = tx.buyer_id === CURRENT_USER_ID ? "Buyer" : "Seller";
    const dateText = tx.date ? " on " + tx.date : "";
    meta.textContent = roleText + dateText;
    article.appendChild(meta);

    if (typeof tx.price === "number") {
      const price = document.createElement("p");
      price.className = "price";
      price.textContent = "Total: $" + tx.price.toFixed(2);
      article.appendChild(price);
    }

    if (tx.description) {
      const desc = document.createElement("p");
      desc.className = "description";
      desc.textContent = tx.description;
      article.appendChild(desc);
    }

    return article;
  }

  /**
   * Back to main page
   */
  function back() {
    window.location.href = "../main-page/main.html";
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }
})();