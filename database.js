const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'turnier.db'));

db.exec(`
    -- ================================
    -- ORTE
    -- ================================
    CREATE TABLE IF NOT EXISTS orte (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        adresse     TEXT DEFAULT '',
        veranstalter_passwort TEXT DEFAULT ''
    );

    -- ================================
    -- TURNIERE
    -- ================================
    CREATE TABLE IF NOT EXISTS turniere (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        ort_id              INTEGER NOT NULL,
        altersgruppe        TEXT NOT NULL,
        datum               TEXT NOT NULL,
        startzeit           TEXT NOT NULL,
        spielzeit           INTEGER NOT NULL,
        wechselpause        INTEGER NOT NULL,
        turnierpause_nach   INTEGER DEFAULT 0,
        turnierpause_dauer  INTEGER DEFAULT 0,
        anzahl_teams        INTEGER NOT NULL,
        anzahl_gruppen      INTEGER NOT NULL DEFAULT 1,
        status              TEXT DEFAULT 'geplant',
        FOREIGN KEY (ort_id) REFERENCES orte(id)
    );

    -- ================================
    -- GRUPPEN
    -- ================================
    CREATE TABLE IF NOT EXISTS gruppen (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        turnier_id  INTEGER NOT NULL,
        name        TEXT NOT NULL,
        FOREIGN KEY (turnier_id) REFERENCES turniere(id)
    );

    -- ================================
    -- TEAMS
    -- ================================
    CREATE TABLE IF NOT EXISTS teams (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        gruppe_id   INTEGER NOT NULL,
        name        TEXT NOT NULL,
        staerke_rang INTEGER DEFAULT 0,
        FOREIGN KEY (gruppe_id) REFERENCES gruppen(id)
    );

    -- ================================
    -- SPIELE (Vorrunde)
    -- ================================
    CREATE TABLE IF NOT EXISTS spiele (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        gruppe_id       INTEGER NOT NULL,
        spiel_nr        INTEGER NOT NULL,
        uhrzeit         TEXT NOT NULL,
        team_links_id   INTEGER NOT NULL,
        team_rechts_id  INTEGER NOT NULL,
        tore_links      INTEGER DEFAULT NULL,
        tore_rechts     INTEGER DEFAULT NULL,
        FOREIGN KEY (gruppe_id)      REFERENCES gruppen(id),
        FOREIGN KEY (team_links_id)  REFERENCES teams(id),
        FOREIGN KEY (team_rechts_id) REFERENCES teams(id)
    );

    -- ================================
    -- FINALRUNDEN
    -- ================================
    CREATE TABLE IF NOT EXISTS finalrunden (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        turnier_id          INTEGER NOT NULL,
        datum               TEXT NOT NULL,
        startzeit           TEXT NOT NULL,
        spielzeit           INTEGER NOT NULL,
        wechselpause        INTEGER NOT NULL,
        turnierpause_nach   INTEGER DEFAULT 0,
        turnierpause_dauer  INTEGER DEFAULT 0,
        status              TEXT DEFAULT 'geplant',
        FOREIGN KEY (turnier_id) REFERENCES turniere(id)
    );

    -- ================================
    -- FINALSPIELE
    -- ================================
    CREATE TABLE IF NOT EXISTS finalspiele (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        finalrunde_id   INTEGER NOT NULL,
        spiel_nr        INTEGER NOT NULL,
        uhrzeit         TEXT NOT NULL,
        team_links_id   INTEGER NOT NULL,
        team_rechts_id  INTEGER NOT NULL,
        tore_links      INTEGER DEFAULT NULL,
        tore_rechts     INTEGER DEFAULT NULL,
        FOREIGN KEY (finalrunde_id)  REFERENCES finalrunden(id),
        FOREIGN KEY (team_links_id)  REFERENCES teams(id),
        FOREIGN KEY (team_rechts_id) REFERENCES teams(id)
    );

    -- ================================
    -- ARCHIV
    -- ================================
    CREATE TABLE IF NOT EXISTS archiv (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        turnier_id      INTEGER,
        ort_name        TEXT NOT NULL,
        altersgruppe    TEXT NOT NULL,
        datum           TEXT NOT NULL,
        turniersieger   TEXT DEFAULT '',
        daten_json      TEXT NOT NULL,
        archiviert_am   TEXT NOT NULL
    );

    -- ================================
    -- INDIZES (Geschwindigkeit)
    -- ================================
    CREATE INDEX IF NOT EXISTS idx_turniere_ort 
        ON turniere(ort_id);
    
    CREATE INDEX IF NOT EXISTS idx_gruppen_turnier 
        ON gruppen(turnier_id);
    
    CREATE INDEX IF NOT EXISTS idx_teams_gruppe 
        ON teams(gruppe_id);
    
    CREATE INDEX IF NOT EXISTS idx_spiele_gruppe 
        ON spiele(gruppe_id);
    
    CREATE INDEX IF NOT EXISTS idx_finalspiele_finalrunde 
        ON finalspiele(finalrunde_id);
    
    CREATE INDEX IF NOT EXISTS idx_archiv_datum 
        ON archiv(datum);
`);

console.log('✅ Datenbank bereit!');
module.exports = db;
