# Husky Help Husky

A full-stack campus marketplace web app for UW students to buy and sell second-hand items.

## Live Site

🟣 **[husky-help-husky-production.up.railway.app](https://husky-help-husky-production.up.railway.app)**

Deployed on Railway with a PostgreSQL backend.

## Overview

Husky Help Husky is a peer-to-peer campus marketplace — think cozy Craigslist for Huskies. Users can create accounts, browse listings, search by keyword or category, add items to a cart, complete purchases, review past transactions, leave ratings, and manage a personal profile.

## Features

- User login, signup, logout, and session checking
- Product browsing with search, category filtering, and list/grid layout toggle
- Item detail views with pricing, stock, and rating summaries
- Shopping cart with quantity controls and bulk checkout
- Transaction history with sorting and post-purchase item ratings
- Editable user profile and light/dark theme toggle

## Branches

| Branch | Database | Purpose |
|---|---|---|
| `main` | PostgreSQL | Production — deployed on Railway |
| `sqlite-local` | SQLite | Local development — no setup required |

To run locally with zero configuration, use the `sqlite-local` branch:

```bash
git checkout sqlite-local
npm install
node app.js
```

## Built With

- HTML / CSS / JavaScript
- Node.js + Express
- PostgreSQL (production) / SQLite (local)
- Multer
- cookie-parser

## Environment Variables (production)

Required on Railway for the `main` branch:

```
DATABASE_URL=your_postgres_connection_string
```

## Authors

Rena Yin and Harry Cheng
