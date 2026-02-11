const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./fabric_inventory.db');

console.log('Updating existing transactions with realistic values...');

// Sample realistic data for the existing fabrics
const fabricUpdates = [
  { id: 45, name: 'Cotton White', source: 'Offline Store', payment: 'Cash' },
  { id: 46, name: 'Velvet Black', source: 'IndiaMart', payment: 'Bank Transfer' },
  { id: 47, name: 'Linen Blue', source: 'Amazon', payment: 'GPay' },
  { id: 48, name: 'Wool Gray', source: 'Meesho', payment: 'PhonePe' },
  { id: 49, name: 'Polyester Green', source: 'Own Website', payment: 'UPI' },
  { id: 50, name: 'Silk Red', source: 'Offline Store', payment: 'Cash' }
];

let completed = 0;

fabricUpdates.forEach(fabric => {
  const updateQuery = `
    UPDATE inventory_transactions 
    SET transaction_source = ?, payment_mode = ?
    WHERE fabric_id = ? AND transaction_type = 'in'
  `;
  
  db.run(updateQuery, [fabric.source, fabric.payment, fabric.id], function(err) {
    if (err) {
      console.error(`Error updating fabric ${fabric.name}:`, err);
    } else {
      console.log(`Updated ${fabric.name}: Source = ${fabric.source}, Payment = ${fabric.payment}`);
    }
    
    completed++;
    if (completed === fabricUpdates.length) {
      console.log('\nAll transactions updated successfully!');
      
      // Verify the updates
      db.all('SELECT it.id, it.fabric_id, f.name, it.transaction_source, it.payment_mode FROM inventory_transactions it LEFT JOIN fabrics f ON it.fabric_id = f.id ORDER BY it.id', (err, rows) => {
        if (err) {
          console.error('Error verifying updates:', err);
        } else {
          console.log('\nUpdated transactions:');
          rows.forEach(row => {
            console.log(`ID: ${row.id}, Fabric: ${row.name}, Source: ${row.transaction_source}, Payment: ${row.payment_mode}`);
          });
        }
        db.close();
      });
    }
  });
});
