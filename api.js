/*
 * api.js (frontend-only minimal)
 * Small fetch helpers used by the frontend. Keep this file minimal — it
 * centralizes basic response checking and a convenience JSON GET helper.
 *
 * This file attaches a tiny API surface to `window.api` so other scripts
 * can call `window.api.getJSON(url)` and `window.api.statusCheck(response)`.
 */

"use strict";

const express = require("express");
const app = express();
// const multer = require("multer");
// const fs = require("fs").promises;

// app.use(express.urlencoded({extended: true})); // built-in middleware
// app.use(express.json());
// app.use(multer().none());

/**
 * Handles server-side errors and responds with a text message.
 * @param {Error} error - the caught server error
 * @param {Response} res - response used to send the error text
 */
function errorHandling(error, res) {
  if (error.code === "ENOENT") {
    res.status(SERVER_SIDE_ERROR).type("text")
      .send("Server error: file does not exist.");
  } else {
    // console.log(error);
    res.status(SERVER_SIDE_ERROR).type("text")
      .send("Server error: something went wrong.");
  }
}

app.use(express.static("public"));
const DEFAULT_PORT = 8000;
const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT);
