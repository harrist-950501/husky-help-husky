CREATE TABLE "sqlite_sequence" (
	"name"	,
	"seq"
);

CREATE TABLE "users" (
	"id"	INTEGER,
	"username"	TEXT NOT NULL UNIQUE,
	"email"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "items" (
	"id"	INTEGER,
	"seller_id"	INTEGER NOT NULL,
	"title"	TEXT NOT NULL,
	"category"	TEXT NOT NULL,
	"description"	TEXT,
	"price"	REAL NOT NULL,
	"stock"	INTEGER NOT NULL,
	"status"	TEXT,
	"date"	DATETIME DEFAULT (datetime('now', 'localtime')),
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("seller_id") REFERENCES "users"("id")
);

CREATE TABLE "transactions" (
	"id"	INTEGER,
	"buyer_id"	INTEGER NOT NULL,
	"seller_id"	INTEGER NOT NULL,
	"item_id"	INTEGER NOT NULL,
	"date"	DATETIME DEFAULT (datetime('now', 'localtime')),
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("buyer_id") REFERENCES "users"("id"),
	FOREIGN KEY("item_id") REFERENCES "items"("id"),
	FOREIGN KEY("seller_id") REFERENCES "users"("id")
);

CREATE TABLE ratings (
  "id"       INTEGER PRIMARY KEY AUTOINCREMENT,
  "item_id"  INTEGER NOT NULL,
  "user_id"  INTEGER NOT NULL,
  "stars"    INTEGER NOT NULL CHECK ("stars" BETWEEN 1 AND 5),
  "comment"  TEXT,
  date     DATETIME DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY("item_id") REFERENCES "items"("id"),
  FOREIGN KEY("user_id") REFERENCES "users"("id")
)

CREATE TABLE user_profiles (
  "user_id"     INTEGER PRIMARY KEY,
  "display_name" TEXT,
  "address"      TEXT,
  "profile_img"  TEXT,
  "quote"        TEXT,
  FOREIGN KEY("user_id") REFERENCES "users"("id")
);