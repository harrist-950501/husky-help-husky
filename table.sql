CREATE TABLE users (
	id	SERIAL PRIMARY KEY,
	username	TEXT NOT NULL UNIQUE,
	email	TEXT NOT NULL UNIQUE,
	password	TEXT NOT NULL
);

CREATE TABLE items (
	id	SERIAL PRIMARY KEY,
	seller_id	INTEGER NOT NULL,
	title	TEXT NOT NULL,
	category	TEXT NOT NULL,
	description	TEXT,
	price	REAL NOT NULL,
	stock	INTEGER NOT NULL,
	FOREIGN KEY(seller_id) REFERENCES users(id)
);

CREATE TABLE transactions (
	id	SERIAL PRIMARY KEY,
	confirmation_code	TEXT NOT NULL,
	buyer_id	INTEGER NOT NULL,
	seller_id	INTEGER NOT NULL,
	item_id	INTEGER NOT NULL,
	date	TIMESTAMP DEFAULT NOW(),
	FOREIGN KEY(buyer_id) REFERENCES users(id),
	FOREIGN KEY(item_id) REFERENCES items(id),
	FOREIGN KEY(seller_id) REFERENCES users(id)
);

CREATE TABLE ratings (
	id	SERIAL PRIMARY KEY,
	item_id	INTEGER NOT NULL,
	user_id	INTEGER NOT NULL,
	stars	INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
	comment	TEXT,
	date	TIMESTAMP DEFAULT NOW(),
	FOREIGN KEY(item_id) REFERENCES items(id),
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE user_profiles (
	user_id	INTEGER PRIMARY KEY,
	display_name	TEXT,
	address	TEXT,
	quote	TEXT,
	FOREIGN KEY(user_id) REFERENCES users(id)
);
