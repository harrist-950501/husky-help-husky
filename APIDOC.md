# *Husky Help Husky* API Documentation

*This API powers the Husky Help Husky campus marketplace web app. It allows clients to authenticate users, browse and search items for sale, view detailed item information, submit purchases (single or bulk), manage ratings, view a user’s purchase history, and manage basic user profile information.*

*All authenticated endpoints rely on an HTTP-only `session` cookie set by `/login` or `/signup`.*

---

## *1. Login*
**Request Format:** */login*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Authenticates a user with a username and password. On success, creates a new login session, sets an HTTP-only `session` cookie on the client, and returns the user’s basic information. This cookie must be included automatically by the browser for all future authenticated requests.*

**Required Body Parameters:**

- `username` (string): The user’s login name.
- `password` (string): The user’s password.

**Example Request:** */login*

*Body (JSON):*

```
{
  "username": "alice",
  "password": 1234
}
```

**Example Success Response (200):**

```
{
  "id": 1,
  "username": "alice"
}
```

**Error Handling:**

*400 Bad Request – Missing Parameters*

*Error response (Plain text):*

```
Missing parameter: 'username' 'password'.
```

*400 Bad Request – Invalid Credentials*

*Error response (Plain text):*

```
Incorrect username or password.
```

*500 Server-side Error*

*Error response (Plain text):*

```
Server error, try again later.
```

## *2. Signup*
**Request Format:** */signup*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Creates a new user account with the provided username, password, and UW email. Validates that the username is unique and that the email ends with @uw.edu. On success, also starts a login session: sets the same HTTP-only session cookie as /login and returns the user’s basic info.*

**Example Request:** */signup*

*With JSON body:*

```
{
  "username": "newuser",
  "password": "secure123",
  "email": "newuser@uw.edu"
}
```

**Example Success Response (200):**

```
{
  "id": 2,
  "username": "newuser"
}
```

**Error Handling:**

*400 Bad Request – Missing Parameters*

*Error response (Plain text):*

```
Missing parameter: 'username' 'password' 'email'.
```

*400 Bad Request – Username Already Taken*

*Error response (Plain text):*

```
Username already taken.
```

*400 Bad Request – Non-UW Email*

*Error response (Plain text):*

```
Please use your uw email to sign up.
```

*500 Server-side Error*

*Error response (Plain text):*

```
Server error, try again later.
```

## *3. Item List*
**Request Format:** */items*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns all items from the items table. No query parameters are supported on this endpoint. Each item is returned exactly as stored in the database.*

**Example Request:** */items*

**Example Success Response (200):**

```
[
  {
    "id": 1,
    "seller_id": 1,
    "title": "CSE 142 Textbook",
    "category": "books",
    "description": "Used but good condition.",
    "price": 18.0,
    "stock": 4,
    "status": null,
    "date": "2025-11-29 13:55:09"
  },
  {
    "id": 2,
    "seller_id": 1,
    "title": "CSE 143 Textbook",
    "category": "books",
    "description": "Minor wear, lots of annotations.",
    "price": 20.0,
    "stock": 2,
    "status": null,
    "date": "2025-11-29 13:55:09"
  }
]
```

**Error Handling:**

*500 Server Side Error*

*Returned Data Format:* Plain Text

```
Server error, try again later.
```

## *4. Item Details*
**Request Format:** */items?id=:id*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns the full details for a single item with the given id as a query parameter. If no such item exists, the response body is null.*

**Example Request:** */items?id=1*

**Example Success Response (200):**

```
{
  "id": 1,
  "seller_id": 1,
  "title": "CSE 142 Textbook",
  "category": "books",
  "description": "Used but good condition.",
  "price": 18.0,
  "stock": 4,
  "status": null,
  "date": "2025-11-29 13:55:09"
}
```

**Error Handling:**
*500 Internal Server Error.*

*Returned Data Format:* Plain Text

```
Server error, try again later.
```

## *5. Search Items*
**Request Format:** */items/search?search=&filter=*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Searches items by an optional keyword and/or category filter. The keyword is matched against title and description. At least one of search or filter must be provided.*

**Query Parameters**
search (optional): text to match
filter (optional): category name

