// routes/final.js
const express = require('express');
const router = express.Router();
const db = require('../database.js');

// =============================================
// FINALRUNDE LADEN
// =============================================
router.get('/:turnier_id', (req, res) => {
    try {
        const { turnier_id } = req.params;

        const finalrunde = db.prepare(`
            SELECT * FROM finalrunden 
            WHERE turnier_id = ?
        `).get(turnier_id);

        if (!finalrunde) {
            return res.status(404).json({ fehler: 'Keine Finalrunde gefunden' });
        }

        // Finalspiele dazu laden
        const spiele = db.prepare(`
            SELECT 
                fs.*,
                t1.name AS team_links_name,
                t2.name AS team_rechts_name
            FROM finalspiele fs
            LEFT JOIN teams t1 ON fs.team_links_id  = t1.id
            LEFT JOIN teams t2 ON fs.team_rechts_id = t2.id
            WHERE fs.finalrunde_id = ?
            ORDER BY fs.spiel_nr ASC
        `).all(finalrunde.id);

        res.json({ 
            ...finalrunde, 
            spiele 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// FINALRUNDE ERSTELLEN
// =============================================
router.post('/', (req, res) => {
    try {
        const { 
            turnier_id, 
            datum, 
            startzeit, 
            spielzeit, 
            wechselpause,
            turnierpause_nach,
            turnierpause_dauer
        } = req.body;

        // Pflichtfelder prüfen
        if (!turnier_id || !datum || !startzeit || !spielzeit || !wechselpause) {
            return res.status(400).json({ 
                fehler: 'turnier_id, datum, startzeit, spielzeit, wechselpause sind Pflicht!' 
            });
        }

        const result = db.prepare(`
            INSERT INTO finalrunden 
                (turnier_id, datum, startzeit, spielzeit, wechselpause, 
                 turnierpause_nach, turnierpause_dauer)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            turnier_id, datum, startzeit, spielzeit, wechselpause,
            turnierpause_nach || 0, turnierpause_dauer || 0
        );

        res.status(201).json({ 
            id: result.lastInsertRowid,
            message: 'Finalrunde erstellt!' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// FINALSPIEL ERGEBNIS EINTRAGEN
// =============================================
router.put('/ergebnis/:spiel_id', (req, res) => {
    try {
        const { spiel_id } = req.params;
        const { tore_links, tore_rechts } = req.body;

        if (tore_links === undefined || tore_rechts === undefined) {
            return res.status(400).json({ fehler: 'tore_links und tore_rechts sind Pflicht!' });
        }

        db.prepare(`
            UPDATE finalspiele 
            SET tore_links = ?, tore_rechts = ?
            WHERE id = ?
        `).run(tore_links, tore_rechts, spiel_id);

        res.json({ message: 'Ergebnis gespeichert!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

// =============================================
// FINALRUNDE LÖSCHEN
// =============================================
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Erst Finalspiele löschen
        db.prepare(`
            DELETE FROM finalspiele WHERE finalrunde_id = ?
        `).run(id);

        // Dann Finalrunde löschen
        db.prepare(`
            DELETE FROM finalrunden WHERE id = ?
        `).run(id);

        res.json({ message: 'Finalrunde gelöscht!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ fehler: 'Datenbankfehler' });
    }
});

module.exports = router;
