// routes/gruppen.js
const express = require('express');
const router = express.Router();
const db = require('../database.js');

// Alle Gruppen einer Gruppe laden
router.get('/:id/teams', (req, res) => {
    try {
        const teams = db.prepare(`
            SELECT * FROM teams WHERE gruppe_id = ?
        `).all(req.params.id);

        res.json(teams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// ✅ NEU: Spiele einer Gruppe laden
router.get('/:id/spiele', (req, res) => {
    try {
        const spiele = db.prepare(`
            SELECT 
                sp.*,
                ht.name as heim_name,
                gt.name as gast_name
            FROM spiele sp
            JOIN teams ht ON sp.team_links_id = ht.id
            JOIN teams gt ON sp.team_rechts_id = gt.id
            WHERE sp.gruppe_id = ?
            ORDER BY sp.runde, sp.id
        `).all(req.params.id);

        res.json(spiele);
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Team zu Gruppe hinzufügen
router.post('/:id/teams', (req, res) => {
    try {
        const { name } = req.body;
        const gruppe_id = req.params.id;

        if (!name) return res.status(400).json({ fehler: 'Name fehlt' });

        const result = db.prepare(`
            INSERT INTO teams (gruppe_id, name) VALUES (?, ?)
        `).run(gruppe_id, name);

        res.status(201).json({ id: result.lastInsertRowid, name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Team löschen
router.delete('/:gruppeId/teams/:teamId', (req, res) => {
    try {
        db.prepare(`DELETE FROM teams WHERE id = ?`).run(req.params.teamId);
        res.json({ message: 'Team gelöscht' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Gruppe löschen
router.delete('/:id', (req, res) => {
    try {
        db.prepare(`DELETE FROM spiele WHERE gruppe_id = ?`).run(req.params.id);
        db.prepare(`DELETE FROM teams WHERE gruppe_id = ?`).run(req.params.id);
        db.prepare(`DELETE FROM gruppen WHERE id = ?`).run(req.params.id);
        res.json({ message: 'Gruppe gelöscht' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// ✅ NEU: Spielplan generieren
router.post('/:id/spielplan', (req, res) => {
    try {
        const gruppeId = req.params.id;
        const { paarungen } = req.body;

        if (!paarungen || paarungen.length === 0) {
            return res.status(400).json({ fehler: 'Keine Paarungen übergeben' });
        }

        // Alten Spielplan löschen
        db.prepare(`DELETE FROM spiele WHERE gruppe_id = ?`).run(gruppeId);

        // Neue Spiele einfügen
        const stmt = db.prepare(`
            INSERT INTO spiele (gruppe_id, team_links_id, team_rechts_id, runde)
            VALUES (?, ?, ?, ?)
        `);

        for (const p of paarungen) {
            stmt.run(gruppeId, p.team_links_id, p.team_rechts_id, p.runde);
        }

        res.status(201).json({ 
            message: 'Spielplan erstellt',
            anzahl: paarungen.length 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});


module.exports = router;
