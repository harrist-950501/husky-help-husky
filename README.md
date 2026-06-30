# Husky Help Husky

A full-stack campus marketplace web app for UW students to buy and sell second-hand items.

> **You're on the `sqlite-local` branch** — this version uses SQLite and runs locally with zero setup.
> For the production PostgreSQL version, see the `main` branch.

## Overview

Husky Help Husky is a peer-to-peer campus marketplace — think cozy Craigslist for Huskies. Users can create accounts, browse listings, search by keyword or category, add items to a cart, complete purchases, review past transactions, leave ratings, and update a basic user profile. The project combines a multi-page frontend with a Node/Express API and a SQLite database for persistent marketplace data.

## Running Locally

```bash
npm install
node app.js
```

No environment variables or database setup required — SQLite runs out of the box.

## Features

- User login, signup, logout, and session checking
- Product browsing with search, category filtering, and list/grid layout toggle
- Item detail views with pricing, stock, and rating summaries
- Shopping cart with quantity controls and bulk checkout
- Transaction history with sorting and post-purchase item ratings
- Editable user profile and light/dark theme toggle

## Built With

- HTML / CSS / JavaScript
- Node.js + Express
- SQLite
- Multer
- cookie-parser

## Live Site

The production version of this app is deployed on Railway using PostgreSQL. See the `main` branch for details.

## Authors

Rena Yin and Harry Cheng
