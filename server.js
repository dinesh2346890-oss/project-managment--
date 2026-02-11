const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Initialize SQLite database
const db = new sqlite3.Database('./fabric_inventory.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Helper functions for Promisified DB operations
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Fabrics table - Includes MRP and Selling Price
        db.run(`CREATE TABLE IF NOT EXISTS fabrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_code TEXT UNIQUE, 
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            color TEXT,
            pattern TEXT,
            quantity REAL NOT NULL DEFAULT 0,
            unit TEXT NOT NULL,
            price_per_unit REAL NOT NULL DEFAULT 0,
            mrp REAL NOT NULL DEFAULT 0,
            selling_price REAL NOT NULL DEFAULT 0,
            supplier TEXT,
            description TEXT,
            image_url TEXT,
            date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add columns if they don't exist in old DB file
        db.run(`ALTER TABLE fabrics ADD COLUMN product_code TEXT UNIQUE`, (err) => {});
        db.run(`ALTER TABLE fabrics ADD COLUMN mrp REAL NOT NULL DEFAULT 0`, (err) => {});
        db.run(`ALTER TABLE fabrics ADD COLUMN selling_price REAL NOT NULL DEFAULT 0`, (err) => {});

        // Inventory transactions table
        db.run(`CREATE TABLE IF NOT EXISTS inventory_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fabric_id INTEGER NOT NULL,
            transaction_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit_price REAL,
            total_value REAL,
            reference TEXT,
            transaction_source TEXT,
            payment_mode TEXT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fabric_id) REFERENCES fabrics (id)
        )`);

        // Add new columns to existing transactions table if they don't exist
        db.run(`ALTER TABLE inventory_transactions ADD COLUMN transaction_source TEXT`, (err) => {});
        db.run(`ALTER TABLE inventory_transactions ADD COLUMN payment_mode TEXT`, (err) => {});

        // Chat messages table
        db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_message TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_id TEXT
        )`);

        // Sales table
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fabric_id INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            customer_phone TEXT,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            unit_price REAL NOT NULL,
            total_amount REAL NOT NULL,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            invoice_number TEXT,
            payment_method TEXT,
            payment_status TEXT,
            delivery_address TEXT,
            notes TEXT,
            status TEXT DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fabric_id) REFERENCES fabrics (id)
        )`);

        // Purchase orders table
        db.run(`CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fabric_id INTEGER NOT NULL,
            supplier_name TEXT NOT NULL,
            supplier_email TEXT,
            supplier_phone TEXT,
            quantity REAL NOT NULL,
            unit TEXT NOT NULL,
            unit_price REAL NOT NULL,
            total_amount REAL NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            expected_delivery_date DATETIME,
            order_number TEXT, 
            payment_terms TEXT,
            payment_status TEXT,
            delivery_address TEXT,
            notes TEXT,
            status TEXT DEFAULT 'ordered',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fabric_id) REFERENCES fabrics (id)
        )`);
    });
}

// ==========================================
// API ROUTES
// ==========================================

// --- FABRICS ROUTES ---

// Get all fabrics
app.get('/api/fabrics', (req, res) => {
    const query = `
        SELECT f.*, 
               (
                   COALESCE(f.quantity, 0) + 
                   COALESCE((SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                             WHEN transaction_type = 'out' THEN -quantity 
                                             ELSE 0 END) 
                             FROM inventory_transactions 
                             WHERE fabric_id = f.id), 0)
               ) as current_quantity,
               (SELECT transaction_source FROM inventory_transactions 
                WHERE fabric_id = f.id 
                ORDER BY date DESC, id DESC 
                LIMIT 1) as latest_transaction_source,
               (SELECT payment_mode FROM inventory_transactions 
                WHERE fabric_id = f.id 
                ORDER BY date DESC, id DESC 
                LIMIT 1) as latest_payment_mode
        FROM fabrics f
        ORDER BY f.date_added DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const fabricsWithTransactionData = rows.map(fabric => ({
            ...fabric,
            transaction_source: fabric.latest_transaction_source,
            payment_mode: fabric.latest_payment_mode
        }));
        
        res.json(fabricsWithTransactionData);
    });
});