**Example Request (keyword only):** *GET /items/search?search=textbook*

**Example Request (keyword + category filter):** *GET /items/search?search=calculator&filter=electronics*

**Example Success Response (200):**

```
[
  {
    "id": 3,
    "seller_id": 2,
    "title": "TI-84 Calculator",
    "category": "electronics",
    "description": "Perfect for STAT and math classes.",
    "price": 35.0,
    "stock": 1,
    "status": null,
    "date": "2025-11-29 13:55:09"
  }
]
```

**Error Handling:**

*400 Bad Request – Neither search nor filter Provided*

*Returned Data Format:* Plain Text

```
Missing query parameter: 'search' 'filter'
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Server error, try again later.
```

## *6. Submit Purchase (Buy)*
**Request Format:** */buy*

**Request Type:** *POST*

**Returned Data Format:** Plain text

**Description:** *Creates a purchase record for a single item and decrements its stock by 1. The buyer is determined from the authenticated session (session cookie); the client only provides the item_id. Requires the user to be logged in.*

**Example Request:** */buy*

```
{
  "item_id": 3
}
```

**Example Success Response (200):**

```
JHDNV3VM
```
(A randomly generated confirmation code.)

**Error Handling:**

*401 Unauthorized – Not Logged In*

*Returned Data Format:* Plain Text

```
Not logged in.
```

*400 Bad Request – Missing Parameter*

*Returned Data Format:* Plain Text

```
Missing parameter: 'item_id'.
```

*400 Bad Request – Item Does Not Exist*

*Returned Data Format:* Plain Text

```
Item does not exist.
```

*400 Bad Request – Item Out of Stock*

*Returned Data Format:* Plain Text

```
Item out of stock.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Server error, try again later.
```

## *7. Bulk Purchase (Bulk Buy)*
**Request Format:** */bulk-buy*

**Request Type:** *POST*

**Returned Data Format:** Plain text

**Description:** *Processes a bulk purchase of multiple items at once. Uses a single shared confirmation code for all items. Each item in the bulk request includes an id and a quantity to purchase. The buyer is determined from the authenticated session (session cookie). Requires the user to be logged in.*

**Example Request:** */bulk-buy*

```
{
  "items": [
    { "id": 1, "quantity": 2 },
    { "id": 3, "quantity": 1 }
  ]
}
```

**Example Success Response (200):**

```
KR7XM2HJ
```
(A randomly generated confirmation code shared by all items in the bulk purchase.)

**Error Handling:**

*401 Unauthorized – Not Logged In*

*Returned Data Format:* Plain Text

```
Not logged in.
```

*400 Bad Request – Missing Items Parameter*

*Returned Data Format:* Plain Text

```
Missing parameter: 'items'.
```

*400 Bad Request – Invalid JSON for items*

*Returned Data Format:* Plain Text

```
Items must be in JSON form.
```

*400 Bad Request – Item Does Not Exist*

*Returned Data Format:* Plain Text

```
Item does not exist.
```

*400 Bad Request – Not Enough Stock for Requested Quantity*

*Returned Data Format:* Plain Text

```
Not enough stock for purchase.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Server error, try again later.
```

## *8. Purchase History*
**Request Format:** */history*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns the transaction history for the currently logged-in user, ordered from most recent to oldest. Requires user to be authenticated via session cookie.*

**Example Request:** */history*

*No body parameters required. User ID is obtained from the authenticated session.*

**Example Success Response (200):**

```
[
  {
    "id": 1,
    "buyer_id": 2,
    "seller_id": 1,
    "item_id": 1,
    "date": "2025-11-29 14:18:58",
    "title": "CSE 142 Textbook",
    "category": "books",
    "price": 18.0,
    "stock": 3,
    "status": null
  },
  {
    "id": 3,
    "buyer_id": 2,
    "seller_id": 3,
    "item_id": 3,
    "date": "2025-11-29 14:18:58",
    "title": "TI-84 Calculator",
    "category": "electronics",
    "price": 35.0,
    "stock": 0,
    "status": null
  }
]
```

*Note: Exact field order may differ, but the idea is a merged row of transaction + item info.*

**Error Handling:**

