/**
 * Name: Rena Yin & Harry Cheng
 * Date: Nov 2025
 * Section: CSE 154 AA
 * TA: Oscar Song
 *
 * This is the backend API for the Husky Help Husky second-hand trading site.
 * It handles login authentication, retrieving items, searching/filtering,
 * fetching item details, creating transactions, ratings, and user profiles,
 * as well as viewing transaction history.
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

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const CLIENT_SIDE_ERROR = 400;
const CLIENT_INVALID_PARAM = 401;
const SERVER_SIDE_ERROR = 500;
const TS = 36;
const TEN = 10;
const FIVE = 5;
const PORTNUM = 8000;

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: TS * TEN * TEN * TEN * TEN * TEN,
  sameSite: "strict",
  path: "/"
};

const SERVER_ERROR_MESSAGE = "Server error, try again later.";

// Simple session mapping: sessionId to userId
let sessions = {};

/* ROUTES */
/**
 * Logs a user in and starts a session.
 */
app.post("/login", async (req, res) => {
  try {
    let missing = requireParams(["username", "password"], req.body);
    if (missing) {
      return res.status(CLIENT_SIDE_ERROR).type("text")
        .send(missing);
    }

    let username = req.body.username;
    let password = req.body.password;

    let user = await dbUserCheck(username, password);
    if (!user) {
      return res.status(CLIENT_SIDE_ERROR).type("text")
        .send("Incorrect username or password.");
    }

    let sessionData = buildSession(user.id, user.username);
    res.cookie("session", sessionData.sessionId, SESSION_COOKIE_OPTIONS);
    res.json(sessionData.user);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR).type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Creates a new user account and starts a session.
 */
app.post("/signup", async (req, res) => {
  try {
    let validationResult = await validateSignupBody(req.body);

    if (typeof validationResult === "string") {
      return res.status(CLIENT_SIDE_ERROR).type("text")
        .send(validationResult);
    }

    let {username, password, email} = validationResult;
    let newUserId = await dbUserCreate(username, password, email);

    let sessionData = buildSession(newUserId, username);
    res.cookie("session", sessionData.sessionId, SESSION_COOKIE_OPTIONS);
    res.json(sessionData.user);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Logs the current user out.
 */
app.post("/logout", (req, res) => {
  let sessionId = req.cookies.session;

  if (sessionId) {
    delete sessions[sessionId];
  }

  res.clearCookie("session");
  res.type("text")
    .send("Logout successful.");
});

/**
 * Returns one item by id or all items when no id is given.
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
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Returns items filtered by keyword and/or category.
 */
app.get("/items/search", async (req, res) => {
  try {
    let keyword = req.query.search;
    let filter = req.query.filter;
    if (!keyword && !filter) {
      res.status(CLIENT_SIDE_ERROR).type("text")
        .type("text")
        .send("Missing query parameter: 'search' 'filter'");
    } else {
      let searchResult = await dbItemSearch(keyword, filter);
      res.json(searchResult);
    }
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Purchases a single item for the logged-in user.
 */
app.post("/buy", requireLogin, async (req, res) => {
  try {
    res.type("text");

    let validationResult = await validateSinglePurchaseBody(req.body);
    if (typeof validationResult === "string") {
      return res.status(CLIENT_SIDE_ERROR)
        .send(validationResult);
    }

    let item = validationResult;
    let code = await processSinglePurchase(req.userId, item);
    res.send(code);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Purchases multiple items in one bulk transaction for the logged-in user.
 */
app.post("/bulk-buy", requireLogin, async (req, res) => {
  try {
    res.type("text");

    let validationResult = await validateBulkBuyBody(req.body);
    if (typeof validationResult === "string") {
      return res.status(CLIENT_SIDE_ERROR)
        .send(validationResult);
    }

    let items = validationResult;
    let code = await generateUniqueCode();
    await multipleTransactionMade(items, req.userId, code);
    res.send(code);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR)
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Returns the purchase history for the logged-in user.
 * ordered from most recent to oldest.
 */
app.get("/history", requireLogin, async (req, res) => {
  try {
    let transactions = await dbTransactionUserGet(req.userId);
    res.json(transactions);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR).type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Submits a rating for an item.
 * The userId is taken from the logged-in session, not from the client.
 */
app.post("/ratings", requireLogin, async (req, res) => {
  try {
    let payload = {
      itemId: req.body.item_id || req.body.itemId,
      stars: req.body.stars,
      comment: req.body.comment || null,
      userId: req.userId
    };

    let result = await processRatingSubmission(payload);
    res.json(result);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR).type("text")
      .send(SERVER_ERROR_MESSAGE);
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
      res.status(CLIENT_SIDE_ERROR).type("text")
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
    res.status(SERVER_SIDE_ERROR).type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Returns the profile information for a user.
 * If a profile does not exist yet, an empty one is created.
 */
app.get("/users/:id/profile", async (req, res) => {
  try {
    let user = await dbUserGet(req.params.id);
    if (!user) {
      res.status(CLIENT_SIDE_ERROR).type("text")
        .send("No such user.");
      return;
    }

    // Ensure there is at least a default profile row.
    await dbUserProfileEnsure(user.id, user.username);
    let profile = await dbUserProfileGet(user.id);
    res.json(profile);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR).type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Creates or updates the profile information for a user.
 */
app.post("/users/:id/profile", async (req, res) => {
  try {
    let user = await dbUserGet(req.params.id);
    if (!user) {
      res.status(CLIENT_SIDE_ERROR).type("text")
        .send("No such user.");
      return;
    }

    let profileData = {
      displayName: req.body.displayName || req.body.display_name || null,
      address: req.body.address || null,
      quote: req.body.quote || null
    };

    let saved = await dbUserProfileUpsert(user.id, profileData);
    res.json(saved);
  } catch (err) {
    res.status(SERVER_SIDE_ERROR).type("text")
      .send(SERVER_ERROR_MESSAGE);
  }
});

/**
 * Validates and parses the request body for a bulk purchase.
 * Returns either the parsed items array or a string describing
 * the client-side error.
 * @param {Object} body - Request body
 * @returns {Promise<Array|string>} items - items info the user want
 */
async function validateBulkBuyBody(body) {
  let missing = requireParams(["items"], body);
  if (missing) {
    return missing;
  }

  let items = body.items;

  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch (err) {
      return "Items must be in JSON form.";
    }
  }

  let itemError = await checkItems(items);
  if (itemError) {
    return itemError;
  }

  return items;
}

/**
 * Validates the body for a single-item purchase and loads the item.
 * Returns either the item row or a string describing the client-side error.
 * @param {Object} body - Request body
 * @returns {Promise<Object|string>} item - item info
 */
async function validateSinglePurchaseBody(body) {
  let missing = requireParams(["item_id"], body);
  if (missing) {
    return missing;
  }

  let item = await dbItemGet(body.item_id);
  if (!item) {
    return "Item does not exist.";
  } else if (item.stock <= 0) {
    return "Item out of stock.";
  }

  return item;
}

/**
 * Generates a unique confirmation code that does not yet exist
 * in the transactions table.
 * @returns {Promise<string>} code - confirmation code
 */
async function generateUniqueCode() {
  let code = generateCode();
  while (await dbCheckCodeDuplicate(code)) {
    code = generateCode();
  }
  return code;
}

/**
 * Processes a single-item purchase transaction.
 * Assumes the item has already been validated (exists and has stock).
 * @param {number} userId - Buyer user id
 * @param {Object} item - Item row from the database
 * @returns {Promise<string>} code - The generated confirmation code
 */
async function processSinglePurchase(userId, item) {
  await dbItemStockSubtract(item.id);
  let code = await generateUniqueCode();
  await dbTransactionMade(userId, item.seller_id, item.id, code);
  return code;
}

/**
 * Validates and normalizes signup data.
 * Returns either a trimmed {username, password, email} object
 * or a string describing the client-side error.
 * @param {Object} body - Request body
 * @returns {Promise<Object|string>} validate data
 */
async function validateSignupBody(body) {
  let missing = requireParams(["username", "password", "email"], body);
  if (missing) {
    return missing;
  }

  let username = body.username.trim();
  let password = body.password.trim();
  let email = body.email.trim();

  // Check if username already exists
  let user = await dbUserGetByUsername(username);
  if (user) {
    return "Username already taken.";
  }

  // Check if email ends with uw.edu
  if (!email.endsWith("@uw.edu")) {
    return "Please use your uw email to sign up.";
  }

  return {username, password, email};
}

/**
 * Inserts a new rating row into the DB (no validation here).
 * @param {Object} db - Database connection.
 * @param {number} itemId - Item ID for rating.
 * @param {number} userId - User ID for rating.
 * @param {number} stars - Star rating value.
 * @param {string} comment - Optional comment text.
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
 * @return {Object} Object with average, count, and ratings array.
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
 * @return {Object|null} Matching user row if credentials are valid, otherwise null.
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
 * Creates a new user row in the users table.
 * @param {string} username - Username for the new user.
 * @param {string} password - Password for the new user.
 * @param {string} email - Email address for the new user.
 * @return {number} The id of the newly created user.
 */
async function dbUserCreate(username, password, email) {
  let db = await getDBConnection();
  let query = "INSERT INTO users (username, password, email) VALUES (?, ?, ?);";
  let result = await db.run(query, [username, password, email]);
  await db.close();

  let userId = result.lastID;
  return userId;
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
 * @return {Object|null} Item row for the given id, or null if no such item exists.
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
    query += "WHERE (title LIKE ? OR description LIKE ?) AND category = ?";
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
 * Checks if a confirmation code already exists in the transactions table.
 * @param {string} code - Confirmation code to check.
 * @return {boolean} True if code exists, false otherwise.
 */
async function dbCheckCodeDuplicate(code) {
  let db = await getDBConnection();
  let query = "SELECT * FROM transactions WHERE confirmation_code = ?";
  let transaction = await db.get(query, [code]);
  await db.close();
  if (transaction) {
    return true;
  }
  return false;
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
 * @return {Object|null} User row for the given id, or null if no such user exists.
 */
async function dbUserGet(id) {
  let query = "SELECT * FROM users WHERE id = ?;";
  let db = await getDBConnection();
  let user = await db.get(query, [id]);
  await db.close();
  return user;
}

/**
 * Retrieves the profile for the given user id, or null if none exists.
 * @param {number} id - user id.
 * @return {Object|null} profile row.
 */
async function dbUserProfileGet(id) {
  let db = await getDBConnection();
  let profile = await db.get(
    "SELECT user_id, display_name, address, quote " +
    "FROM user_profiles WHERE user_id = ?;",
    [id]
  );
  await db.close();
  return profile;
}

/**
 * Ensures there is at least a default profile row for the given user.
 * Uses the username as an initial display name if no profile exists yet.
 * @param {number} id - user id.
 * @param {string} username - username to use as default display name.
 */
async function dbUserProfileEnsure(id, username) {
  let db = await getDBConnection();
  await db.run(
    "INSERT OR IGNORE INTO user_profiles (user_id, display_name) VALUES (?, ?);",
    [id, username]
  );
  await db.close();
}

/**
 * Inserts or updates the profile row for a user.
 * @param {number} id - user id.
 * @param {Object} profileData - display_name, address, quote.
 * @return {Object} the saved profile row.
 */
async function dbUserProfileUpsert(id, profileData) {
  let db = await getDBConnection();
  await db.run(
    "INSERT OR REPLACE INTO user_profiles " +
    "(user_id, display_name, address, quote) " +
    "VALUES (?, ?, ?, ?);",
    [
      id,
      profileData.displayName,
      profileData.address,
      profileData.quote
    ]
  );
  let profile = await db.get(
    "SELECT user_id, display_name, address, quote " +
    "FROM user_profiles WHERE user_id = ?;",
    [id]
  );
  await db.close();
  return profile;
}

/**
 * Retrieves all transactions where the given user id is the buyer.
 * Joined with item information and ordered by most recent first.
 * @param {number} id - The id of the user whose transactions are requested.
 * @return {Object[]} Array of joined transaction and item rows for the user.
 */
async function dbTransactionUserGet(id) {
  let db = await getDBConnection();
  let query = "SELECT * FROM transactions t" +
    " JOIN items i ON t.item_id = i.id" +
    " WHERE t.buyer_id = ? " +
    " ORDER BY t.date DESC;";
  let transactions = await db.all(query, [id]);
  await db.close();
  return transactions;
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
 * Creates a new session id for a user and prepares auth payload data.
 * @param {number} userId - User id to store in the session.
 * @param {string} username - Username to include in the auth payload.
 * @returns {Object} Object containing sessionId and auth user object.
 */
function buildSession(userId, username) {
  let sessionId = createSessionId();
  sessions[sessionId] = userId;

  return {
    sessionId: sessionId,
    user: {
      id: userId,
      username: username
    }
  };
}

/**
 * Generates a new session id string for a logged-in user.
 * @return {string} A unique session id to be stored in the cookie and sessions map.
 */
function createSessionId() {
  let sessionId = Math.random().toString(TS)
    .slice(2) + Date.now();

  return sessionId;
}

/**
 * Middleware that restricts access to logged-in users and exposes the user id on req.userId.
 * @param {Object} req - Express request object containing cookies.
 * @param {Object} res - Express response object for sending an error if not logged in.
 * @param {Function} next - Callback to continue to the route handler.
 * @returns {void} Does not return a value, meanifully bread the route.
 */
function requireLogin(req, res, next) {
  let sessionId = req.cookies.session;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(CLIENT_INVALID_PARAM)
      .send("Not logged in.");
  }

  req.userId = sessions[sessionId];
  next();
}

/**
 * Generates a random confirmation code.
 * @return {string} A random code string.
 */
function generateCode() {
  return Math.random()
    .toString(TS)
    .substring(2, TEN)
    .toUpperCase();
}

/**
 * Checks that all items in a bulk purchase exist and have enough stock.
 * Returns an error message string if validation fails, otherwise null.
 * @param {Object[]} items - List of items to purchase, each with id and quantity.
 * @return {?string} Error message if validation fails, or null if all items are valid.
 */
async function checkItems(items) {
  for (let item of items) {
    let id = item.id;
    let quantity = item.quantity;
    let dbItem = await dbItemGet(id);
    if (!dbItem) {
      return "Item does not exist.";
    }
    if (dbItem.stock < quantity) {
      return "Not enough stock for purchase.";
    }
  }
  return null;
}

/**
 * Processes a bulk purchase by updating stock and recording a transaction
 * for each requested item and quantity under a shared confirmation code.
 * @param {Object[]} items - List of items to purchase, each with id and quantity.
 * @param {number} user - Id of the buyer making the purchase.
 * @param {string} code - Confirmation code associated with this bulk purchase.
 */
async function multipleTransactionMade(items, user, code) {
  for (let item of items) {
    let id = item.id;
    let quantity = item.quantity;
    let dbItem = await dbItemGet(id);
    for (let i = 0; i < quantity; i++) {
      await dbItemStockSubtract(id);
      await dbTransactionMade(user, dbItem["seller_id"], id, code);
    }
  }
}

/**
 * Validates that "stars" is an int between 1 and 5.
 * Returns true if valid, false otherwise.
 * @param {number} stars - Star rating to validate.
 * @return {boolean} True if valid, false otherwise.
 */
function isValidStars(stars) {
  return Number.isInteger(stars) && stars >= 1 && stars <= FIVE;
}

/**
 * Ensures both item and user exist, throws an error if not.
 * @param {Object} db - Database connection.
 * @param {number} itemId - Item ID to check.
 * @param {number} userId - User ID to check.
 * @return {Object} Object with item and user properties.
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
 * Helper to process a rating submission: validates input and inserts it into the DB.
 * @param {Object} reqBody - Request body with userId, itemId, stars, and optional comment.
 * @return {Object} Success message object after the rating is stored.
 */
async function processRatingSubmission(reqBody) {
  let missing = requireParams(["userId", "itemId", "stars"], reqBody);
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
    reqBody.itemId,
    reqBody.userId
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

/* DB CONNECTION */
/**
 *
 * Establishes a database connection to the database and returns the database object.
 * Any errors that occur should be caught in the function that calls this one.
 * @return {sqlite3.Database} - The database object for the connection.
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