// Search fabrics
app.get('/api/fabrics/search', (req, res) => {
    const { q, type, color, supplier } = req.query;
    let query = `SELECT f.*, 
                        (
                           COALESCE(f.quantity, 0) + 
                           COALESCE((SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                                     WHEN transaction_type = 'out' THEN -quantity 
                                                     ELSE 0 END) 
                                     FROM inventory_transactions 
                                     WHERE fabric_id = f.id), 0)
                        ) as current_quantity,
                        (SELECT transaction_source FROM inventory_transactions 
                         WHERE fabric_id = f.id 
                         ORDER BY date DESC, id DESC 
                         LIMIT 1) as latest_transaction_source,
                        (SELECT payment_mode FROM inventory_transactions 
                         WHERE fabric_id = f.id 
                         ORDER BY date DESC, id DESC 
                         LIMIT 1) as latest_payment_mode
                 FROM fabrics f WHERE 1=1`;
    const params = [];
    
    if (q) {
        query += ` AND (f.name LIKE ? OR f.description LIKE ? OR f.product_code LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (type) {
        query += ` AND f.type = ?`;
        params.push(type);
    }
    if (color) {
        query += ` AND f.color = ?`;
        params.push(color);
    }
    if (supplier) {
        query += ` AND f.supplier = ?`;
        params.push(supplier);
    }
    
    query += ` ORDER BY f.date_added DESC`;
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const fabricsWithTransactionData = rows.map(fabric => ({
            ...fabric,
            transaction_source: fabric.latest_transaction_source,
            payment_mode: fabric.latest_payment_mode
        }));
        
        res.json(fabricsWithTransactionData);
    });
});

// Add new fabric
app.post('/api/fabrics', upload.single('image'), (req, res) => {
    const { name, product_code, type, color, pattern, quantity, unit, price_per_unit, mrp, selling_price, supplier, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const finalCode = product_code || `ITEM-${Date.now().toString().slice(-6)}`;

    const query = `INSERT INTO fabrics (name, product_code, type, color, pattern, quantity, unit, price_per_unit, mrp, selling_price, supplier, description, image_url)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, finalCode, type, color, pattern, 0, unit, price_per_unit, mrp || 0, selling_price || 0, supplier, description, image_url], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (quantity > 0) {
            const transactionQuery = `INSERT INTO inventory_transactions (fabric_id, transaction_type, quantity, unit_price, total_value, reference, transaction_source, payment_mode)
                                      VALUES (?, 'in', ?, ?, ?, 'Opening Stock', 'Manual Entry', 'Cash')`;
            const totalValue = quantity * price_per_unit;
            
            db.run(transactionQuery, [this.lastID, quantity, price_per_unit, totalValue]);
        }
        
        res.json({ id: this.lastID, message: 'Fabric added successfully' });
    });
});

// Update fabric
app.put('/api/fabrics/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, product_code, type, color, pattern, quantity, unit, price_per_unit, mrp, selling_price, supplier, description } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.existing_image;
    
    const query = `UPDATE fabrics 
                   SET name = ?, product_code = ?, type = ?, color = ?, pattern = ?, 
                       unit = ?, price_per_unit = ?, mrp = ?, selling_price = ?, supplier = ?, description = ?, 
                       image_url = ?, last_updated = CURRENT_TIMESTAMP
                   WHERE id = ?`;
    
    db.run(query, [name, product_code, type, color, pattern, unit, price_per_unit, mrp || 0, selling_price || 0, supplier, description, image_url, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Fabric updated successfully' });
    });
});

// Delete fabric
app.delete('/api/fabrics/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM fabrics WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        db.run('DELETE FROM inventory_transactions WHERE fabric_id = ?', [id]);
        res.json({ message: 'Fabric deleted successfully' });
    });
});

// --- TRANSACTION ROUTES ---

