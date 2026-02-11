const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./fabric_inventory.db');

console.log('Creating initial transactions for existing fabrics...');

// First, get all fabrics
db.all('SELECT * FROM fabrics', (err, fabrics) => {
  if (err) {
    console.error('Error fetching fabrics:', err);
    db.close();
    return;
  }

  console.log(`Found ${fabrics.length} fabrics. Creating initial transactions...`);

  let completed = 0;
  
  fabrics.forEach(fabric => {
    // Check if transaction already exists for this fabric
    db.get(
      'SELECT id FROM inventory_transactions WHERE fabric_id = ? LIMIT 1',
      [fabric.id],
      (err, existingTransaction) => {
        if (err) {
          console.error(`Error checking transaction for fabric ${fabric.id}:`, err);
        } else if (!existingTransaction) {
          // Create initial transaction
          const totalValue = fabric.quantity * fabric.price_per_unit;
          const transactionQuery = `
            INSERT INTO inventory_transactions 
            (fabric_id, transaction_type, quantity, unit_price, total_value, transaction_source, payment_mode)
            VALUES (?, 'in', ?, ?, ?, ?, ?)
          `;
          
          db.run(transactionQuery, [
            fabric.id, 
            fabric.quantity, 
            fabric.price_per_unit, 
            totalValue,
            'Initial Stock',
            'Not Applicable'
          ], function(err) {
            if (err) {
              console.error(`Error creating transaction for fabric ${fabric.id}:`, err);
            } else {
              console.log(`Created initial transaction for fabric: ${fabric.name} (ID: ${fabric.id})`);
            }
            
            completed++;
            if (completed === fabrics.length) {
              console.log('\nTransaction creation completed!');
              db.close();
            }
          });
        } else {
          console.log(`Transaction already exists for fabric: ${fabric.name} (ID: ${fabric.id})`);
          completed++;
          if (completed === fabrics.length) {
            console.log('\nTransaction creation completed!');
            db.close();
          }
        }
      }
    );
  });
});
