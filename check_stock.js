const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('fabric_inventory.db');

db.all('SELECT f.id, f.name, f.quantity, (SELECT SUM(CASE WHEN transaction_type = "in" THEN quantity WHEN transaction_type = "out" THEN -quantity ELSE 0 END) FROM inventory_transactions WHERE fabric_id = f.id) as current_quantity FROM fabrics f ORDER BY f.name', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Fabric Stock Status:');
  rows.forEach(row => {
    console.log(`ID: ${row.id}, Name: ${row.name}, Base Quantity: ${row.quantity}, Current Quantity: ${row.current_quantity}`);
  });
  db.close();
});