// Add inventory transaction
app.post('/api/transactions', (req, res) => {
    const { fabric_id, transaction_type, quantity, unit_price, reference, transaction_source, payment_mode } = req.body;
    const total_value = quantity * unit_price;
    
    const query = `INSERT INTO inventory_transactions (fabric_id, transaction_type, quantity, unit_price, total_value, reference, transaction_source, payment_mode)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [fabric_id, transaction_type, quantity, unit_price, total_value, reference, transaction_source, payment_mode], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Transaction added successfully' });
    });
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
    const query = `
        SELECT it.*, f.name as fabric_name, f.product_code
        FROM inventory_transactions it
        LEFT JOIN fabrics f ON it.fabric_id = f.id
        ORDER BY it.date DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Test endpoint to debug transaction data
app.get('/api/debug/transactions', (req, res) => {
    const query = `
        SELECT t.*, f.name as fabric_name
        FROM inventory_transactions t
        LEFT JOIN fabrics f ON t.fabric_id = f.id
        ORDER BY t.date DESC
        LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// --- ANALYTICS ROUTES ---

app.get('/api/analytics', (req, res) => {
    const queries = {
        totalFabrics: 'SELECT COUNT(*) as count FROM fabrics',
        
        // FIXED: Sums correctly
        totalValue: `SELECT SUM(current_stock * price_per_unit) as value 
                     FROM (
                         SELECT f.id, f.price_per_unit, 
                                (COALESCE(f.quantity, 0) + 
                                 COALESCE(SUM(CASE WHEN it.transaction_type = 'in' THEN it.quantity 
                                                   WHEN it.transaction_type = 'out' THEN -it.quantity 
                                                   ELSE 0 END), 0)) as current_stock
                         FROM fabrics f
                         LEFT JOIN inventory_transactions it ON f.id = it.fabric_id
                         GROUP BY f.id, f.quantity, f.price_per_unit
                     ) WHERE current_stock > 0`,
        
        // FIXED: Calculates stock correctly for alerting
        lowStock: `SELECT f.id, f.name, f.product_code,
                          (COALESCE(f.quantity, 0) + 
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'in' THEN it.quantity 
                                             WHEN it.transaction_type = 'out' THEN -it.quantity 
                                             ELSE 0 END), 0)) as current_stock
                   FROM fabrics f
                   LEFT JOIN inventory_transactions it ON f.id = it.fabric_id
                   GROUP BY f.id, f.name, f.product_code
                   HAVING current_stock < 10`,
                   
        topSuppliers: `SELECT supplier, COUNT(*) as count
                       FROM fabrics
                       WHERE supplier IS NOT NULL
                       GROUP BY supplier
                       ORDER BY count DESC
                       LIMIT 5`,

        // FIXED: Sum of Quantity per Type (not count of rows)
        fabricTypes: `
            SELECT f.type, 
                   SUM(
                       COALESCE(f.quantity, 0) + 
                       COALESCE((SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                                 WHEN transaction_type = 'out' THEN -quantity 
                                                 ELSE 0 END) 
                                 FROM inventory_transactions 
                                 WHERE fabric_id = f.id), 0)
                   ) as count 
            FROM fabrics f 
            GROUP BY f.type 
            ORDER BY count DESC
        `,

        transactionSources: `SELECT transaction_source, COUNT(*) as count, SUM(total_value) as total_revenue
                             FROM inventory_transactions 
                             WHERE transaction_source IS NOT NULL
                             GROUP BY transaction_source
                             ORDER BY total_revenue DESC`,
        
        paymentModes: `SELECT payment_mode, COUNT(*) as count, SUM(total_value) as total_revenue
                       FROM inventory_transactions 
                       WHERE payment_mode IS NOT NULL
                       GROUP BY payment_mode
                       ORDER BY total_revenue DESC`
    };
    
    const results = {};
    let completed = 0;
    
    Object.keys(queries).forEach(key => {
        db.all(queries[key], [], (err, rows) => {
            if (!err) results[key] = rows;
            completed++;
            if (completed === Object.keys(queries).length) {
                res.json(results);
            }
        });
    });
});

// --- CHAT ROUTES ---

app.post('/api/chat', (req, res) => {
    const { message, session_id } = req.body;
    let response = '';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
        response = 'I can help you check your inventory. You can view all fabrics, add new items, or check stock levels. What would you like to know?';
    } else if (lowerMessage.includes('add') || lowerMessage.includes('new')) {
        response = 'To add a new fabric, click the "Add Fabric" button and fill in the details like name, type, quantity, and price.';
    } else if (lowerMessage.includes('analysis') || lowerMessage.includes('analytics')) {
        response = 'Check the Analytics dashboard to see insights about your inventory including total value, low stock items, and supplier information.';
    } else if (lowerMessage.includes('help')) {
        response = 'I can help you with: \n• Managing your fabric inventory\n• Adding and updating fabric records\n• Checking stock levels\n• Viewing analytics and reports\n• Search and filter fabrics\n\nWhat do you need help with?';
    } else {
        response = 'I\'m here to help with your fabric inventory management. You can ask me about inventory status, adding fabrics, or view analytics. Type "help" for more options.';
    }
    
    const saveQuery = `INSERT INTO chat_messages (user_message, bot_response, session_id)
                       VALUES (?, ?, ?)`;
    db.run(saveQuery, [message, response, session_id || 'default']);
    res.json({ response });
});

app.get('/api/chat/history/:session_id?', (req, res) => {
    const sessionId = req.params.session_id || 'default';
    const query = `SELECT * FROM chat_messages 
                   WHERE session_id = ? 
                   ORDER BY timestamp DESC 
                   LIMIT 50`;
    
    db.all(query, [sessionId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// --- E-COMMERCE / PRODUCTS ROUTES ---

app.get('/api/products', (req, res) => {
    const query = `
        SELECT f.*, 
               (SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                WHEN transaction_type = 'out' THEN -quantity 
                                ELSE 0 END) 
                FROM inventory_transactions 
                WHERE fabric_id = f.id) as current_quantity
        FROM fabrics f
        WHERE f.quantity > 0 OR (SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                                 WHEN transaction_type = 'out' THEN -quantity 
                                                 ELSE 0 END) 
                                 FROM inventory_transactions 
                                 WHERE fabric_id = f.id) > 0
        ORDER BY f.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const products = rows.map(fabric => ({
            id: fabric.id,
            name: fabric.name,
            type: fabric.type,
            color: fabric.color,
            pattern: fabric.pattern,
            description: fabric.description,
            price: fabric.price_per_unit,
            unit: fabric.unit,
            stock: fabric.current_quantity || fabric.quantity || 0,
            image_url: fabric.image_url,
            supplier: fabric.supplier,
            available: (fabric.current_quantity || fabric.quantity || 0) > 0
        }));
        
        res.json(products);
    });
});

