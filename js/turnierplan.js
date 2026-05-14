// =============================================
// DATENMODELL
// =============================================

let teams = [];
let spiele = [];

// =============================================
// HILFSFUNKTIONEN ZEIT
// =============================================

function zeitZuMinuten(zeit) {
    const [h, m] = zeit.split(':').map(Number);
    return h * 60 + m;
}

function minutenZuZeit(minuten) {
    const h = Math.floor(minuten / 60);
    const m = minuten % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getTeamName(id) {
    const team = teams.find(t => t.id === id);
    return team ? team.name : id;
}

// =============================================
// SEITEN-AUSGLEICH
// =============================================

function ausgleichSeiten(rundenSpiele) {
    const linksCount  = {};
    const rechtsCount = {};

    teams.forEach(t => {
        linksCount[t.id]  = 0;
        rechtsCount[t.id] = 0;
    });

    return rundenSpiele.map(runde => {
        return runde.map(paarung => {
            const { heim, gast } = paarung;
            const heimLinks = linksCount[heim]  - rechtsCount[heim];
            const gastLinks = linksCount[gast]  - rechtsCount[gast];

            let links, rechts;
            if (heimLinks > gastLinks) {
                links = gast; rechts = heim;
            } else {
                links = heim; rechts = gast;
            }

            linksCount[links]++;
            rechtsCount[rechts]++;
            return { heim: links, gast: rechts };
        });
    });
}

// =============================================
// SPIELPLAN GENERIEREN
// =============================================

window.generiereSpielplan = function() {
    const inputs = document.querySelectorAll('.team-input');
    teams = [];

    inputs.forEach((input, index) => {
        const name = input.value.trim();
        if (name !== '') {
            teams.push({ 
                id: String.fromCharCode(65 + index), 
                name: name 
            });
        }
    });

    if (teams.length < 2) {
        alert('Bitte mindestens 2 Teams eingeben!');
        return;
    }

    const startzeit    = document.getElementById('startzeit').value;
    const spielzeit    = parseInt(document.getElementById('spielzeit').value);
    const wechselpause = parseInt(document.getElementById('wechselpause').value);
    const pauseNach    = parseInt(document.getElementById('pause-nach-spiel').value);
    const pausendauer  = parseInt(document.getElementById('pausendauer').value);

    // ROUND-ROBIN (BERGER ALGORITHMUS)
    let teamIds = teams.map(t => t.id);
    const ungerade = teamIds.length % 2 !== 0;
    if (ungerade) teamIds.push('FREI');

    const anzahlRunden   = teamIds.length - 1;
    const spieleProRunde = teamIds.length / 2;
    const rundenSpiele   = [];
    const ids = [...teamIds];

    for (let runde = 0; runde < anzahlRunden; runde++) {
        const dieseRunde = [];
        for (let i = 0; i < spieleProRunde; i++) {
            const heim = ids[i];
            const gast = ids[ids.length - 1 - i];
            if (heim !== 'FREI' && gast !== 'FREI') {
                dieseRunde.push({ heim, gast });
            }
        }
        rundenSpiele.push(dieseRunde);
        const letztes = ids.pop();
        ids.splice(1, 0, letztes);
    }

    const ausgeglicheneRunden = ausgleichSeiten(rundenSpiele);

    let spielNr = 1;
    let aktuelleZeit = zeitZuMinuten(startzeit);
    spiele = [];

    ausgeglicheneRunden.forEach(runde => {
        runde.forEach(paarung => {
            spiele.push({
                nr:       spielNr++,
                heim:     paarung.heim,
                gast:     paarung.gast,
                zeit:     minutenZuZeit(aktuelleZeit),
                toreHeim: null,
                toreGast: null
            });

            aktuelleZeit += spielzeit + wechselpause;

            if (pauseNach > 0 && (spielNr - 1) === pauseNach) {
                aktuelleZeit += pausendauer;
            }
        });
    });

    zeigeSpiele();
    zeigeTabelle();
};

// =============================================
// RESET
// =============================================

window.resetErgebnisse = function() {
    spiele.forEach(s => {
        s.toreHeim = null;
        s.toreGast = null;
    });
    zeigeSpiele();
    zeigeTabelle();
};

// =============================================
// SPIELFREI BERECHNEN
// =============================================

function berechneSpielfreiMap() {
    const spielfreiNachSpiel = {};
    let teamIds = teams.map(t => t.id);
    const ungerade = teamIds.length % 2 !== 0;
    if (!ungerade) return spielfreiNachSpiel;

    const ids = [...teamIds, 'FREI'];
    const anzahlRunden   = ids.length - 1;
    const spieleProRunde = ids.length / 2;
    let spielNr = 0;

    for (let runde = 0; runde < anzahlRunden; runde++) {
        let spielfreiTeamId = null;
        for (let i = 0; i < spieleProRunde; i++) {
            const heim = ids[i];
            const gast = ids[ids.length - 1 - i];
            if (heim === 'FREI') spielfreiTeamId = gast;
            else if (gast === 'FREI') spielfreiTeamId = heim;
            else spielNr++;
        }
        if (spielfreiTeamId) {
            spielfreiNachSpiel[spielNr] = getTeamName(spielfreiTeamId);
        }
        const letztes = ids.pop();
        ids.splice(1, 0, letztes);
    }

    return spielfreiNachSpiel;
}

// =============================================
// SPIELE ANZEIGEN
// =============================================

function zeigeSpiele() {
    const container = document.getElementById('spielplan');
    if (!container) return;
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'spielplan-header';
    header.innerHTML = `
        <span class="col-nr">Spiel</span>
        <span class="col-beginn">Beginn</span>
        <span class="col-team-links">Team Links</span>
        <span class="col-tore-links">Tore</span>
        <span class="col-doppelpunkt">:</span>
        <span class="col-tore-rechts">Tore</span>
        <span class="col-team-rechts">Team Rechts</span>
    `;
    container.appendChild(header);

    const spielfreiNachSpiel = berechneSpielfreiMap();

    spiele.forEach((spiel, index) => {
        const zeile = document.createElement('div');
        zeile.className = 'spiel-zeile' + (index % 2 !== 0 ? ' spiel-zeile-alt' : '');
        zeile.innerHTML = `
            <span class="col-nr">${spiel.nr}.Sp</span>
            <span class="col-beginn">${spiel.zeit}</span>
            <span class="col-team-links">${getTeamName(spiel.heim)}</span>
            <span class="col-tore-links">
                <input type="number" class="ergebnis-input"
                    value="${spiel.toreHeim ?? ''}"
                    placeholder="-"
                    onchange="aktualisiereSpiel(${spiel.nr}, this.value, null)">
            </span>
            <span class="col-doppelpunkt">:</span>
            <span class="col-tore-rechts">
                <input type="number" class="ergebnis-input"
                    value="${spiel.toreGast ?? ''}"
                    placeholder="-"
                    onchange="aktualisiereSpiel(${spiel.nr}, null, this.value)">
            </span>
            <span class="col-team-rechts">${getTeamName(spiel.gast)}</span>
        `;
        container.appendChild(zeile);

        if (spielfreiNachSpiel[spiel.nr]) {
            const sf = document.createElement('div');
            sf.className = 'spielfrei-zeile';
            sf.innerHTML = `🟡 Spielfrei: <strong>${spielfreiNachSpiel[spiel.nr]}</strong>`;
            container.appendChild(sf);
        }
    });
}

// =============================================
// ERGEBNIS AKTUALISIEREN
// =============================================

window.aktualisiereSpiel = function(nr, toreHeim, toreGast) {
    const spiel = spiele.find(s => s.nr === nr);
    if (!spiel) return;

    if (toreHeim !== null) 
        spiel.toreHeim = toreHeim === '' ? null : parseInt(toreHeim);
    if (toreGast !== null)  
        spiel.toreGast = toreGast === '' ? null : parseInt(toreGast);

    zeigeTabelle();
};

// =============================================
// TABELLE BERECHNEN
// =============================================

function berechneTabelle() {
    const tabelle = {};

    teams.forEach(team => {
        tabelle[team.id] = {
            id: team.id, name: team.name,
            spiele: 0, punkte: 0,
            toreF: 0, toreG: 0, diff: 0
        };
    });

    spiele.forEach(spiel => {
        if (spiel.toreHeim === null || spiel.toreGast === null) return;
        const heim = tabelle[spiel.heim];
        const gast = tabelle[spiel.gast];
        if (!heim || !gast) return;

        heim.spiele++; gast.spiele++;
        heim.toreF += spiel.toreHeim;
        heim.toreG += spiel.toreGast;
        gast.toreF += spiel.toreGast;
        gast.toreG += spiel.toreHeim;

        if (spiel.toreHeim > spiel.toreGast) {
            heim.punkte += 2;
        } else if (spiel.toreHeim < spiel.toreGast) {
            gast.punkte += 2;
        } else {
            heim.punkte += 1;
            gast.punkte += 1;
        }
    });

    Object.values(tabelle).forEach(t => { t.diff = t.toreF - t.toreG; });

    return Object.values(tabelle).sort((a, b) => {
        if (b.punkte !== a.punkte) return b.punkte - a.punkte;
        if (b.diff   !== a.diff)   return b.diff   - a.diff;
        if (b.toreF  !== a.toreF)  return b.toreF  - a.toreF;
        return 0;
    });
}

// =============================================
// TABELLE ANZEIGEN
// =============================================

function zeigeTabelle() {
    const container = document.getElementById('tabelle');
    if (!container) return;
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'tabelle-header';
    header.innerHTML = `
        <span class="tab-platz">Pl.</span>
        <span class="tab-name">Team</span>
        <span class="tab-spiele">Sp</span>
        <span class="tab-punkte">Pkt</span>
        <span class="tab-tore">Tore</span>
        <span class="tab-diff">Diff</span>
    `;
    container.appendChild(header);

    berechneTabelle().forEach((team, index) => {
        const zeile = document.createElement('div');
        zeile.className = index % 2 === 0 ? 'tabelle-zeile' : 'tabelle-zeile-alt';

        const platzKlasse = index === 0 ? ' platz-1' :
                            index === 1 ? ' platz-2' :
                            index === 2 ? ' platz-3' : '';

        zeile.innerHTML = `
            <span class="tab-platz${platzKlasse}">${index + 1}.</span>
            <span class="tab-name">${team.name}</span>
            <span class="tab-spiele">${team.spiele}</span>
            <span class="tab-punkte"><strong>${team.punkte}</strong></span>
            <span class="tab-tore">${team.toreF}:${team.toreG}</span>
            <span class="tab-diff">${team.diff > 0 ? '+' : ''}${team.diff}</span>
        `;
        container.appendChild(zeile);
    });
}
