// routes/teams.js
const express = require('express');
const router = express.Router();
const db = require('../database.js');

// =============================================
// ALLE TEAMS EINER GRUPPE LADEN
// =============================================
router.get('/:gruppe_id', (req, res) => {
    try {
        const { gruppe_id } = req.params;

        const teams = db.prepare(`
            SELECT * FROM teams 
            WHERE gruppe_id = ?
            ORDER BY staerke_rang ASC
        `).all(gruppe_id);

        res.json(teams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// TEAM ERSTELLEN
// =============================================
router.post('/', (req, res) => {
    try {
        const { gruppe_id, name, staerke_rang } = req.body;

        if (!gruppe_id || !name) {
            return res.status(400).json({ fehler: 'gruppe_id und name sind Pflicht!' });
        }

        const result = db.prepare(`
            INSERT INTO teams (gruppe_id, name, staerke_rang) 
            VALUES (?, ?, ?)
        `).run(gruppe_id, name, staerke_rang || 0);

        res.status(201).json({ 
            id: result.lastInsertRowid,
            message: 'Team erstellt!' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// MEHRERE TEAMS AUF EINMAL ERSTELLEN
// =============================================
router.post('/bulk', (req, res) => {
    try {
        const { gruppe_id, teams } = req.body;

        if (!gruppe_id || !teams || teams.length === 0) {
            return res.status(400).json({ fehler: 'gruppe_id und teams sind Pflicht!' });
        }

        const stmt = db.prepare(`
            INSERT INTO teams (gruppe_id, name, staerke_rang) 
            VALUES (?, ?, ?)
        `);

        const ids = [];
        teams.forEach((team, index) => {
            const result = stmt.run(
                gruppe_id, 
                team.name, 
                team.staerke_rang || index + 1
            );
            ids.push(result.lastInsertRowid);
        });

        res.status(201).json({ 
            message: `${ids.length} Teams erstellt!`,
            ids 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// TEAM BEARBEITEN
// =============================================
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, staerke_rang } = req.body;

        db.prepare(`
            UPDATE teams 
            SET name = ?, staerke_rang = ?
            WHERE id = ?
        `).run(name, staerke_rang, id);

        res.json({ message: 'Team aktualisiert!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// TEAM LÖSCHEN
// =============================================
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Erst Spiele mit diesem Team löschen
        db.prepare(`
            DELETE FROM spiele 
            WHERE team_links_id = ? OR team_rechts_id = ?
        `).run(id, id);

        db.prepare(`
            DELETE FROM teams WHERE id = ?
        `).run(id);

        res.json({ message: 'Team gelöscht!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

module.exports = router;
