const express = require('express');
const router = express.Router();
const db = require('../database');
const { generiereSpielplan } = require('../spielplan-generator');

// =============================================
// SPIELPLAN GENERIEREN & SPEICHERN
// =============================================
router.post('/generieren', (req, res) => {
    const { gruppe_id } = req.body;

    if (!gruppe_id) {
        return res.status(400).json({ fehler: 'gruppe_id fehlt!' });
    }

    // 1. Turnier-Konfiguration laden
    const turnier = db.prepare(`
        SELECT t.* FROM turniere t
        JOIN gruppen g ON g.turnier_id = t.id
        WHERE g.id = ?
    `).get(gruppe_id);

    if (!turnier) {
        return res.status(404).json({ fehler: 'Turnier nicht gefunden!' });
    }

    // 2. Teams der Gruppe laden
    const teams = db.prepare(`
        SELECT * FROM teams WHERE gruppe_id = ?
        ORDER BY staerke_rang ASC
    `).all(gruppe_id);

    if (teams.length < 2) {
        return res.status(400).json({ fehler: 'Mindestens 2 Teams nötig!' });
    }

    // 3. Spielplan generieren
    const config = {
        startzeit:          turnier.startzeit,
        spielzeit:          turnier.spielzeit,
        wechselpause:       turnier.wechselpause,
        turnierpause_nach:  turnier.turnierpause_nach,
        turnierpause_dauer: turnier.turnierpause_dauer
    };

    const spiele = generiereSpielplan(teams.map(t => t.id), config);

    // 4. Alte Spiele löschen
    db.prepare(`DELETE FROM spiele WHERE gruppe_id = ?`).run(gruppe_id);

    // 5. Neue Spiele speichern
    const stmt = db.prepare(`
        INSERT INTO spiele (gruppe_id, spiel_nr, uhrzeit, team_links_id, team_rechts_id)
        VALUES (?, ?, ?, ?, ?)
    `);

    spiele.forEach(spiel => {
        stmt.run(gruppe_id, spiel.spiel_nr, spiel.uhrzeit, spiel.team_links, spiel.team_rechts);
    });

    res.json({ erfolg: true, anzahl: spiele.length, spiele });
});

// =============================================
// SPIELPLAN LADEN
// =============================================
router.get('/:gruppe_id', (req, res) => {
    const { gruppe_id } = req.params;

    const spiele = db.prepare(`
        SELECT 
            s.id,
            s.spiel_nr,
            s.uhrzeit,
            s.tore_links,
            s.tore_rechts,
            tl.name AS team_links,
            tr.name AS team_rechts
        FROM spiele s
        JOIN teams tl ON tl.id = s.team_links_id
        JOIN teams tr ON tr.id = s.team_rechts_id
        WHERE s.gruppe_id = ?
        ORDER BY s.spiel_nr ASC
    `).all(gruppe_id);

    res.json(spiele);
});

// =============================================
// ERGEBNIS EINTRAGEN (BUGFIX: war falsche Route)
// =============================================
router.post('/ergebnis', (req, res) => {
    const { spiel_id, tore_links, tore_rechts } = req.body;
    
    if (spiel_id === undefined || tore_links === undefined || tore_rechts === undefined) {
        return res.status(400).json({ fehler: 'Fehlende Daten!' });
    }

    db.prepare(`
        UPDATE spiele 
        SET tore_links = ?, tore_rechts = ?
        WHERE id = ?
    `).run(tore_links, tore_rechts, spiel_id);

    res.json({ erfolg: true });
});

module.exports = router;
