# Husky Help Husky — Campus Marketplace Web App

A full-stack campus marketplace web app for UW students to buy and sell second-hand items.

## Live Site

🟣 **[husky-help-husky-production.up.railway.app](https://husky-help-husky-production.up.railway.app)**

Current public version: deployed on Railway with a PostgreSQL backend and recent UX updates for search, filtering, and layout controls.

## Demo Access

Reviewers can use the demo account below to explore the app. New signups require a UW email address ending in `@uw.edu`.

```text
Username: guest
Password: 20260709
```

## Overview

Husky Help Husky is a peer-to-peer campus marketplace — think cozy Craigslist for Huskies. Users can create accounts, browse listings, search by keyword or category, add items to a cart, complete purchases, review past transactions, leave ratings, and manage a personal profile.

## Updates

### 2026/7/6

- Refined the main page search bar by combining the category filter, keyword field, and search button into one unified control.
- Added Enter-key support for searching behavior in the main page.
- Added removable filter pills so active category filters are easier to see and clear.
- Removed the unclear `unsearch` button from the main page search controls.
- Added a shared app header so the site name appears consistently across pages.

### 2026/7/9

- Added a clear (`×`) button inside the main page search input so typed keyword text can be cleared without manually retyping over it.
- Clearing the keyword input now re-runs the filter, resetting results to whatever the active category alone would show.
- Replaced the "Toggle layout" text button with a two-icon grid/list segmented control that clearly shows which view is currently active.

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