// ========================================================
// Process e-commerce order
// ========================================================
app.post('/api/orders', (req, res) => {
    const { items, customer_info, total_amount, payment_mode, transaction_source } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let completed = 0;
        let hasError = false;
        
        const sharedReference = `Order-${Date.now()}`;
        
        items.forEach((item) => {
            const { fabric_id, quantity, unit_price } = item;
            const total_value = quantity * unit_price;
            
            const stockQuery = `
                SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                WHEN transaction_type = 'out' THEN -quantity 
                                ELSE 0 END) as current_stock
                FROM inventory_transactions 
                WHERE fabric_id = ?
            `;
            
            db.get(stockQuery, [fabric_id], (err, stockResult) => {
                if (err) {
                    hasError = true;
                    console.error('Error checking stock:', err);
                    return;
                }
                
                const currentStock = stockResult?.current_stock || 0;
                
                if (currentStock < quantity) {
                    hasError = true;
                    console.error(`Insufficient stock for fabric ${fabric_id}. Available: ${currentStock}, Requested: ${quantity}`);
                    return;
                }
                
                const transactionQuery = `
                    INSERT INTO inventory_transactions 
                    (fabric_id, transaction_type, quantity, unit_price, total_value, reference, transaction_source, payment_mode)
                    VALUES (?, 'out', ?, ?, ?, ?, ?, ?)
                `;
                
                db.run(transactionQuery, [
                    fabric_id, 
                    quantity, 
                    unit_price, 
                    total_value, 
                    sharedReference, 
                    transaction_source || 'E-commerce', 
                    payment_mode || 'UPI'
                ], function(err) {
                    if (err) {
                        hasError = true;
                        console.error('Error creating transaction:', err);
                        return;
                    }
                    
                    completed++;
                    if (completed === items.length) {
                        if (hasError) {
                            db.run('ROLLBACK');
                            res.status(400).json({ error: 'Order processing failed. Check stock availability.' });
                        } else {
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    res.status(500).json({ error: 'Transaction commit failed' });
                                } else {
                                    res.json({ 
                                        message: 'Order processed successfully', 
                                        order_id: sharedReference,
                                        total_items: items.length,
                                        total_amount: total_amount
                                    });
                                }
                            });
                        }
                    }
                });
            });
        });
    });
});

