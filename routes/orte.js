// routes/orte.js
const express = require('express');
const router  = express.Router();
const db      = require('../database.js');

// Alle Orte laden
router.get('/', (req, res) => {
    try {
        const orte = db.prepare(`
            SELECT * FROM orte ORDER BY name
        `).all();
        res.json(orte);
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Neuen Ort erstellen
router.post('/', (req, res) => {
    try {
        const { name, adresse } = req.body;
        if (!name) return res.status(400).json({ fehler: 'Name ist Pflicht!' });
        
        const result = db.prepare(`
            INSERT INTO orte (name, adresse) VALUES (?, ?)
        `).run(name, adresse || '');
        
        res.status(201).json({ 
            id: result.lastInsertRowid, 
            message: 'Ort erstellt!' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// Ort löschen
router.delete('/:id', (req, res) => {
    try {
        // ✅ Erst prüfen ob Ort noch verwendet wird
        const turniere = db.prepare(`
            SELECT COUNT(*) as anzahl FROM turniere WHERE ort_id = ?
        `).get(req.params.id);

        if (turniere.anzahl > 0) {
            return res.status(400).json({ 
                fehler: `Ort kann nicht gelöscht werden!\nEr wird noch von ${turniere.anzahl} Turnier(en) verwendet.` 
            });
        }

        db.prepare(`DELETE FROM orte WHERE id = ?`).run(req.params.id);
        res.json({ message: 'Ort gelöscht!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

module.exports = router;
