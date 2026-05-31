// routes/turniere.js
const express = require('express');
const router = express.Router();
const db = require('../database.js');

// Alle Turniere laden
router.get('/', (req, res) => {
    try {
        const turniere = db.prepare(`
            SELECT t.*, o.name as ort_name 
            FROM turniere t
            LEFT JOIN orte o ON t.ort_id = o.id
        `).all();
        res.json(turniere);
    } catch (err) {
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Turnier erstellen
router.post('/', (req, res) => {
    try {
        const { 
            ort_id, 
            altersgruppe,
            datum, 
            startzeit, 
            spielzeit,
            wechselpause,
            turnierpause_nach,
            turnierpause_dauer,
            anzahl_teams,
            anzahl_gruppen
        } = req.body;

        const result = db.prepare(`
            INSERT INTO turniere 
            (ort_id, altersgruppe, datum, startzeit, spielzeit, wechselpause, turnierpause_nach, turnierpause_dauer, anzahl_teams, anzahl_gruppen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(ort_id, altersgruppe, datum, startzeit, spielzeit, wechselpause, turnierpause_nach, turnierpause_dauer, anzahl_teams, anzahl_gruppen);

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: err.message });
    }
});

// Turnier löschen
router.delete('/:id', (req, res) => {
    try {
        const id = req.params.id;

        db.prepare(`DELETE FROM spiele WHERE gruppe_id IN (SELECT id FROM gruppen WHERE turnier_id = ?)`).run(id);
        db.prepare(`DELETE FROM teams WHERE gruppe_id IN (SELECT id FROM gruppen WHERE turnier_id = ?)`).run(id);
        db.prepare(`DELETE FROM gruppen WHERE turnier_id = ?`).run(id);
        db.prepare(`DELETE FROM turniere WHERE id = ?`).run(id);

        res.json({ message: 'Turnier gelöscht!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Gruppen eines Turniers laden  ← VOR /:id !
router.get('/:id/gruppen', (req, res) => {
    try {
        const gruppen = db.prepare(`
            SELECT * FROM gruppen WHERE turnier_id = ?
        `).all(req.params.id);

        res.json(gruppen);
    } catch (err) {
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Gruppen für Turnier speichern
router.post('/:id/gruppen', (req, res) => {
    try {
        const turnier_id = req.params.id;
        const { name } = req.body; // ✅ einzelne Gruppe

        if (!name) {
            return res.status(400).json({ fehler: 'Name fehlt' });
        }

        // Alte Gruppen NICHT mehr löschen - jede Gruppe einzeln hinzufügen!
        const result = db.prepare(`
            INSERT INTO gruppen (turnier_id, name) VALUES (?, ?)
        `).run(turnier_id, name);

        res.json({ id: result.lastInsertRowid, name });

    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});



// Ein Turnier laden  ← NACH /:id/gruppen !
router.get('/:id', (req, res) => {
    try {
        const turnier = db.prepare(`
            SELECT t.*, o.name as ort_name 
            FROM turniere t
            LEFT JOIN orte o ON t.ort_id = o.id
            WHERE t.id = ?
        `).get(req.params.id);

        if (!turnier) return res.status(404).json({ fehler: 'Turnier nicht gefunden' });
        res.json(turnier);
    } catch (err) {
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

module.exports = router;
