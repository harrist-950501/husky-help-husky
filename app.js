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
const app = express();

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const multer = require("multer");

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

const CLIENT_SIDE_ERROR = 400;
const SERVER_SIDE_ERROR = 500;
const base36 = 36;
const portion = 10;

/* ROUTES */
/**
 * POST /login
 * Body: username, password (FormData, JSON, or urlencoded)
 * Returns: Plain text
 * Errors: 400 missing fields, invalid login
 */
app.post("/login", async (req, res) => {
  try {
    let missing = requireParams(["username", "password"], req.body);
    if (missing) {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send(missing);
    } else {
      let db = await getDBConnection();
      let query = "SELECT * FROM users WHERE username = ? AND password = ?;";
      let user = await db.get(query, [req.body.username, req.body.password]);
      await db.close();

      if (!user) {
        res.status(CLIENT_SIDE_ERROR)
          .type("text")
          .send("Invalid username or password.");
      }
      res.type("text")
        .send("User login sucessfully");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Server error logging in.");
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
    await db.close();

    res.json(items);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Error retrieving items.");
  }
});

/**
 * GET /item/:id
 * Returns details for a single item.
 */
app.get("/items/:id", async (req, res) => {
  try {
    let db = await getDBConnection();
    let item = await db.get("SELECT * FROM items WHERE id = ?;", [req.params.id]);
    await db.close();

    if (!item) {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send("Item not found.");
    }

    res.json(item);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Error retrieving item details.");
  }
});

/**
 * GET /search
 * Query params: search (string), filter (optional)
 * Example: /search?quer=textbook&filter=electronics
 */
app.get("/search", async (req, res) => {
  try {
    let keyword = req.query.search;
    let filter = req.query.filter;
    if (keyword) {
      let query = "SELECT * FROM items WHERE title LIKE ? OR description LIKE ?";
      keyword = "%" + keyword + "%";
      let params = [keyword, keyword];

      if (filter) {
        query += " AND category = ?";
        params.push(filter);
      }

      let db = await getDBConnection();
      let searchResult = await db.all(query, params);
      await db.close();

      res.json(searchResult);
    } else {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send("Missing query parameter: \'keyword\'");
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Search failed.");
  }
});

/**
 * POST /buy
 * Body: buyer_id, item_id
 * Returns: Plain text
 */
app.post("/buy", async (req, res) => {
  try {
    let missing = requireParams(["buyer_id", "item_id"], req.body);
    if (missing) {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send(missing);
    } else {
      let db = await getDBConnection();
      let item = await db.get("SELECT * FROM items WHERE id = ?", [req.body.item_id]);
      await db.close();
      if (!item) {
        res.status(CLIENT_SIDE_ERROR)
          .type("text")
          .send("Item does not exist.");
      } else {
        if (item.stock <= 0) {
          res.status(CLIENT_SIDE_ERROR)
            .type("text")
            .send("Item out of stock.");
        } else {
          db = await getDBConnection();
          await db.run("UPDATE items SET stock = stock - 1 WHERE id = ?", [req.body.item_id]);
          await db.run("INSERT INTO transactions (buyer_id, seller_id, item_id)" +
            "VALUES (?, ?, ?)", [req.body.buyer_id, item.seller_id, item.id]);
          await db.close();

          res.json("Item purchased successfully");
        }
      }
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Transaction failed.");
  }
});

/**
 * GET /history/:user_id
 * Returns transaction history for a user
 */
app.get("/history/:user_id", async (req, res) => {
  try {
    let db = await getDBConnection();
    let query = "SELECT * FROM users WHERE id = ?;";
    let user = await db.get(query, [req.params.user_id]);
    console.log(user);
    await db.close();

    if (user) {
      let db = await getDBConnection();
      let query = "SELECT *FROM transactions t" +
        " JOIN items i ON t.item_id = i.id" +
        " WHERE t.buyer_id = ? OR t.seller_id = ?" +
        " ORDER BY t.date DESC;";
      let transactions = await db.all(query, [user.id, user.id]);
      await db.close();
      res.json(transactions);
    } else {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send("No such user.");
    }
  } catch (err) {
    console.log(err);
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Could not retrieve history.");
  }
});

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
  let message = "Missing parameter:";
  for (let param of params) {
    if (!body[param]) {
      message = message + " \'" + param + "\'";
    }
  }
  if (message === "Missing parameter:") {
    return null;
  }
  message += ".";
  return message;
}

app.use(express.static("public"));
const PORT = process.env.PORT || 8000;
app.listen(PORT);