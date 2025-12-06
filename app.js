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

// I think we can use this, this is in Rasmus slide deck for storage technique
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const CLIENT_SIDE_ERROR = 400;
const CLIENT_INVALID_PARAM = 401;
const FORBID = 403;
const SERVER_SIDE_ERROR = 500;
const PORTNUM = 8000;
const FIVE = 5;
const TS = 36;
const TEN = 10;

// Simple session mapping: sessionId to userId
let sessions = {};

/* ROUTES */
/**
 * Logs in a user with the given username and password.
 */
app.post("/login", async (req, res) => {
  try {
    res.type("json");
    let missing = requireParams(["username", "password"], req.body);
    if (missing) {
      return res.status(CLIENT_SIDE_ERROR)
        .send(missing);
    }

    let username = req.body.username.trim();
    let password = req.body.password.trim();

    let user = await dbUserCheck(username, password);
    if (!user) {
      return res.status(CLIENT_INVALID_PARAM)
        .send("Invalid username or password.");
    }

    // Create random session ID, save session
    createSessionId(user, res);
  } catch (err) {
    console.error(err);
    res.status(SERVER_SIDE_ERROR)
      .send("Server error.");
  }
});

/**
 * Creates a new user account (sign up) and logs them in.
 * Expects JSON: { username, password, email }
 */
app.post("/signup", async (req, res) => {
  try {
    res.type("json");

    let missing = requireParams(["username", "password", "email"], req.body);
    if (missing) {
      return res.status(CLIENT_SIDE_ERROR)
        .send(missing);
    }

    let username = req.body.username.trim();
    let password = req.body.password.trim();
    let email = req.body.email.trim();

    if (!username || !password || !email) {
      return res.status(CLIENT_SIDE_ERROR)
        .send("Username, password, and email must be non-empty.");
    }

    let existing = await dbUserGetByUsername(username);
    errorCheck(existing, res, email);

    // Create the user and set the session id
    let user = await dbUserCreate(username, password, email);
    createSessionId(user, res);
  } catch (err) {
    console.error(err);
    res.status(SERVER_SIDE_ERROR)
      .send("Could not create user.");
  }
});

/**
 * Returns all items, or a single item when given an id query parameter.
 */
app.get("/items", async (req, res) => {
  try {
    let id = req.query.id;
    if (id) {
      res.json(await dbItemGet(id));
    } else {
      res.json(await dbItemGetAll());
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Error retrieving items.");
  }
});

/**
 * Searches items by keyword and optional category filter.
 */
app.get("/items/search", async (req, res) => {
  try {
    let keyword = req.query.search;
    let filter = req.query.filter;
    if (!keyword && !filter) {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send("Missing query parameter: 'keyword' 'filter'");
    } else {
      let searchResult = await dbItemSearch(keyword, filter);
      res.json(searchResult);
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Search failed.");
  }
});

/**
 * Processes a purchase by decrementing stock and creating a transaction.
 * Buyer is the currently logged-in user (from session cookie).
 */
app.post("/buy", requireLogin, async (req, res) => {
  try {
    res.type("text");

    // Client only needs to send the item_id, bc already logging in
    let missing = requireParams(["item_id"], req.body);
    if (missing) {
      return res.status(CLIENT_SIDE_ERROR).send(missing);
    }

    let item = await dbItemGet(req.body.item_id);
    if (!item) {
      return res.status(CLIENT_SIDE_ERROR).send("Item does not exist.");
    } else if (item.stock <= 0) {
      return res.status(CLIENT_SIDE_ERROR).send("Item out of stock.");
    }

    await dbItemStockSubtract(item.id);

    let code = generateCode();
    while (await dbCheckCodeDuplicate(code)) {
      code = generateCode();
    }

    await dbTransactionMade(req.userId, item.seller_id, item.id, code);
    res.send(code);
  } catch (err) {
    console.error(err);
    res.status(SERVER_SIDE_ERROR).send("Transaction failed.");
  }
});

/**
 * Returns all transactions where the given user is buyer or seller.
 * Only allows a user to view *their own* history.
 */
app.get("/history/:id", requireLogin, async (req, res) => {

  // :id must match the logged-in user id
  if (Number(req.params.id) !== req.userId) {
    return res.status(FORBID)
      .send("Forbidden");
  }

  try {
    let user = await dbUserGet(req.params.id);

    if (user) {
      let transactions = await dbTransactionUserGet(user.id);
      res.json(transactions);
    } else {
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send("No such user.");
    }
  } catch (err) {
    console.error(err);
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Could not retrieve history.");
  }
});

/**
 * Submits a rating for an item.
 * The userId is taken from the logged-in session, not from the client.
 */
app.post("/ratings", requireLogin, async (req, res) => {
  try {
    res.type("text");

    // Inject logged-in user id into the payload
    let payload = {
      ...req.body,
      userId: req.userId
    };

    let result = await processRatingSubmission(payload);
    res.json(result);
  } catch (err) {
    // console.error(err);
    res.status(CLIENT_SIDE_ERROR)
      .type("text")
      .send(err.message || "Error submitting rating.");
  }
});

/**
 * Returns: average rating, count, and rating list for an item.
 */
app.get("/items/:id/ratings", async (req, res) => {
  try {
    let itemId = req.params.id;
    let db = await getDBConnection();

    let item = await db.get("SELECT id FROM items WHERE id = ?;", [itemId]);
    if (!item) {
      await db.close();
      res.status(CLIENT_SIDE_ERROR)
        .type("text")
        .send("Item does not exist.");
      return;
    }

    let summary = await getRatingsForItem(db, itemId);
    await db.close();

    res.json({
      itemId: itemId,
      average: summary.average,
      count: summary.count,
      ratings: summary.ratings
    });
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send("Error retrieving ratings.");
  }
});

/**
 * Logging out for current user, clear the cookie
 */
app.post("/logout", (req, res) => {
  let sessionId = req.cookies.session;

  if (sessionId) {
    delete sessions[sessionId];
  }

  res.clearCookie("session");
  res.json({success: true});
});

function requireLogin(req, res, next) {
  let sessionId = req.cookies.session;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).send("Not logged in.");
  }

  req.userId = sessions[sessionId];
  next();
}

