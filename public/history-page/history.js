/**
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
  // Same demo user id as main.js for now.
  const CURRENT_USER_ID = 1;
  const JSON_TYPE = "application/json";
  let allTransactions = [];

  window.addEventListener("load", init);

  /**
   * Initialize page: wire back button, sorting, and load transaction history.
   */
  function init() {
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
   * Applies the current sort selection to allTransactions and re-renders.
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
   */
  function compareByPrice(a, b) {
    const priceA = typeof a.price === "number" ? a.price : 0;
    const priceB = typeof b.price === "number" ? b.price : 0;
    return priceB - priceA;
  }

  /**
   * Renders transaction data into the #transaction-board area.
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

  function clearBoard(board) {
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }
  }

  function renderEmptyMessage(board) {
    const pTag = document.createElement("p");
    pTag.textContent = "No transactions yet.";
    board.appendChild(pTag);
  }

  function renderTransactionList(board, transactions) {
    transactions.forEach(tx => {
      const article = createTransactionElement(tx);
      board.appendChild(article);
    });
  }

  /**
   * Creates a <article> element representing a single transaction
   * and attaches rating UI for buyers.
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

  function addTransactionTitle(article, tx) {
    const title = document.createElement("h3");
    title.textContent = tx.title || "Item #" + tx.item_id;
    article.appendChild(title);
  }

  function addTransactionMeta(article, tx) {
    const meta = document.createElement("p");
    meta.className = "muted";

    const roleText = tx.buyer_id === CURRENT_USER_ID ? "Buyer" : "Seller";
    const dateText = tx.date ? " on " + tx.date : "";
    meta.textContent = roleText + dateText;

    article.appendChild(meta);
  }

  function addTransactionPrice(article, tx) {
    if (typeof tx.price !== "number") {
      return;
    }
    const price = document.createElement("p");
    price.className = "price";
    price.textContent = "Total: $" + tx.price.toFixed(2);
    article.appendChild(price);
  }

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

    // if we already have a rating stored show it immediately
    if (typeof tx.user_rating === "number") {
      display.textContent = "Your rating: ⭐ " + tx.user_rating;
    }

    btn.addEventListener("click", () => {
      handleRateClick(tx, display);
    });

    row.appendChild(btn);
    row.appendChild(display);
    article.appendChild(row);
  }

  /**
   * Handles clicking on "Rate this item": prompts for stars/comment,
   * sends to backend, then updates the display text.
   */
  function handleRateClick(tx, displayElem) {
    const starsInput = prompt("Stars (1 to 5):");
    if (!starsInput) {
      return;
    }

    const stars = Number(starsInput);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      alert("Please enter a whole number from 1 to 5.");
      return;
    }

    const comment = prompt("Optional comment:") || "";

    // store rating on the transaction object so re-sorting keeps it
    tx.user_rating = stars;
    tx.user_comment = comment;

    const body = {
      user_id: CURRENT_USER_ID,
      item_id: tx.item_id,
      stars: stars,
      comment: comment
    };

    submitRating(body)
      .then(() => {
        if (displayElem) {
          displayElem.textContent = "Your rating: " + tx.user_rating + "⭐️";
        }
      })
      .catch(err => {
        alert(err.message || "Could not submit rating.");
      });
  }

  /**
   * Sends a POST /ratings request to the backend.
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
   * Back to main page.
   */
  function back() {
    window.location.href = "../main-page/main.html";
  }

  function id(idName) {
    return document.getElementById(idName);
  }

})();