// --- CUTTING OPTIMIZATION ROUTES ---

app.get('/api/cutting-optimization/:fabricId/:quantity', (req, res) => {
    const { fabricId, quantity } = req.params;
    
    const fabricQuery = 'SELECT * FROM fabrics WHERE id = ?';
    
    db.get(fabricQuery, [fabricId], (err, fabric) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!fabric) {
            res.status(404).json({ error: 'Fabric not found' });
            return;
        }
        
        const stockQuery = `
            SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                            WHEN transaction_type = 'out' THEN -quantity 
                            ELSE 0 END) as current_stock
            FROM inventory_transactions 
            WHERE fabric_id = ?
        `;
        
        db.get(stockQuery, [fabricId], (err, stockResult) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const currentStock = stockResult?.current_stock || fabric.quantity || 0;
            
            if (currentStock < parseFloat(quantity)) {
                res.status(400).json({ error: 'Insufficient stock for requested quantity' });
                return;
            }
            
            const totalMeters = parseFloat(quantity);
            const pricePerMeter = fabric.price_per_unit;
            
            const cuttingCombinations = [
                { pieceSize: 10, maxCount: Math.floor(totalMeters / 10) },
                { pieceSize: 5, maxCount: Math.floor(totalMeters / 5) },
                { pieceSize: 3, maxCount: Math.floor(totalMeters / 3) },
                { pieceSize: 1, maxCount: Math.floor(totalMeters / 1) }
            ];
            
            const combinations = [];
            
            const combo1 = optimizeCutting(totalMeters, [10, 5, 3, 1]);
            combinations.push({
                name: 'Maximize Larger Pieces',
                pieces: combo1.pieces,
                totalValue: combo1.totalValue,
                waste: combo1.waste,
                efficiency: ((totalMeters - combo1.waste) / totalMeters * 100).toFixed(1)
            });
            
            const combo2 = balancedCutting(totalMeters, [10, 5, 3, 1]);
            combinations.push({
                name: 'Balanced Distribution',
                pieces: combo2.pieces,
                totalValue: combo2.totalValue,
                waste: combo2.waste,
                efficiency: ((totalMeters - combo2.waste) / totalMeters * 100).toFixed(1)
            });
            
            const combo3 = maximizePieces(totalMeters, [1, 3, 5, 10]);
            combinations.push({
                name: 'Maximize Piece Count',
                pieces: combo3.pieces,
                totalValue: combo3.totalValue,
                waste: combo3.waste,
                efficiency: ((totalMeters - combo3.waste) / totalMeters * 100).toFixed(1)
            });
            
            res.json({
                fabric: {
                    id: fabric.id,
                    name: fabric.name,
                    type: fabric.type,
                    color: fabric.color,
                    pricePerMeter: pricePerMeter,
                    currentStock: currentStock
                },
                requestedQuantity: totalMeters,
                totalValue: totalMeters * pricePerMeter,
                combinations: combinations,
                cuttingCombinations: cuttingCombinations
            });
        });
    });
});

function optimizeCutting(totalMeters, pieceSizes) {
    const pieces = {};
    let remaining = totalMeters;
    let totalValue = 0;
    
    for (const size of pieceSizes) {
        const count = Math.floor(remaining / size);
        if (count > 0) {
            pieces[`${size}m`] = count;
            remaining -= count * size;
            totalValue += count * size;
        }
    }
    
    return {
        pieces,
        totalValue,
        waste: remaining
    };
}

function balancedCutting(totalMeters, pieceSizes) {
    const pieces = {};
    let remaining = totalMeters;
    let totalValue = 0;
    const targetCounts = {
        10: Math.floor(totalMeters * 0.3 / 10),
        5: Math.floor(totalMeters * 0.3 / 5),
        3: Math.floor(totalMeters * 0.2 / 3),
        1: Math.floor(totalMeters * 0.2 / 1)
    };
    
    for (const size of pieceSizes) {
        const maxPossible = Math.floor(remaining / size);
        const count = Math.min(targetCounts[size] || 0, maxPossible);
        if (count > 0) {
            pieces[`${size}m`] = count;
            remaining -= count * size;
            totalValue += count * size;
        }
    }
    
    if (remaining > 0) {
        pieces['1m'] = (pieces['1m'] || 0) + remaining;
        totalValue += remaining;
        remaining = 0;
    }
    
    return {
        pieces,
        totalValue,
        waste: remaining
    };
}

