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

app.use(express.static("public"));
const DEFAULT_PORT = 8000;
const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT);
