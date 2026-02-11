const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./fabric_inventory.db');

db.all('SELECT * FROM inventory_transactions', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('All transactions:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Fabric: ${row.fabric_id}, Source: ${row.transaction_source}, Payment: ${row.payment_mode}`);
    });
  }
  db.close();
});