/**
 * Helper to process rating submission: validates and inserts into DB.
 * @param {Object} reqBody - Request body with user_id, item_id, stars, comment.
 * @returns {Promise<Object>} Resolves with success message.
 */
async function processRatingSubmission(reqBody) {
  let missing = requireParams(["user_id", "item_id", "stars"], reqBody);
  if (missing) {
    throw new Error(missing);
  }

  let stars = Number(reqBody.stars);
  if (!isValidStars(stars)) {
    throw new Error("Stars must be an integer between 1 and 5.");
  }

  let db = await getDBConnection();
  let itemAndUser = await getExistingItemAndUser(
    db,
    reqBody.item_id,
    reqBody.user_id
  );
  await insertRatingRow(
    db,
    itemAndUser.item.id,
    itemAndUser.user.id,
    stars,
    reqBody.comment
  );
  await db.close();

  return {message: "Rating submitted successfully."};
/* HELPERS */
/**
 * Check login status, make sure the user name has not been taken
 * and email suffix end up with @uw.edu
 * @param {string} existing - the username of the user, should be existed in our db.
 * @param {object} res - the response that we will send back.
 * @param {string} email - the uw email provided by user
 * @returns {status} error status with message description
 */
function errorCheck(existing, res, email) {

  // Check if username already exists
  if (existing) {
    return res.status(CLIENT_SIDE_ERROR)
      .send("Username already taken.");
  }

  // check if email end with uw.edu
  if (!email.endsWith("@uw.edu")) {
    return res.status(CLIENT_SIDE_ERROR)
      .send("Please use your uw mail to sign up.");
  }
}

/**
 * Create a session id for user.
 * @param {number} user - the id of the user.
 * @param {object} res - the response that we will send back.
 */
function createSessionId(user, res) {
  let sessionId = Math.random().toString(TS)
    .slice(2) + Date.now();
  sessions[sessionId] = user.id;

  res.cookie("session", sessionId, {
    httpOnly: true,
    maxAge: TS * TEN * TEN * TEN * TEN * TEN,
    sameSite: "strict",
    path: "/"
  });

  res.json({
    success: true,
    id: user.id,
    username: user.username
  });
}

/**
 * Validates that "stars" is an int between 1 and 5.
 * Returns true if valid, false otherwise.
 * @param {number} stars - Star rating to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidStars(stars) {
  return Number.isInteger(stars) && stars >= 1 && stars <= FIVE;
}

/**
 * Ensures both item and user exist, throws an error if not.
 * @param {Object} db - Database connection.
 * @param {number} itemId - Item ID to check.
 * @param {number} userId - User ID to check.
 * @returns {Object} Object with item and user properties.
 */
async function getExistingItemAndUser(db, itemId, userId) {
  let item = await db.get("SELECT id FROM items WHERE id = ?;", [itemId]);
  if (!item) {
    throw new Error("Item does not exist.");
  }

  let user = await db.get("SELECT id FROM users WHERE id = ?;", [userId]);
  if (!user) {
    throw new Error("User does not exist.");
  }

  return {item, user};
}

/**
 * Inserts a new rating row into the DB (no validation here).
 * @param {Object} db - Database connection.
 * @param {number} itemId - Item ID for rating.
 * @param {number} userId - User ID for rating.
 * @param {number} stars - Star rating value.
 * @param {string} comment - Optional comment text.
 * @returns {void}
 */
async function insertRatingRow(db, itemId, userId, stars, comment) {
  let finalComment = comment || null;
  await db.run(
    "INSERT INTO ratings (item_id, user_id, stars, comment) VALUES (?, ?, ?, ?);",
    [itemId, userId, stars, finalComment]
  );
}

/**
 * Gets rating summary + list for an item.
 * @param {Object} db - Database connection.
 * @param {number} itemId - Item ID to get ratings for.
 * @returns {Object} Object with average, count, and ratings array.
 */
async function getRatingsForItem(db, itemId) {
  let summary = await db.get(
    "SELECT AVG(stars) AS average, COUNT(*) AS count FROM ratings WHERE item_id = ?;",
    [itemId]
  );
  let ratings = await db.all(
    "SELECT stars, comment, date, user_id FROM ratings WHERE item_id = ? ORDER BY date DESC;",
    [itemId]
  );
  return {
    average: summary.average || null,
    count: summary.count || 0,
    ratings: ratings
  };
}

/**
 * Checks whether a user exists with the given username and password.
 * @param {string} username - Username to look up in the users table.
 * @param {string} password - Password to match for the given username.
 * @return {Object} matching user row when the username and password are valid.
 */
async function dbUserCheck(username, password) {
  let query = "SELECT * FROM users WHERE username = ? AND password = ?;";
  let db = await getDBConnection();
  let user = await db.get(query, [username, password]);
  await db.close();
  return user;
}

/**
 * Retrieves a user row by username.
 * @param {string} username - Username to look up.
 * @return {Object|null} user row if found, otherwise null.
 */
async function dbUserGetByUsername(username) {
  let query = "SELECT * FROM users WHERE username = ?;";
  let db = await getDBConnection();
  let user = await db.get(query, [username]);
  await db.close();
  return user;
}

/**
 * Creates a new user account in the users table.
 * @param {string} username - Unique username.
 * @param {string} password - Plain-text password (ok for course project).
 * @param {string} email - Email address.
 * @return {Object} new user row with id, username, email.
 */
async function dbUserCreate(username, password, email) {
  let db = await getDBConnection();
  let query = "INSERT INTO users (username, password, email) VALUES (?, ?, ?);";
  await db.run(query, [username, password, email]);

  let row = await db.get("SELECT last_insert_rowid() AS id;");
  await db.close();

  return {
    id: row.id,
    username: username,
    email: email
  };
}

/**
 * Retrieves all items from the items table.
 * @return {Object[]} array of all item rows.
 */
async function dbItemGetAll() {
  let db = await getDBConnection();
  let items = await db.all("SELECT * FROM items;");
  await db.close();
  return items;
}

/**
 * Retrieves a single item by its id.
 * @param {number} id - The id of the item to retrieve.
 * @return {Object} item row for the given id.
 */
async function dbItemGet(id) {
  let query = "SELECT * FROM items WHERE id = ?;";
  let db = await getDBConnection();
  let item = await db.get(query, [id]);
  await db.close();
  return item;
}

/**
 * Searches items by a keyword and optional category filter.
 * The keyword is matched against the title and description fields.
 * @param {string} keyword - Keyword to search for in title and description.
 * @param {string} filter - Optional category name to filter results by.
 * @return {Object[]} array of items that match the search criteria.
 */
async function dbItemSearch(keyword, filter) {
  let query = "SELECT * FROM items ";
  let params = [];

  if (keyword && filter) {
    query += "WHERE title LIKE ? OR description LIKE ? AND category = ?";
    keyword = "%" + keyword + "%";
    params.push(keyword);
    params.push(keyword);
    params.push(filter);
  } else if (keyword) {
    query += "WHERE title LIKE ? OR description LIKE ?";
    keyword = "%" + keyword + "%";
    params.push(keyword);
    params.push(keyword);
  } else {
    query += "WHERE category = ?";
    params.push(filter);
  }

  let db = await getDBConnection();
  let searchResult = await db.all(query, params);
  await db.close();

  return searchResult;
}

/**
 * Decrements the stock count of an item by 1 for the given id.
 * @param {number} id - The id of the item whose stock should be reduced.
 */
async function dbItemStockSubtract(id) {
  let query = "UPDATE items SET stock = stock - 1 WHERE id = ?";
  let db = await getDBConnection();
  await db.run(query, [id]);
  await db.close();
}

/**
 * Inserts a new transaction row for the given buyer, seller, and item.
 * @param {number} buyerId - Id of the user buying the item.
 * @param {number} sellerId - Id of the user selling the item.
 * @param {number} itemId - Id of the item being purchased.
 * @param {string} code - Confirmation code for the transaction.
 */
async function dbTransactionMade(buyerId, sellerId, itemId, code) {
  let query = "INSERT INTO transactions (buyer_id, seller_id, item_id, confirmation_code) " +
    "VALUES (?, ?, ?, ?)";
  let db = await getDBConnection();
  await db.run(query, [buyerId, sellerId, itemId, code]);
  await db.close();
}

/**
 * Retrieves a user row by its id.
 * @param {number} id - The id of the user to retrieve.
 * @return {Object} user row for the given id.
 */
async function dbUserGet(id) {
  let query = "SELECT * FROM users WHERE id = ?;";
  let db = await getDBConnection();
  let user = await db.get(query, [id]);
  await db.close();
  return user;
}

/**
 * Retrieves all transactions where the given user id is either the buyer or the seller.
 * Joined with item information and ordered by most recent first.
 * @param {number} id - The id of the user whose transactions are requested.
 * @return {Object[]} array of joined transaction and item rows for the user.
 */
async function dbTransactionUserGet(id) {
  let db = await getDBConnection();
  let query = "SELECT *FROM transactions t" +
    " JOIN items i ON t.item_id = i.id" +
    " WHERE t.buyer_id = ? OR t.seller_id = ?" +
    " ORDER BY t.date DESC;";
  let transactions = await db.all(query, [id, id]);
  await db.close();
  return transactions;
}

/**
 * Checks if a confirmation code already exists in the transactions table.
 * @param {string} code - Confirmation code to check.
 * @returns {boolean} True if code exists, false otherwise.
 */
async function dbCheckCodeDuplicate(code) {
  let db = await getDBConnection();
  let query = "SELECT *FROM transactions WHERE confirmation_code = ?";
  let transaction = await db.get(query, [code]);
  await db.close();
  if (transaction) {
    return true;
  }
  return false;
}

/**
 * Checks that all required parameters exist on the given request body object.
 * @param {string[]} params - List of required parameter names.
 * @param {Object} body - Parsed request body to check for required parameters.
 * @return {string|null} error message listing missing parameters,
 * or null if all required parameters are present.
 */
function requireParams(params, body) {
  let message = "Missing parameter:";
  for (let param of params) {
    if (!body[param]) {
      message = message + " '" + param + "'";
    }
  }
  if (message === "Missing parameter:") {
    return null;
  }
  message += ".";
  return message;
}

/**
 * Generates a random confirmation code.
 * @returns {string} A random code string.
 */
function generateCode() {
  return Math.random()
    .toString(TS)
    .substring(2, TEN)
    .toUpperCase();
}

/**
 * Helper to process rating submission: validates and inserts into DB.
 * @param {Object} reqBody - Request body with user_id, item_id, stars, comment.
 * @returns {Promise<Object>} Resolves with success message.
 */
async function processRatingSubmission(reqBody) {
  let missing = requireParams(["user_id", "item_id", "stars"], reqBody);
  if (missing) {
    throw new Error(missing);
  }

  let stars = Number(reqBody.stars);
  if (!isValidStars(stars)) {
    throw new Error("Stars must be an integer between 1 and 5.");
  }

  let db = await getDBConnection();
  let itemAndUser = await getExistingItemAndUser(
    db,
    reqBody.item_id,
    reqBody.user_id
  );
  await insertRatingRow(
    db,
    itemAndUser.item.id,
    itemAndUser.user.id,
    stars,
    reqBody.comment
  );
  await db.close();

  return {message: "Rating submitted successfully."};
}

/**
 * Helpers that check the cookie for functions that required login to continue
 * @param {Object} req - Request body with user_id, item_id, stars, comment.
 * @param {Object} res - Response send back to clients when not logged in.
 * @returns {Promise<Object>} Resolves with success message.
 */
function requireLogin(req, res) {
  let sessionId = req.cookies.session;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(CLIENT_INVALID_PARAM)
      .send("Not logged in.");
  }

  req.userId = sessions[sessionId];
}

/* DB CONNECTION */
/**
 *
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @returns {sqlite3.Database} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "husky.db",
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static("public"));
const PORT = process.env.PORT || PORTNUM;
app.listen(PORT);