*400 Bad Request – No Such User*

*Returned Data Format:* Plain Text

```
No such user.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Could not retrieve history..
```

## *9. Ratings*
**Request Format:** */ratings*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Allows a buyer to submit a star rating and optional comment for an item they purchased. Validates that the user and item exist, and that the star rating is whole number between 1 and 5.*

**Example Request:** */ratings*

**Example Success Response (200):**

```
{
  "message": "Rating submitted successfully."
}
```

**Error Handling:**

*400 Bad Request – Missing Parameters*

*Returned Data Format:* Plain Text

```
Missing parameter: 'user_id' 'item_id' 'stars'.
```

*400 Bad Request – Invalid Star Rating*

*Returned Data Format:* Plain Text

```
Stars must be an integer between 1 and 5.
```

*400 Bad Request – Item Does Not Exist*

*Returned Data Format:* Plain Text

```
Item does not exist.
```

*400 Bad Request – User Does Not Exist*

*Returned Data Format:* Plain Text

```
User does not exist.
```

*400 Bad Request – Other Client Error*

*Returned Data Format:* Plain Text

```
Error submitting rating.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error submitting rating.
```

## *10. Ratings - Retrieve Ratings*
**Request Format:** */items/:id/ratings*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns the average rating, count, and list of all ratings for a specific item.*

**Example Request:** */items/1/ratings*

**Example Success Response (200):**

```
{
  "itemId": 1,
  "average": 4.5,
  "count": 2,
  "ratings": [
    {
      "stars": 5,
      "comment": "Great textbook, very helpful!",
      "date": "2025-12-03 10:30:00",
      "user_id": 2
    },
    {
      "stars": 4,
      "comment": null,
      "date": "2025-12-02 14:15:00",
      "user_id": 3
    }
  ]
}
```

**Error Handling:**

*400 Bad Request – Item Does Not Exist*

*Returned Data Format:* Plain Text

```
Item does not exist.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error retrieving ratings.
```

## *11. Logout*
**Request Format:** */logout*

**Request Type:** *POST*

**Returned Data Format:** Plain text

**Description:** *Logs out the current user by clearing their session.*

**Example Request:** */logout*

```
{
  "user_id": 2
}
```

**Example Success Response (200):**

```
User logged out successfully
```

**Error Handling:**

*400 Bad Request – Missing Parameters*

*Occurs when user_id is missing or empty in the request body.*

*Error response (Plain text):*

```
Missing parameter: 'user_id'.
```

*400 Bad Request – Invalid User*

*Occurs when no user matches the given user_id.*

*Error response (Plain text):*

```
Invalid user.
```

*500 Server-side Error*

*Generic server-side error during logout.*

*Error response (Plain text):*

```
Server error logging out.
```

## *12. Get User Profile*
**Request Format:** */users/:id/profile*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Retrieves the profile information for a specific user, including display name, address, and quote. If no profile exists, a default one is created with the username as the initial display name.*

**Example Request:** */users/2/profile*

**Example Success Response (200):**

```json
{
  "user_id": 2,
  "display_name": "Alice Smith",
  "address": "Seattle, WA",
  "quote": "Go Huskies!"
}
```

**Error Handling:**

*400 Bad Request – User Not Found*

*Returned Data Format:* Plain Text

```
No such user.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Could not retrieve profile.
```

## *13. Update User Profile*
**Request Format:** */users/:id/profile*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Creates or updates the profile information for a user. Accepts displayName (or display_name for backwards compatibility), address, and quote fields.*

**Optional Body Parameters:**

- `displayName` (string): User's display name
- `address` (string): User's address or location
- `quote` (string): User's profile quote or bio

**Example Request:** */users/2/profile*

```json
{
  "displayName": "Alice Smith",
  "address": "Seattle, WA",
  "quote": "Go Huskies!"
}
```

**Example Success Response (200):**

```json
{
  "user_id": 2,
  "display_name": "Alice Smith",
  "address": "Seattle, WA",
  "quote": "Go Huskies!"
}
```

**Error Handling:**

*400 Bad Request – User Not Found*

*Returned Data Format:* Plain Text

```
No such user.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Could not save profile.
```