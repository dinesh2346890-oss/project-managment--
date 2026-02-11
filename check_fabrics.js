const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./fabric_inventory.db');

db.all('SELECT * FROM fabrics', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('All fabrics:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}`);
    });
  }
  db.close();
});
