// ============================================
// server.js
// ============================================
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./database.js');  // ← database.js verwenden!

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// ROUTES EINBINDEN
// ============================================
const orteRoutes     = require('./routes/orte.js');
const turniereRoutes = require('./routes/turniere.js');
const spielplanRoutes = require('./routes/spielplan.js');
const gruppenRoutes = require('./routes/gruppen.js');
const teamsRoutes = require('./routes/teams.js');
const finalRoutes = require('./routes/final.js');
const ergebnisseRoutes = require('./routes/ergebnisse.js');

app.use('/api/orte',     orteRoutes);
app.use('/api/turniere', turniereRoutes);
app.use('/api/spielplan', spielplanRoutes);
app.use('/api/gruppen', gruppenRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/final', finalRoutes);
app.use('/api/ergebnisse', ergebnisseRoutes);


// ============================================
// SERVER STARTEN
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ⚽ ================================
       Turnier-App läuft!
       http://localhost:${PORT}
    ================================
    `);
});
