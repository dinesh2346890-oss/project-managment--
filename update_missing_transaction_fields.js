const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./fabric_inventory.db');

console.log('Updating existing transactions with default values...');

// Update transactions that have NULL values for transaction_source or payment_mode
const updateQuery = `
  UPDATE inventory_transactions 
  SET transaction_source = COALESCE(transaction_source, 'Initial Stock'),
      payment_mode = COALESCE(payment_mode, 'Not Applicable')
  WHERE transaction_source IS NULL OR payment_mode IS NULL
`;

db.run(updateQuery, function(err) {
  if (err) {
    console.error('Error updating transactions:', err);
  } else {
    console.log(`Updated ${this.changes} transactions with default values.`);
    
    // Verify the updates
    db.all('SELECT id, fabric_id, transaction_source, payment_mode FROM inventory_transactions', (err, rows) => {
      if (err) {
        console.error('Error verifying updates:', err);
      } else {
        console.log('\nAll transactions after update:');
        rows.forEach(row => {
          console.log(`ID: ${row.id}, Fabric: ${row.fabric_id}, Source: ${row.transaction_source}, Payment: ${row.payment_mode}`);
        });
      }
      db.close();
    });
  }
});
