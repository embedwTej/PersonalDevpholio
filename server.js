const app = require('./api/index');
const path = require('path');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  PORTFOLIO SYSTEM ENGINE ONLINE (LOCAL)               `);
    console.log(`  Access Local Interface: http://localhost:${PORT}      `);
    console.log(`  Database File Path: ${path.join(__dirname, 'messages.json')}                 `);
    console.log(`=======================================================`);
});
