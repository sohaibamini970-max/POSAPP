// src/database/db.js
import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

let db;

export const getDBConnection = async () => {
  if (db) return db;
  
  db = await SQLite.openDatabase({
    name: 'posapp.db',
    location: 'default',
  });
  
  return db;
};

export const initDatabase = async () => {
  const database = await getDBConnection();

  // Create Users Table
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );
  `);

  // Create Categories Table
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  // Create Products Table
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category_id INTEGER,
      image_uri TEXT,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );
  `);

  // Create Sales Table (NEW)
  await database.executeSql(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      total REAL NOT NULL,
      items TEXT NOT NULL,
      payment_method TEXT,
      cashier TEXT
    );
  `);

  // Add this inside initDatabase() right after the sales table
await database.executeSql(`
  CREATE TABLE IF NOT EXISTS receipt_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    header_text TEXT,
    header_align TEXT,
    header_weight TEXT,
    header_size INTEGER,
    footer_text TEXT,
    footer_align TEXT,
    show_logo INTEGER DEFAULT 0,
    auto_print INTEGER DEFAULT 1
  );
`);

// Insert default receipt settings if the table is empty
const [rsCount] = await database.executeSql('SELECT COUNT(*) as count FROM receipt_settings');
if (rsCount.rows.item(0).count === 0) {
  await database.executeSql(`
    INSERT INTO receipt_settings 
    (header_text, header_align, header_weight, header_size, footer_text, footer_align, show_logo, auto_print) 
    VALUES 
    ('My Store', 'center', 'bold', 22, 'Thank you for shopping with us!', 'center', 0, 1)
  `);
}

  // Create default user if none exists
  const [userResult] = await database.executeSql('SELECT COUNT(*) as count FROM users');
  if (userResult.rows.item(0).count === 0) {
    await database.executeSql(`INSERT INTO users (name, role) VALUES ('Admin', 'Manager')`);
  }

  console.log('Database initialized successfully');
  return database;
};