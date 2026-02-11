const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./fabric_inventory.db');

// Update existing transactions with sample data
db.run('UPDATE inventory_transactions SET transaction_source = "Amazon", payment_mode = "GPay" WHERE id = 1', (err) => {
  if (err) {
    console.error('Error updating transaction 1:', err);
  } else {
    console.log('Updated transaction 1: Amazon - GPay');
  }
});

db.run('UPDATE inventory_transactions SET transaction_source = "Meesho", payment_mode = "PhonePe" WHERE id = 2', (err) => {
  if (err) {
    console.error('Error updating transaction 2:', err);
  } else {
    console.log('Updated transaction 2: Meesho - PhonePe');
  }
});

// Add a few more sample transactions
const sampleTransactions = [
  {
    fabric_id: 3,
    transaction_type: 'in',
    quantity: 50,
    unit_price: 150,
    total_value: 7500,
    transaction_source: 'Own Website',
    payment_mode: 'Bank Transfer'
  },
  {
    fabric_id: 4,
    transaction_type: 'in',
    quantity: 75,
    unit_price: 300,
    total_value: 22500,
    transaction_source: 'IndiaMart',
    payment_mode: 'Cash'
  },
  {
    fabric_id: 5,
    transaction_type: 'in',
    quantity: 200,
    unit_price: 80,
    total_value: 16000,
    transaction_source: 'Flipkart',
    payment_mode: 'Paytm'
  }
];

sampleTransactions.forEach((transaction, index) => {
  const query = `INSERT INTO inventory_transactions (fabric_id, transaction_type, quantity, unit_price, total_value, transaction_source, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [
    transaction.fabric_id,
    transaction.transaction_type,
    transaction.quantity,
    transaction.unit_price,
    transaction.total_value,
    transaction.transaction_source,
    transaction.payment_mode
  ], function(err) {
    if (err) {
      console.error(`Error inserting transaction ${index + 3}:`, err);
    } else {
      console.log(`Inserted transaction ${this.lastID}: ${transaction.transaction_source} - ${transaction.payment_mode}`);
    }
  });
});

setTimeout(() => {
  console.log('Database update completed!');
  db.close();
}, 1000);
