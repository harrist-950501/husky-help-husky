This is the API document for CSE154 final project.

Existing APIs
1.statusCheck - Check a fetch Response and throw for non-OK HTTP statuses.
2.getJSON - Perform a GET request and parse the response as JSON.

Will be work on
1. POST /auth/login
Checks username/password; creates a simple token. Satisfies “Endpoint to check credentials” for login.
Params (body; support JSON/FormData/URL -> encoded??):
username (string, UW email format)
password (string)
Returns: { "userId": "...", "username": "...", "token": "..." }
Errors: 400 missing fields, 401 invalid creds, 415 bad content-type.
Why: Required Feature 2 (login) needs a server check.
2. GET /auth/session
Verifies current login state.
Returns: { "authenticated": true, "userId": "...", "username": "..." }
Errors: 401 if not logged in.
Why: You must “make sure the user is logged in” for protected flows.
3. GET /items
Lists items for the main view (with pagination + filters + search). Fulfills “Endpoint to retrieve all items” and “Endpoint to search database.”
Query params (all optional):
q (string; keyword search across at least 3 columns such as name, description, seller)
category (string)
minPrice / maxPrice (number)
condition (enum: new/used/… )
sort (enum: price_asc|price_desc|newest|popular)
limit (int, default 20), offset (int, default 0)
Returns: { "items":[...], "total":123, "limit":20, "offset":0 }
Errors: 400 invalid filters; 500 db error.
Why: Feature 1 (display items) + Feature 5 (search/filter; 3+ columns), both backed by a single flexible endpoint.
4. GET /items/:id
Detailed info for one item (at least 4 fields: name, image, description, price, availability, seller, etc.).
Returns: { "id":"...", "name":"...", "price":..., "available":true, "imageUrl":"...", "description":"...", "seller":"...", ... }
Errors: 404 not found.
Why: Required Feature 3 (detail view) needs an item-details endpoint.
5. POST /transactions/confirm
“Confirm” step before purchase (locks current price/quantity snapshot and returns a short-lived confirmation token).
Params:
itemId (string)
quantity (int; default 1)
Auth: required (/auth/session).
Returns: { "confirmationToken":"...", "item":{"id":"...","name":"...","price":...}, "expiresAt":"..." }
Errors: 401 unauthenticated, 400 bad quantity.
Why: Spec separates “confirm” and “submit”; confirm prevents silent changes between steps.
6. POST /transactions/submit
Submits a purchase after a successful confirm; decrements stock and returns a unique alphanumeric confirmation code.
Params:
confirmationToken (string)
Auth: required.
Returns: { "transactionId":"...", "confirmationCode":"AB12CD34", "itemId":"...", "quantity":1, "total":... }
Errors: 401 unauthenticated, 400 invalid token.
Why: Required Feature 4: determine success/failure, update DB, and return confirmation code; ensure unavailable items cannot be purchased.
7. GET /transactions
Returns the logged-in user’s transaction history (name of item, confirmation number, timestamp, price).
Query (optional): q (keyword), sort (e.g., time_desc|price_desc|price_asc), limit, offset.
Auth: required.
Returns: { "transactions":[{"id":"...","confirmationCode":"...","itemName":"...","time":"...","total":...}], "total":..., "limit":..., "offset":... }
Errors: 401 unauthenticated.
Why: Required Feature 6 (history).