function maximizePieces(totalMeters, pieceSizes) {
    const pieces = {};
    let remaining = totalMeters;
    let totalValue = 0;
    
    for (const size of pieceSizes) {
        const count = Math.floor(remaining / size);
        if (count > 0) {
            pieces[`${size}m`] = count;
            remaining -= count * size;
            totalValue += count * size;
        }
    }
    
    return {
        pieces,
        totalValue,
        waste: remaining
    };
}

app.get('/api/cutting-reports', (req, res) => {
    const query = `
        SELECT f.*, 
               (SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                WHEN transaction_type = 'out' THEN -quantity 
                                ELSE 0 END) 
                FROM inventory_transactions 
                WHERE fabric_id = f.id) as current_quantity
        FROM fabrics f
        WHERE f.quantity > 0 OR (SELECT SUM(CASE WHEN transaction_type = 'in' THEN quantity 
                                            WHEN transaction_type = 'out' THEN -quantity 
                                            ELSE 0 END) 
                                 FROM inventory_transactions 
                                 WHERE fabric_id = f.id) > 0
        ORDER BY f.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const reports = rows.map(fabric => {
            const currentStock = fabric.current_quantity || fabric.quantity || 0;
            const pricePerMeter = fabric.price_per_unit;
            
            const bulkQuantities = [50, 100, 150, 200, 250, 500];
            const cuttingReports = [];
            
            bulkQuantities.forEach(bulkQty => {
                if (currentStock >= bulkQty) {
                    const combo = optimizeCutting(bulkQty, [10, 5, 3, 1]);
                    cuttingReports.push({
                        bulkQuantity: bulkQty,
                        pieces: combo.pieces,
                        totalValue: bulkQty * pricePerMeter,
                        waste: combo.waste,
                        efficiency: ((bulkQty - combo.waste) / bulkQty * 100).toFixed(1),
                        possible: true
                    });
                } else {
                    cuttingReports.push({
                        bulkQuantity: bulkQty,
                        pieces: null,
                        totalValue: null,
                        waste: null,
                        efficiency: null,
                        possible: false
                    });
                }
            });
            
            return {
                fabricId: fabric.id,
                fabricName: fabric.name,
                fabricType: fabric.type,
                color: fabric.color,
                currentStock: currentStock,
                pricePerMeter: pricePerMeter,
                cuttingReports: cuttingReports
            };
        });
        
        res.json(reports);
    });
});

// --- SALES ROUTES ---

app.get('/api/sales', (req, res) => {
    const salesQuery = `
        SELECT s.*, f.name as fabric_name, f.type as fabric_type, 'sale_record' as data_type
        FROM sales s
        LEFT JOIN fabrics f ON s.fabric_id = f.id
        ORDER BY s.created_at DESC
    `;
    const transactionsQuery = `
        SELECT 
            t.id,
            t.fabric_id,
            'Transaction Customer' as customer_name,
            '' as customer_email,
            '' as customer_phone,
            t.quantity,
            f.unit,
            t.unit_price,
            t.total_value as total_amount,
            t.date as sale_date,
            t.reference as invoice_number,
            t.payment_mode as payment_method,
            'paid' as payment_status,
            '' as delivery_address,
            t.transaction_source as notes,
            'completed' as status,
            t.date as created_at,
            t.date as updated_at,
            f.name as fabric_name,
            f.type as fabric_type,
            'transaction_sale' as data_type
        FROM inventory_transactions t
        LEFT JOIN fabrics f ON t.fabric_id = f.id
        WHERE t.transaction_type = 'out' AND t.transaction_source = 'E-commerce'
        ORDER BY t.date DESC
    `;
    
    db.all(salesQuery, [], (err, salesRows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        db.all(transactionsQuery, [], (err, transactionRows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const allSales = [...salesRows, ...transactionRows];
            allSales.sort((a, b) => {
                const dateA = new Date(a.sale_date || a.created_at);
                const dateB = new Date(b.sale_date || b.created_at);
                return dateB - dateA;
            });
            res.json(allSales);
        });
    });
});

app.post('/api/sales', (req, res) => {
    const {
        customer_name, customer_email, customer_phone,
        items, 
        total_amount, sale_date,
        payment_method, payment_status,
        delivery_address, notes, status
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "No items provided in sale" });
    }

    const dateObj = sale_date ? new Date(sale_date) : new Date();
    const dateStr = dateObj.toISOString().split('T')[0];
    const dateForInvoice = dateStr.replace(/-/g, '');

    const countQuery = `
        SELECT COUNT(DISTINCT invoice_number) as count 
        FROM sales 
        WHERE strftime('%Y-%m-%d', sale_date) = ?
    `;

    db.get(countQuery, [dateStr], (err, row) => {
        if (err) {
            console.error("Error generating invoice number:", err);
            return res.status(500).json({ error: "Database error generating invoice" });
        }

        const currentCount = row ? row.count : 0;
        const nextSequence = currentCount + 1;
        const sequenceStr = String(nextSequence).padStart(3, '0'); 
        const sharedInvoiceNumber = `INV-${dateForInvoice}-${sequenceStr}`;

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            let completed = 0;
            let hasError = false;

            const insertStmt = db.prepare(`
                INSERT INTO sales (
                    fabric_id, customer_name, customer_email, customer_phone,
                    quantity, unit, unit_price, total_amount, sale_date,
                    invoice_number, payment_method, payment_status,
                    delivery_address, notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const transactionStmt = db.prepare(`
                INSERT INTO inventory_transactions (
                    fabric_id, transaction_type, quantity, unit_price, total_value, 
                    reference, transaction_source, payment_mode
                ) VALUES (?, 'out', ?, ?, ?, ?, 'Sales', ?)
            `);

            items.forEach((item) => {
                insertStmt.run([
                    item.fabric_id, customer_name, customer_email || '', customer_phone || '',
                    item.quantity, 'mtr', item.rate, item.amount, sale_date,
                    sharedInvoiceNumber, payment_method || 'Cash', payment_status || 'Paid',
                    delivery_address, notes || '', status || 'completed'
                ], (err) => {
                    if (err) {
                        console.error("Sale Insert Error:", err);
                        hasError = true;
                    }
                });

                transactionStmt.run([
                    item.fabric_id, item.quantity, item.rate, item.amount,
                    sharedInvoiceNumber, payment_method || 'Cash'
                ], (err) => {
                    if (err) {
                        console.error("Transaction Error:", err);
                        hasError = true;
                    }
                    
                    completed++;
                    if (completed === items.length) {
                        if (hasError) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: "Failed to save sale items" });
                        } else {
                            db.run('COMMIT');
                            res.json({ message: "Sale saved successfully", invoice: sharedInvoiceNumber });
                        }
                    }
                });
            });

            insertStmt.finalize();
            transactionStmt.finalize();
        });
    });
});

