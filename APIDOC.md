# *Husky Help Husky* API Documentation
*This API powers the Husky Help Husky campus marketplace web app. It allows clients to authenticate users, browse and search items for sale, view detailed item information, confirm and submit purchases, and retrieve a user’s transaction history.*

*Additional optional features include user registration and item ratings.*

*All data is stored in a server-side relational database.*

## *1. Login*
**Request Format:** */login*

**Request Type:** *POST*

**Returned Data Format:** Plain text

**Description:** *Checks provided credentials against the server database. If valid, returns user identity and a session token (or sets an authentication cookie). Supports JSON, form-data, or URL-encoded request bodies.*

**Example Request:** */login*

*With JSON body:*

```
{
  "username": "dubs@uw.edu",
  "password": "woofwoof"
}
```

**Example Response:**

```
User login sucessfully
```

**Error Handling:**

*400 Bad Request*

*Missing username or password.*

*Error response (Plain text):*

```
Missing parameter: 'username' 'password'.
```

*500 Server-side Error*

*Error response (Plain text):*

```
An error occurred on the server. Try again later.
```

## *2. Check Session Status*
**Request Format:** */auth/session*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Verifies whether the current client session is authenticated. Used for pages that require login.*

**Example Request:** */auth/session*

**Example Response:**

```
{
  "authenticated": true,
  "userId": "u_1027",
  "username": "dubs@uw.edu"
}
```

**Error Handling:**

*401 Unauthorized*

*Returned Data Format:* Plain Text

```
Error: Not authenticated.
```

## *3. Item List (Search & Filter)*
**Request Format:** */items?q=&category=&minPrice=&maxPrice=&condition=&sort=&limit=&offset=*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns a paginated list of marketplace items. Supports keyword search, multiple filters, and sorting by price or recency.*

**Example Request:** */items?q=laptop&category=electronics&minPrice=200&sort=price_asc&limit=10*

**Example Response:**

