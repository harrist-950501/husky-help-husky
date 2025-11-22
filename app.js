/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * This is the backend API for the Husky Help Husky second-hand trading site.
 * It handles login authentication, retrieving items, searching/filtering,
 * fetching item details, creating transactions, and viewing transaction history.
 */

"use strict";

const express = require("express");
const multer = require("multer");
const sqlite3 = require('sqlite3');
const sqlite = require("sqlite");

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* DB CONNECTION */
/**
 * RENA: THIS IS COPIED FROM LEC SLIDE, WE SHOULD CHANGE TO OUR OWN VER!!
 * 
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {sqlite3.Database} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "husky_test.db",
    driver: sqlite3.Database
  });
  return db;
}

/* HELPERS */
function requireParams(params, body) {
  for (let p of params) {
    if (!body[p]) {
      return `Missing parameter: ${p}`;
    }
  }
  return null;
}

function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/* ROUTES */
/**
 * POST /login
 * Body: username, password (FormData, JSON, or urlencoded)
 * Returns: JSON { success: true }
 * Errors: 400 missing fields, 401 invalid login
 */
app.post("/login", upload.none(), async (req, res) => {
  try {
    let missing = requireParams(["username", "password"], req.body);
    if (missing) {
      res.status(400).type("text").send(missing);
    }

    let db = await getDBConnection();
    let query = `
      SELECT * FROM users
      WHERE username = ? AND password = ?
    `;
    let user = await db.get(query, [req.body.username, req.body.password]);

    if (!user) {
      res.status(401).type("text").send("Invalid username or password.");
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).type("text").send("Server error logging in.");
  }
});

/**
 * GET /items
 * Returns all items in the database.
 */
app.get("/items", async (req, res) => {
  try {
    let db = await getDBConnection();
    let items = await db.all("SELECT * FROM items;");

    res.json(items);
  } catch (err) {
    res.status(500).type("text").send("Error retrieving items.");
  }
});

/**
 * GET /item/:id
 * Returns details for a single item.
 */
app.get("/item/:id", async (req, res) => {
  try {
    let db = await getDBConnection();

    let item = await db.get("SELECT * FROM items WHERE id = ?;", [req.params.id]);
    if (!item) {
      res.status(404).type("text").send("Item not found.");
    }

    res.json(item);
  } catch (err) {
    res.status(500).type("text").send("Error retrieving item details.");
  }
});

/**
 * GET /search
 * Query params: q (string), filter (optional)
 * Example: /search?q=textbook&filter=electronics
 */
app.get("/search", async (req, res) => {
  try {
    let q = req.query.q ? `%${req.query.q}%` : "%";
    let filter = req.query.filter;

    let db = await getDBConnection();
    let query = `
      SELECT * FROM items
      WHERE name LIKE ? OR description LIKE ?
    `;

    let params = [q, q];

    if (filter) {
      query += " AND category = ?";
      params.push(filter);
    }

    let results = await db.all(query, params);
    res.json(results);

  } catch (err) {
    res.status(500).type("text").send("Search failed.");
  }
});

/**
 * POST /buy
 * Body: username, item_id
 * Returns: JSON { success: true, confirmation: "ABC1234" }
 */
app.post("/buy", upload.none(), async (req, res) => {
  try {
    let missing = requireParams(["username", "item_id"], req.body);
    if (missing) {
      res.status(400).type("text").send(missing);
    }

    let db = await getDBConnection();

    // Check if item exists and has stock
    let item = await db.get("SELECT * FROM items WHERE id = ?", [req.body.item_id]);
    if (!item) {
      res.status(404).type("text").send("Item does not exist.");
    }
    if (item.stock <= 0) {
      res.status(400).type("text").send("Item out of stock.");
    }

    // Update stock
    await db.run("UPDATE items SET stock = stock - 1 WHERE id = ?", [req.body.item_id]);

    // Store transaction
    let code = generateCode();
    await db.run(`
      INSERT INTO transactions (username, item_id, confirmation)
      VALUES (?, ?, ?)
    `, [req.body.username, req.body.item_id, code]);

    res.json({ success: true, confirmation: code });

  } catch (err) {
    res.status(500).type("text").send("Transaction failed.");
  }
});

/**
 * GET /history/:username
 * Returns transaction history for a user
 */
app.get("/history/:username", async (req, res) => {
  try {
    let db = await getDBConnection();

    let query = `
      SELECT t.confirmation, i.name, i.price, t.time
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE t.username = ?
      ORDER BY t.time DESC;
    `;

    let rows = await db.all(query, [req.params.username]);
    res.json(rows);

  } catch (err) {
    res.status(500).type("text").send("Could not retrieve history.");
  }
});

/* SERVER and PORT */
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