app.put('/api/sales/:id', (req, res) => {
    const { id } = req.params;
    const {
        fabric_id, customer_name, customer_email, customer_phone,
        quantity, unit, unit_price, total_amount, sale_date,
        invoice_number, payment_method, payment_status,
        delivery_address, notes, status
    } = req.body;
    
    const query = `
        UPDATE sales SET
            fabric_id = ?, customer_name = ?, customer_email = ?, customer_phone = ?,
            quantity = ?, unit = ?, unit_price = ?, total_amount = ?, sale_date = ?,
            invoice_number = ?, payment_method = ?, payment_status = ?,
            delivery_address = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [
        fabric_id, customer_name, customer_email, customer_phone,
        quantity, unit, unit_price, total_amount, sale_date,
        invoice_number, payment_method, payment_status,
        delivery_address, notes, status, id
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Sale updated successfully' });
    });
});

app.delete('/api/sales/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM sales WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Sale deleted successfully' });
    });
});

// --- PURCHASES ROUTES ---

app.get('/api/purchases', (req, res) => {
    const query = `
        SELECT p.*, f.name as fabric_name
        FROM purchases p
        LEFT JOIN fabrics f ON p.fabric_id = f.id
        ORDER BY p.order_date DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// *** FIXED: Create Purchase & NEW Items correctly ***
app.post('/api/purchases', async (req, res) => {
    const { supplier_name, items, order_number, order_date, payment_terms, status } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items required' });
    }

    try {
        await dbRun('BEGIN TRANSACTION');
        const finalOrderNumber = order_number || `PO-${Date.now()}`;

        for (const item of items) {
            let finalFabricId = item.fabric_id;
            let fabricName = item.description || item.fabric_name;
            let fabricCode = item.product_code || `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // --- 1. HANDLE NEW ITEMS ---
            if (!finalFabricId && fabricName) {
                // Check duplicate by name or code
                const existing = await dbGet('SELECT id FROM fabrics WHERE product_code = ? OR name = ?', [fabricCode, fabricName]);
                
                if (existing) {
                    finalFabricId = existing.id;
                } else {
                    // Insert New Fabric
                    const createRes = await dbRun(
                        `INSERT INTO fabrics (name, product_code, type, quantity, unit, price_per_unit, mrp, selling_price, supplier, description, date_added)
                         VALUES (?, ?, 'General', 0, 'mtr', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [
                            fabricName, 
                            fabricCode, 
                            item.unit_price || 0, 
                            item.mrp || 0, 
                            item.selling_price || 0, 
                            supplier_name, 
                            `Added via Purchase PO#${finalOrderNumber}`
                        ]
                    );
                    finalFabricId = createRes.lastID;
                }
            } else if (finalFabricId) {
                // Update pricing for existing items
                await dbRun(
                    `UPDATE fabrics SET price_per_unit = ?, mrp = ?, selling_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`,
                    [item.unit_price || 0, item.mrp || 0, item.selling_price || 0, finalFabricId]
                );
            }

            if (!finalFabricId) throw new Error(`Could not process item: ${fabricName}`);

            // --- 2. INSERT PURCHASE ---
            await dbRun(`
                INSERT INTO purchases (
                    fabric_id, supplier_name, quantity, unit, unit_price, total_amount, 
                    order_date, order_number, payment_terms, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [finalFabricId, supplier_name, item.quantity, 'mtr', item.unit_price, (item.quantity * item.unit_price), order_date, finalOrderNumber, payment_terms, status]
            );

            // --- 3. UPDATE STOCK (Inventory Transaction) ---
            if (status === 'received') {
                await dbRun(`
                    INSERT INTO inventory_transactions (
                        fabric_id, transaction_type, quantity, unit_price, total_value, 
                        reference, transaction_source, payment_mode
                    ) VALUES (?, 'in', ?, ?, ?, ?, 'Purchase', 'Pending')`,
                    [finalFabricId, item.quantity, item.unit_price, (item.quantity * item.unit_price), finalOrderNumber]
                );
            }
        }

        await dbRun('COMMIT');
        res.json({ message: 'Purchase saved successfully', order_number: finalOrderNumber });

    } catch (err) {
        await dbRun('ROLLBACK');
        console.error("Purchase Error:", err);
        res.status(500).json({ error: "Failed to save purchase: " + err.message });
    }
});

app.put('/api/purchases/:id', (req, res) => {
    const { id } = req.params;
    const {
        fabric_id, supplier_name, supplier_email, supplier_phone,
        quantity, unit, unit_price, total_amount, order_date,
        expected_delivery_date, order_number, payment_terms,
        payment_status, delivery_address, notes, status
    } = req.body;
    
    const query = `
        UPDATE purchases SET
            fabric_id = ?, supplier_name = ?, supplier_email = ?, supplier_phone = ?,
            quantity = ?, unit = ?, unit_price = ?, total_amount = ?, order_date = ?,
            expected_delivery_date = ?, order_number = ?, payment_terms = ?,
            payment_status = ?, delivery_address = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, [
        fabric_id, supplier_name, supplier_email, supplier_phone,
        quantity, unit, unit_price, total_amount, order_date,
        expected_delivery_date, order_number, payment_terms,
        payment_status, delivery_address, notes, status, id
    ], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Purchase updated successfully' });
    });
});

app.delete('/api/purchases/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM purchases WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Purchase deleted successfully' });
    });
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});