```
{
  "items": [
    {
      "id": "it_301",
      "name": "Used MacBook Air",
      "price": 499.99,
      "available": true,
      "capacity": 3,
      "imageUrl": "/img/air13.jpg",
      "description": "2019 model, good condition",
      "seller": "u_2001",
      "category": "electronics",
      "condition": "used",
      "createdAt": "2025-10-15T20:12:11Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

**Error Handling:**

*400 Bad Request*

*Returned Data Format*: Plain Text

```
Error: Invalid filter or pagination parameters.
```

*500 Server Error*

*Returned Data Format:* Plain Text

```
Error: Failed to load items. Please try again later.
```

## *4. Item Details*
**Request Format:** */items/:id*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns detailed information about a specific item, including name, price, capacity, seller, description, category, condition, and image.*

**Example Request:** */items/it_301*

**Example Response:**

```
{
  "id": "it_301",
  "name": "Used MacBook Air",
  "price": 499.99,
  "available": true,
  "capacity": 3,
  "imageUrl": "/img/air13.jpg",
  "description": "2019 model, good condition",
  "seller": {
    "userId": "u_2001",
    "username": "sarah@uw.edu"
  },
  "category": "electronics",
  "condition": "used",
  "createdAt": "2025-10-15T20:12:11Z"
}
```

**Error Handling:**

*404 Not Found*

*Returned Data Format:* Plain Text

```
Error: Item not found.
```

## *5. Confirm Purchase*
**Request Format:** */transactions/confirm*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Verifies that an item is still available at its current capacity/price. If valid, returns a temporary confirmation token that must be used in the final purchase step.*

**Example Request:** */transactions/confirm*

*with JSON Body:*
```
{
  "itemId": "it_301",
  "quantity": 1
}
```

**Example Response:**

```
{
  "confirmationToken": "cfm_7b7f2b9f",
  "item": {
    "id": "it_301",
    "name": "Used MacBook Air",
    "price": 499.99
  },
  "quantity": 1,
  "expiresAt": "2025-11-16T08:00:00Z"
}
```

**Error Handling:**

*401 Unauthorized*

*Returned Data Format:* Plain Text

```
Error": Not authenticated.
```

*400 Bad Request*

*Returned Data Format:* Plain Text

```
Error: Invalid 'itemId' or 'quantity'.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error: Failed to confirm purchase.
```


## *6. Submit Purchase*
**Request Format:** */transactions/submit*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Creates a final transaction record using a valid confirmationToken. Decrements item capacity and returns a unique alphanumeric confirmation code.*

**Example Request:** */transactions/submit*

*with JSON Body:*

```
{
  "confirmationToken": "cfm_7b7f2b9f"
}
```

**Example Response:**

```
{
  "transactionId": "tx_8842",
  "confirmationCode": "AB12CD34",
  "itemId": "it_301",
  "quantity": 1,
  "total": 499.99,
  "time": "2025-11-16T07:12:44Z"
}
```

**Error Handling:**

*401 Unauthorized*

*Returned Data Format:* Plain Text

```
Error: Not authenticated.
```

*400 Bad Request*

*Returned Data Format:* Plain Text

```
Error: Missing or invalid 'confirmationToken'.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error: "Failed to complete purchase.
```

## *7. Transaction History*
**Request Format:** */transactions?q=&sort=&limit=&offset=*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns a logged-in user’s past transactions. Supports keyword search and sorting (e.g., by time or price).*

**Example Request:** */transactions?sort=time_desc&limit=10*

**Example Response:**

```
{
  "transactions": [
    {
      "id": "tx_8842",
      "confirmationCode": "AB12CD34",
      "itemName": "Used MacBook Air",
      "time": "2025-11-16T07:12:44Z",
      "total": 499.99
    }
  ],
  "total": 6,
  "limit": 10,
  "offset": 0
}
```

**Error Handling:**

*401 Unauthorized*

*Returned Data Format:* Plain Text

```
Error: Not authenticated.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error: Failed to load transactions.
```

## *8. Optional Feature 1: User Registration*
**Request Format:** */users*

**Request Type:** *POST*

**Returned Data Format:** JSON

**Description:** *Creates a new user account, validating uniqueness of username/email.*

**Example Request:** */users*

*with JSON Body:*

```
{
  "username": "sarah@uw.edu",
  "email": "sarah@uw.edu",
  "password": "p@ssw0rd!"
}
```

**Example Response:**

```
{
  "userId": "u_2001",
  "username": "sarah@uw.edu"
}
```

**Error Handling:**

*400 Bad Request*

*Returned Data Format:* Plain Text

```
Error: Provide valid 'username', 'email', and 'password'.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error: Failed to create user.
```

## *9. Optional Feature 2: Ratings — Retrieve Ratings*
**Request Format:** */items/:id/ratings*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns the average rating and all ratings for a specific item.*

**Example Request:** */items/:it_301/ratings*

**Example Response:**

```
{
  "avg": 4.6,
  "count": 17,
  "ratings": [
    {
      "userId": "u_1027",
      "stars": 5,
      "text": "Great deal!",
      "time": "2025-11-10T17:01:05Z"
    }
  ]
}
```

**Error Handling:**

*404 Not Found*

*Returned Data Format:* Plain Text

```
Error: Item not found.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error: "Failed to load ratings.
```

## *10. User Profile*
**Request Format:** */users/:id*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Retrieves profile information for a specific user, including displayname, avatar, address and optionally their item listings or ratings if enabled.*

**Example Request:** */users/u_1027*

**Example Response:**

```
{
  "userId": "u_1027",
  "username": "dubs@uw.edu",
  "profile": {
    "displayName": "Dubs",
    "bio": "Go Huskies!",
    "avatarUrl": "/img/avatars/u_1027.png"
  },
  "stats": {
    "itemsListed": 12,
    "ratingsReceived": 5,
    "avgRating": 4.8
  }
}
```

**Error Handling:**

*404 Not Found*

*Returned Data Format:* Plain Text

```
Error: User not found.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Error: Failed to load user profile.
```
