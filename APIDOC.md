# *Husky Help Husky* API Documentation
*This API powers the Husky Help Husky campus marketplace web app. It allows clients to authenticate users, browse and search items for sale, view detailed item information, confirm and submit purchases, and retrieve a user’s transaction history.*

*Additional optional features include user registration and item ratings.*

*All data is stored in a server-side relational database.*

## *1. Login*
**Request Format:** */login*

**Request Type:** *POST*

**Returned Data Format:** Plain text

**Description:** *Checks provided credentials against the server-side users table. If the username and password match an existing user, the server responds with a simple success message. Supports JSON, application/x-www-form-urlencoded, or multipart/form-data bodies.*

**Example Request:** */login*

*With JSON body:*

```
{
  "username": "dubs@uw.edu",
  "password": "woofwoof"
}
```

**Example Success Response (200):**

```
User login sucessfully
```

**Error Handling:**

*400 Bad Request – Missing Parameters*

*Occurs when username and/or password are missing or empty in the request body.*

*Error response (Plain text):*

```
Missing parameter: 'username' 'password'.
```

*400 Bad Request – Invalid Credentials*

*Occurs when no user matches the given username and password.*

*Error response (Plain text):*

```
Invalid username or password.
```

*500 Server-side Error*

*Generic server-side error during login.*

*Error response (Plain text):*

```
Server error logging in.
```


## *2. Item List*
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
Error retrieving items.
```

## *3. Item Details*
**Request Format:** */items/:id*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns the full details for a single item with the given id. The response is a single JSON object containing the columns from the items table.*

**Example Request:** */items/1*

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

*400 Bad Request – Item Not Found*

*Returned Data Format:* Plain Text

```
Item not found.
```

*500 Internal Server Error.*

*Returned Data Format:* Plain Text

```
Error retrieving item details.
```

## *4. Search Items*
**Request Format:** */search?search=*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Searches items by keyword. Optional category filtering is supported.*

**Query Parameters**
search (required): text to match
filter (optional): category name

**Example Request (keyword only):** *GET /search?search=textbook*

**Example Request (keyword + category filter):** *GET /search?search=calculator&filter=electronics*

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

*400 Bad Request – Missing Search Term*

*Returned Data Format:* Plain Text

*If the search query parameter is missing or empty:*

```
Missing query parameter: 'keyword'
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Search failed.
```

## *5. Submit Purchase*
**Request Format:** */buy*

**Request Type:** *POST*

**Returned Data Format:** Plain text

**Description:** *Look up for the item customer wants to buy, creates a purchase record for an item and updates its availability after buying.*

**Example Request:** */buy*

```
{
  "buyer_id": 2,
  "item_id": 3
}
```

**Example Success Response (200):**

```
JHDNV3VM
```

**Error Handling:**

*400 Bad Request – Missing Parameters*

*Returned Data Format:* Plain Text

```
Missing parameter: 'buyer_id' 'item_id'.
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
Transaction failed.
```

## *6. Purchase History*
**Request Format:** */history/:user_id*

**Request Type:** *GET*

**Returned Data Format:** JSON

**Description:** *Returns a list of user’s transaction history, including time, price and item information for each transaction.*

**Example Request:** */history/2*

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

## *7. Ratings - Submit Rating*
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

## *8. Ratings - Retrieve Ratings*
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

# *Future Extensions (Not Implemented)*

*This section describes a potential extension to the API for a future version of Husky Help Husky.*

## *7. Optional Feature 1: User Registration*
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
Provide valid 'username', 'email', and 'password'.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Failed to create user.
```

## *9. User Profile*
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
User not found.
```

*500 Internal Server Error*

*Returned Data Format:* Plain Text

```
Failed to load user profile.
```
