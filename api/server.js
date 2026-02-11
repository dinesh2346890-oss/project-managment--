const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const db = new sqlite3.Database('./fabric_inventory.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Helper functions for Promisified DB operations
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

// API Routes
app.get('/api/fabrics', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM fabrics ORDER BY date_added DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/fabrics', async (req, res) => {
    try {
        const { name, product_code, type, quantity, unit, price_per_unit, mrp, selling_price, supplier, description } = req.body;
        const result = await dbRun(
            'INSERT INTO fabrics (name, product_code, type, quantity, unit, price_per_unit, mrp, selling_price, supplier, description, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [name, product_code, type, quantity, unit, price_per_unit, mrp, selling_price, supplier, description]
        );
        res.json({ id: result.lastID, message: 'Fabric added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add more API routes as needed...

// For Vercel serverless deployment
module.exports = app;
