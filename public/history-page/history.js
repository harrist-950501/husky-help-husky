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

  window.addEventListener("load", init);

  /**
   * Initialize page: wire back button and load transaction history.
   */
  function init() {
    id("back").addEventListener("click", back);
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
      const list = Array.isArray(data) ? data : [];
      renderTransactions(list);
    } catch (err) {
      console.error(err);
      if (board) {
        board.textContent = "Could not load transactions.";
      }
    }
  }

  /**
   * Render a list of transactions into the board element.
   * Clears any existing content and delegates per-item rendering.
   * @param {Array<Object>} transactions - transaction rows.
   */
  function renderTransactions(transactions) {
    const board = id("transaction-board");
    if (!board) return;

    // Clear any placeholder content.
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }

    if (!transactions.length) {
      const pTag = document.createElement("p");
      pTag.textContent = "No transactions yet.";
      board.appendChild(p);
      return;
    }
    transactions.forEach(tx => renderTransaction(board, tx));
  }

  /**
   * Render a single transaction object and append it to the board.
   * Keeps this function focused so it stays under ~30 lines.
   * @param {HTMLElement} board - container element for transactions.
   * @param {Object} tx - single transaction row.
   */
  function renderTransaction(board, tx) {
    const article = document.createElement("article");
    article.className = "transaction";

    const title = document.createElement("h3");
    title.textContent = tx.title || "Item #" + tx.item_id;
    article.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "muted";
    const role = tx.buyer_id === CURRENT_USER_ID ? "Buyer" : "Seller";
    const dateText = tx.date ? (" on " + tx.date) : "";
    meta.textContent = role + dateText;
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

    board.appendChild(article);
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