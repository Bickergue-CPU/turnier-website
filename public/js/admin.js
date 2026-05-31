// ============================================
// ADMIN.JS - Komplett neu
// ============================================

// ============================================
// BEIM LADEN DER SEITE
// ============================================
async function initAdmin() {
    await ladeOrte();
    await ladeTurniere();
}

// ============================================
// ORTE - Eingabefelder erstellen
// ============================================
function erstelleEingabefelder() {
    const anzahl = parseInt(document.getElementById('anzahlOrte').value) || 1;
    const container = document.getElementById('eingabeContainer');
    container.innerHTML = '';

    // ✅ Grid Container - max 4 pro Zeile
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    container.style.gap = '8px';

    for (let i = 0; i < anzahl; i++) {
        container.innerHTML += `
            <input type="text" 
                   id="ortName_${i}" 
                   placeholder="Ortsname *" 
                   style="padding:8px 10px; border:1px solid #ccc; 
                          border-radius:6px; font-size:14px; width:100%;">
        `;
    }
}

// ============================================
// ORTE - Alle Orte speichern
// ============================================
async function speichereAlleOrte() {
    const anzahl = parseInt(document.getElementById('anzahlOrte').value) || 1;
    let gespeichert = 0;
    let fehler = 0;

    for (let i = 0; i < anzahl; i++) {
        const name = document.getElementById(`ortName_${i}`)?.value.trim();
        const adresse = document.getElementById(`ortAdresse_${i}`)?.value.trim();

        if (!name) {
            fehler++;
            continue;
        }

        try {
            const res = await fetch('/api/orte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, adresse })
            });

            if (res.ok) {
                gespeichert++;
            } else {
                fehler++;
            }
        } catch (err) {
            console.error('Fehler beim Speichern:', err);
            fehler++;
        }
    }

    alert(`✅ ${gespeichert} Ort(e) gespeichert!${fehler > 0 ? `\n❌ ${fehler} fehlgeschlagen!` : ''}`);
    
    // Felder leeren & Liste neu laden
    document.getElementById('eingabeContainer').innerHTML = '';
    ladeOrte();
}

// ============================================
// ORTE - Liste laden & anzeigen
// ============================================
async function ladeOrte() {
    try {
        const res = await fetch('/api/orte');
        const orte = await res.json();

        const container = document.getElementById('adminOrteContainer');

        if (orte.length === 0) {
            container.innerHTML = '<p style="color:#888;">Noch keine Orte gespeichert.</p>';
            return;
        }

        container.innerHTML = orte.map(ort => `
    <div style="display:flex; justify-content:space-between; align-items:center;
                padding:10px; background:white; border-radius:8px; 
                margin-bottom:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div>
            <strong>${ort.name}</strong>
            ${ort.adresse ? `<br><small style="color:#888;">${ort.adresse}</small>` : ''}
        </div>
        <div style="display:flex; gap:8px;">
            <button onclick="bearbeiteOrt(${ort.id}, '${ort.name}', '${ort.adresse || ''}')" 
                    class="btn-edit" style="font-size:0.8rem; padding:4px 8px;">
                ✏️ Bearbeiten
            </button>
            <button onclick="loescheOrt(${ort.id})" 
                    class="btn-danger" style="font-size:0.8rem; padding:4px 8px;">
                🗑️ Löschen
            </button>
        </div>
    </div>
`).join('');

        // Auch Dropdown im Turnier-Formular aktualisieren
        aktualisiereOrtDropdown(orte);

    } catch (err) {
        console.error('Fehler beim Laden der Orte:', err);
        document.getElementById('adminOrteContainer').innerHTML = 
            '<p style="color:red;">❌ Fehler beim Laden!</p>';
    }
}

// ============================================
// ORTE - Dropdown aktualisieren
// ============================================
function aktualisiereOrtDropdown(orte) {
    const select = document.getElementById('turnierOrt');
    if (!select) return;

    select.innerHTML = '<option value="">– Bitte wählen –</option>';
    orte.forEach(ort => {
        select.innerHTML += `<option value="${ort.id}">${ort.name}</option>`;
    });
}

// ============================================
// ORTE - Bearbeiten
// ============================================
async function bearbeiteOrt(id, alterName, alterAdresse) {
    const neuerName = prompt('Ortsname:', alterName);
    if (!neuerName) return;

    const neueAdresse = prompt('Adresse:', alterAdresse);

    try {
        const res = await fetch(`/api/orte/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: neuerName, adresse: neueAdresse || '' })
        });

        if (res.ok) {
            alert('✅ Ort aktualisiert!');
            ladeOrte();
        } else {
            alert('❌ Fehler beim Aktualisieren!');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// ORTE - Löschen
// ============================================
async function loescheOrt(id) {
    if (!confirm('Ort wirklich löschen?')) return;

    try {
        const res = await fetch(`/api/orte/${id}`, { method: 'DELETE' });
        const daten = await res.json();

        if (res.ok) {
            alert('✅ Ort gelöscht!');
            ladeOrte();
        } else {
            // ✅ Zeigt jetzt die genaue Fehlermeldung an
            alert('❌ ' + daten.fehler);
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// ALTERSGRUPPEN - Checkboxen
// ============================================
function aktualisiereAltersgruppen() {
    const checkboxen = document.querySelectorAll(
        '.altersgruppen-grid input[type="checkbox"]'
    );
    const container = document.getElementById('altersgruppen-details');

    const ausgewaehlt = [];
    checkboxen.forEach(cb => {
        if (cb.checked) ausgewaehlt.push(cb.value);
    });

    // Blöcke hinzufügen
    ausgewaehlt.forEach((ag) => {
        if (!document.getElementById(`ag-block-${ag}`)) {
            container.innerHTML += erstelleAltersgruppenBlock(ag);
        }
    });

    // Blöcke entfernen wenn Checkbox abgewählt
    const alleBlöcke = container.querySelectorAll('.altersgruppen-block');
    alleBlöcke.forEach(block => {
        const agName = block.dataset.ag;
        if (!ausgewaehlt.includes(agName)) {
            block.remove();
        }
    });
}

// ============================================
// ALTERSGRUPPEN - Block HTML erstellen
// ============================================
function erstelleAltersgruppenBlock(ag) {
    return `
        <div class="altersgruppen-block" 
             id="ag-block-${ag}" 
             data-ag="${ag}"
             style="background:#f8f9fa; border-radius:10px; 
                    padding:16px; margin-bottom:16px;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);">

            <h4 style="color:#e94560; margin-bottom:12px;">
                🏆 ${ag}
            </h4>

            <!-- Anzahl Vereine -->
            <div style="margin-bottom:12px;">
                <label style="font-weight:600;">Anzahl Vereine:</label>
                <input 
                    type="number" 
                    id="anzahl_${ag}"
                    min="5" max="30" 
                    placeholder="5-30"
                    onchange="berechneGruppen('${ag}')"
                    style="width:80px; margin-left:10px; padding:6px; 
                           border-radius:6px; border:1px solid #ccc;">
            </div>

            <!-- Gruppen-Info wird automatisch befüllt -->
            <div id="gruppenInfo_${ag}" 
                 style="background:#e8f4fd; border-radius:8px; 
                        padding:10px; margin-bottom:12px; display:none;">
            </div>

            <!-- Vereinsnamen werden automatisch generiert -->
            <div id="vereinsFelder_${ag}"></div>

            <!-- 2 Felder Option nur bei U07/U08 -->
            ${istKleinfeldAltersgruppe(ag) ? `
                <div style="margin-top:12px; padding:10px; 
                            background:#fff3cd; border-radius:8px;">
                    <label style="font-weight:600; cursor:pointer;">
                        <input type="checkbox" 
                               id="zweiFelder_${ag}"
                               style="margin-right:8px;">
                        🏟️ 2 Spielfelder in dieser Halle
                    </label>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// Prüft ob Kleinfeld-Altersgruppe (U07/U08)
// ============================================
function istKleinfeldAltersgruppe(name) {
    const n = name.toUpperCase();
    return n.includes('U07') || n.includes('U08') || 
           n.includes('U7')  || n.includes('U8');
}

// ============================================
// GRUPPEN - Automatisch berechnen
// ============================================

// ============================================
// GRUPPEN - Berechnungs-Logik
// ============================================
function gruppenBerechnen(anzahl) {
    let anzahlGruppen;

    if      (anzahl <= 7)  anzahlGruppen = 1;
    else if (anzahl <= 12) anzahlGruppen = 2;
    else if (anzahl <= 18) anzahlGruppen = 3;
    else if (anzahl <= 24) anzahlGruppen = 4;
    else                   anzahlGruppen = 5;

     // Gruppennamen erstellen
    let gruppenNamen;
    
    if (anzahlGruppen === 1) {
        gruppenNamen = ['Finalrunde'];  // ✅ statt 'A'
    } else {
        gruppenNamen = Array.from({length: anzahlGruppen}, 
            (_, i) => String.fromCharCode(65 + i)  // A, B, C...
        );
    }

   //const gruppenNamen = ['A','B','C','D','E'].slice(0, anzahlGruppen);

    const basis = Math.floor(anzahl / anzahlGruppen);
    const rest  = anzahl % anzahlGruppen;

    const verteilung = gruppenNamen.map((_, i) => 
    i < rest ? basis + 1 : basis
    );

    return { anzahlGruppen, gruppenNamen, verteilung };
}

// ============================================
// GRUPPEN - Anzeige aktualisieren
// ============================================
function berechneGruppen(ag) {
    const anzahlInput = document.getElementById(`anzahl_${ag}`);
    const anzahl = parseInt(anzahlInput.value);

    const gruppenInfo   = document.getElementById(`gruppenInfo_${ag}`);
    const vereinsFelder = document.getElementById(`vereinsFelder_${ag}`);

    // Ungültige Eingabe
    if (isNaN(anzahl) || anzahl < 5) {
        gruppenInfo.style.display = 'none';
        vereinsFelder.innerHTML = '';
        return;
    }
    if (anzahl > 30) {
        gruppenInfo.innerHTML = '⚠️ Maximal 30 Vereine möglich!';
        gruppenInfo.style.display = 'block';
        vereinsFelder.innerHTML = '';
        return;
    }

    const { anzahlGruppen, gruppenNamen, verteilung } = gruppenBerechnen(anzahl);

    // Info-Box anzeigen
    gruppenInfo.style.display = 'block';

    if (anzahlGruppen === 1) {
        // ✅ 5-7 Teams = Finalrunde direkt
        gruppenInfo.innerHTML = `
            <strong>🏆 Finalrunde direkt!</strong><br>
            <span style="font-size:0.9em;">
                ${anzahl} Teams spielen Jeder-gegen-Jeden.<br>
                Tabellenerster ist Turniersieger!
            </span>
        `;
    } else {
        gruppenInfo.innerHTML = `
            <strong>📊 Automatische Einteilung:</strong><br>
            ${anzahl} Vereine → 
            <strong style="color:#e94560;">${anzahlGruppen} Gruppen</strong>
            (${gruppenNamen.join(', ')})<br>
            <small style="color:#888;">
                Verteilung: ${verteilung.map((v,i) => 
                    `Gruppe ${gruppenNamen[i]}: ${v} Teams`
                ).join(' | ')}
            </small><br>
            
        `;
    }

    // Vereinsfelder erstellen
    vereinsFelder.innerHTML = erstelleVereinsFelder(
        anzahl, gruppenNamen, verteilung, ag
    );
}

// ============================================
// Prüft ob Kleinfeld-Altersgruppe (U07/U08)
// ============================================
function istKleinfeldAltersgruppe(name) {
    const n = name.toUpperCase();
    return n.includes('U07') || n.includes('U08') || 
           n.includes('U7')  || n.includes('U8');
}

// ============================================
// Vereinsname-Felder erstellen
// ============================================
function erstelleVereinsFelder(anzahl, gruppenNamen, verteilung, ag) {
    let html = `
        <div style="margin-top:12px;">
            <strong>📝 Vereinsnamen eingeben:</strong>
            <div style="font-size:0.85em; color:#888; margin-bottom:8px;">
                Bitte die Namen der Vereine eingeben, damit sie später im Spielplan angezeigt werden können.
            </div>
    `;

    let teamNummer = 1;

    gruppenNamen.forEach((gruppe, gi) => {
        html += `
            <div style="background:#fff; border-radius:8px; 
                        padding:12px; margin-top:10px;
                        border-left:4px solid #e94560;">
                <strong style="color:#e94560;">Gruppe ${gruppe}</strong>
                <span style="font-size:0.85em; color:#888;">
                    (${verteilung[gi]} Teams)
                </span>
        `;

        for (let i = 0; i < verteilung[gi]; i++) {
            html += `
                <div style="margin-top:8px; display:flex; 
                            align-items:center; gap:8px;">
                    <span style="min-width:70px; font-size:0.9em; color:#555;">
                        Team ${teamNummer}:
                    </span>
                    <input 
                        type="text"
                        id="verein_${ag}_${teamNummer}"
                        placeholder="Vereinsname..."
                        style="flex:1; padding:6px 10px; border-radius:6px; 
                               border:1px solid #ccc; font-size:0.95em;">
                </div>
            `;
            teamNummer++; // ✅ War vorher vergessen!
        }

        html += `</div>`; // Gruppe schließen
    });

    html += `</div>`; // Haupt-div schließen
    return html;
}       

// ============================================
// TURNIER ERSTELLEN
// ============================================
async function erstelleTurnierNeu() {
    // --- Grunddaten lesen ---
    const ort_id     = document.getElementById('turnierOrt').value;
    const datum      = document.getElementById('turnierDatum').value;
    const startzeit  = document.getElementById('turnierStartzeit').value;
    const spielzeit  = parseInt(document.getElementById('turnierSpielzeit').value);
    const wechsel    = parseInt(document.getElementById('turnierWechselpause').value);
    const pauseNach  = parseInt(document.getElementById('turnierPauseNach').value) || 0;
    const pauseDauer = parseInt(document.getElementById('turnierPauseDauer').value) || 0;

    // --- Welche Altersgruppen? ---
    const checkboxen  = document.querySelectorAll('.altersgruppen-grid input[type="checkbox"]:checked');
    const ausgewaehlt = Array.from(checkboxen).map(cb => cb.value);

    // --- Validierung ---
    if (!ort_id) {
        alert('⚠️ Bitte einen Veranstaltungsort wählen!');
        return;
    }
    if (!datum) {
        alert('⚠️ Bitte ein Datum eingeben!');
        return;
    }
    if (!startzeit) {
        alert('⚠️ Bitte eine Startzeit eingeben!');
        return;
    }
    if (ausgewaehlt.length === 0) {
        alert('⚠️ Bitte mindestens eine Altersgruppe wählen!');
        return;
    }

    // --- Für jede Altersgruppe ein Turnier erstellen ---
    let erfolgreich = 0;
    let fehler      = 0;

    for (const ag of ausgewaehlt) {

        // ✅ KORRIGIERT: Richtige IDs lesen
        const anzahl_teams = parseInt(document.getElementById(`anzahl_${ag}`)?.value) || 8;

        // ✅ Gruppen berechnen (gleiche Logik wie berechneGruppen())
        const { anzahlGruppen, gruppenNamen, verteilung } = gruppenBerechnen(anzahl_teams);
        const anzahl_gruppen = anzahlGruppen;

        try {
            // 1. Turnier erstellen
            const turnierRes = await fetch('/api/turniere', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ort_id,
                    altersgruppe:       ag,
                    datum,
                    startzeit,
                    spielzeit,
                    wechselpause:       wechsel,
                    turnierpause_nach:  pauseNach,
                    turnierpause_dauer: pauseDauer,
                    anzahl_teams,
                    anzahl_gruppen
                })
            });

            if (!turnierRes.ok) {
                console.error(`Fehler bei ${ag}`);
                fehler++;
                continue;
            }

            const turnierDaten = await turnierRes.json();
            const turnier_id   = turnierDaten.id;

            // 2. Gruppen erstellen
            const gruppenIds = [];
            const gruppenBuchstaben = ['A','B','C','D','E','F','G','H']; // ← NEU

            for (let g = 0; g < anzahl_gruppen; g++) {
                const gruppenName = anzahl_gruppen === 1
                ? `${ag} Gruppe A`
                : `${ag} Gruppe ${gruppenBuchstaben[g]}`;

                const gruppeRes = await fetch(`/api/turniere/${turnier_id}/gruppen`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: gruppenName })
                });

                const gruppeDaten = await gruppeRes.json();
                gruppenIds.push(gruppeDaten.id);
            }

            // 3. Teams speichern
            // ✅ KORRIGIERT: teamNummer läuft von 1 bis anzahl_teams
            let teamNummer = 1;

            for (let g = 0; g < anzahl_gruppen; g++) {
                const gruppe_id          = gruppenIds[g];
                const teamsInDieserGruppe = verteilung[g]; // ✅ echte Verteilung!

                for (let t = 0; t < teamsInDieserGruppe; t++) {

                    // ✅ KORRIGIERT: Richtige Input-ID
                    const teamInput = document.getElementById(`verein_${ag}_${teamNummer}`);
                    const teamName  = teamInput?.value.trim() || `Team ${teamNummer}`;

                    await fetch(`/api/gruppen/${gruppe_id}/teams`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: teamName })
                    });

                    teamNummer++; // ✅ Immer hochzählen
                }
            }

            erfolgreich++;

        } catch (err) {
            console.error(`Fehler bei Altersgruppe ${ag}:`, err);
            fehler++;
        }
    }

    // --- Ergebnis anzeigen ---
    if (fehler === 0) {
        alert(`✅ ${erfolgreich} Turnier(e) erfolgreich erstellt!`);
    } else {
        alert(`✅ ${erfolgreich} erfolgreich\n❌ ${fehler} fehlgeschlagen!`);
    }

    // --- Formular zurücksetzen ---
    checkboxen.forEach(cb => cb.checked = false);
    document.getElementById('altersgruppen-details').innerHTML = '';

    // --- Turnierliste neu laden ---
    ladeTurniere();
}

// ============================================
// TURNIERE - Alle laden & anzeigen
// ============================================
async function ladeTurniere() {
    try {
        const res = await fetch('/api/turniere');
        const turniere = await res.json();

        const container = document.getElementById('turnierListeContainer');

        if (turniere.length === 0) {
            container.innerHTML = '<p>Noch keine Turniere vorhanden.</p>';
            return;
        }

        // ✅ NEU: Für jedes Turnier Gruppen & Teams laden
        for (const t of turniere) {
            const gruppenRes = await fetch(`/api/turniere/${t.id}/gruppen`);
            const gruppen = await gruppenRes.json();

            t.anzahlGruppen = gruppen.length;
            t.gruppenNamen  = gruppen.map(g => g.name);

            // Teams zählen (alle Gruppen zusammen)
            let teamCount = 0;
            for (const g of gruppen) {
                const teamsRes = await fetch(`/api/gruppen/${g.id}/teams`);
                const teams = await teamsRes.json();
                teamCount += teams.length;
            }
            t.anzahlTeams = teamCount;
        }

        // Gruppieren nach Datum
        const nachDatum = {};
        turniere.forEach(t => {
            if (!nachDatum[t.datum]) nachDatum[t.datum] = [];
            nachDatum[t.datum].push(t);
        });

        let html = '';

        Object.keys(nachDatum).sort().forEach(datum => {
    const turniereDatum = nachDatum[datum];
    const datumFormatiert = new Date(datum).toLocaleDateString('de-DE', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric'
    });

    // ✅ Datums-Überschrift bleibt gleich
    html += `
        <div style="color:#e94560; font-weight:bold; 
                    margin:16px 0 8px; font-size:1rem;">
            📅 ${datumFormatiert}
        </div>

        <!-- ✅ NEU: 2 Spalten Grid pro Datum -->
        <div style="display:grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap:12px; 
                    margin-bottom:16px;">
    `;

    // Karten einfügen
    turniereDatum.forEach(t => {
        html += erstelleTurnierKarte(t); // ✅ deine bestehende Funktion
    });

    html += `</div>`; // Grid schließen
});

        container.innerHTML = html;

    } catch (err) {
        console.error('Fehler beim Laden der Turniere:', err);
        document.getElementById('turnierListeContainer').innerHTML =
            '<p style="color:red;">❌ Fehler beim Laden!</p>';
    }
}

// ============================================
// TURNIERE - Eine Turnierkarte erstellen
// ============================================
function erstelleTurnierKarte(t) {
    
    // ✅ Wenn 5-7 Teams → "Finalrunde" statt "Gruppe A"
    let gruppenBadges;
    
    if (t.anzahlTeams <= 7) {
        gruppenBadges = `
            <span style="background:#e94560; color:white; border-radius:4px;
                         padding:1px 7px; font-size:0.8rem; font-weight:bold;">
                🏆 Finalrunde
            </span>
        `;
    } else {
        gruppenBadges = (t.gruppenNamen || []).map(name => `
            <span style="background:#e8f0fe; color:#0f3460; border-radius:4px;
                 padding:1px 7px; font-size:0.8rem; font-weight:bold;
                 border: 1px solid #e8f0fe;">
                ${name}
            </span>
        `).join('');
    }

    return `
        <div id="turnier-${t.id}" 
             style="background:#f0f0f0; border-radius:8px; 
                    padding:12px;
                    border-left: 3px solid #0f3460;">

            <!-- Kopfzeile -->
            <div style="display:flex; justify-content:space-between; 
                        align-items:center; flex-wrap:wrap; gap:8px;">
                <div>
                    <strong style="color:#e94560; font-size:1.1rem;">
                        ⚽ ${t.altersgruppe}
                    </strong>
                    <span style="color:#555; margin-left:8px;">
                        📍 ${t.ort_name || 'Kein Ort'}
                    </span>
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button onclick="zeigeTurnierDetail(${t.id})" 
                            class="btn-secondary"
                            style="font-size:0.8rem; padding:4px 10px;">
                        📋 Details
                    </button>
                    <button onclick="archiviereTurnier(${t.id})"
                            class="btn-secondary"
                            style="font-size:0.8rem; padding:4px 10px;">
                        📦 Archivieren
                    </button>
                    <button onclick="loescheTurnier(${t.id})"
                            class="btn-danger"
                            style="font-size:0.8rem; padding:4px 10px;">
                        🗑️ Löschen
                    </button>
                </div>
            </div>

            <!-- ✅ ZEILE 1: Alles in einer Zeile -->
            <div style="margin-top:10px; display:flex; 
                        align-items:center; flex-wrap:wrap;
                        gap:6px; color:#555; font-size:0.85rem;">


                <span>📍 ${t.ort_name || 'Kein Ort'}</span>
                <span style="color:#ccc;">|</span>

                <span>👥 <strong>${t.anzahlTeams || 0}</strong> Teams</span>
                <span style="color:#ccc;">|</span>

                <span style="display:flex; align-items:center; gap:4px;">
                    📂 Gruppen: ${gruppenBadges}
                </span>

            </div>

            <!-- ✅ ZEILE 2: Zeitinfo in einer Zeile -->
            <div style="margin-top:6px; display:flex; 
                        align-items:center; flex-wrap:wrap;
                        gap:6px; color:#888; font-size:0.85rem;
                        border-top:1px solid #ddd; padding-top:8px;">

                <span>⏱ Start: <strong>${t.startzeit}</strong> Uhr</span>
                <span style="color:#ccc;">|</span>

                <span>🕐 Spielzeit: <strong>${t.spielzeit}</strong> Min</span>
                <span style="color:#ccc;">|</span>

                <span>⏸ Pause: <strong>${t.wechselpause}</strong> Min</span>

            </div>

            <!-- Detail Bereich -->
            <div id="turnier-detail-${t.id}" 
                 style="margin-top:12px; display:none;">
            </div>

        </div>
    `;
}

// ============================================
// TURNIER - Details anzeigen / verstecken
// ============================================
async function zeigeTurnierDetail(id) {
    const detailDiv = document.getElementById(`turnier-detail-${id}`);

    // Toggle - schon offen? Dann schließen
    if (detailDiv.style.display === 'block') {
        detailDiv.style.display = 'none';
        return;
    }

    detailDiv.style.display = 'block';
    detailDiv.innerHTML = '<p style="color:#888;">Wird geladen...</p>';

    try {
        // Gruppen laden
        const res = await fetch(`/api/turniere/${id}/gruppen`);
        const gruppen = await res.json();

        if (gruppen.length === 0) {
            detailDiv.innerHTML = '<p style="color:#888;">Keine Gruppen vorhanden.</p>';
            return;
        }

        // ✅ Spalten-Anzahl bestimmen (max 3)
        const anzahlGruppen = gruppen.length;
        const spalten = Math.min(anzahlGruppen, 3);

        let html = '';

        for (const gruppe of gruppen) {
            // Teams laden
            const teamsRes = await fetch(`/api/gruppen/${gruppe.id}/teams`);
            const teams = await teamsRes.json();

            // ✅ Gruppenname bestimmen
            // Wenn nur 1 Gruppe → "Finalrunde" statt "Gruppe A"
            const gruppenName = anzahlGruppen === 1 
                ? gruppe.name.replace(/Gruppe\s*A$/i, 'Finalrunde') 
                : gruppe.name;

            html += `
                <div style="background:#f8f9fa; border-radius:8px; 
                            padding:12px; margin-bottom:10px;">

                    <!-- Gruppen Kopf -->
                    <div style="display:flex; justify-content:space-between; 
                                align-items:center; margin-bottom:10px;">
                        <strong style="color:#e2b714;">📁 ${gruppenName}</strong>
                        <div style="display:flex; gap:6px;">
                            <!-- ✅ Button "Teams verwalten" entfernt -->
                            <button onclick="generiereSpielplan(${gruppe.id})"
                                    class="btn-primary"
                                    style="font-size:0.75rem; padding:3px 8px;">
                                📅 Spielplan generieren
                            </button>
                        </div>
                    </div>

                <div id="teams-${gruppe.id}" style="max-width:33%;">
                    ${teams.length === 0 
                    ? '<p style="color:#888; font-size:0.85rem;">Noch keine Teams.</p>'
                    : teams.map(team => `
                <div style="padding:4px 8px;
                    background:#f0f0f0; border-radius:4px;
                    margin-bottom:4px;">
                    <span>${team.name}</span>
                </div>
                `).join('')
                }
                </div>

                    <!-- Team hinzufügen -->
                    <div id="team-verwaltung-${gruppe.id}" 
                         style="display:none; margin-top:10px;">
                    </div>

                </div>
            `;
        }

        // ✅ Grid mit max 3 Spalten
        const wrapper = document.createElement('div');
        wrapper.style.display = 'grid';
        wrapper.style.gridTemplateColumns = `repeat(${spalten}, 1fr)`;
        wrapper.style.gap = '16px';
        wrapper.innerHTML = html;
        detailDiv.innerHTML = '';
        detailDiv.appendChild(wrapper);

    } catch (err) {
        console.error(err);
        detailDiv.innerHTML = '<p style="color:red;">❌ Fehler beim Laden!</p>';
    }
}

// ============================================
// TURNIER - Löschen
// ============================================
async function loescheTurnier(id) {
    
    // 1️⃣ Erste Abfrage
    if (!confirm('Turnier wirklich löschen?\n⚠️ Alle Gruppen, Teams & Spiele werden gelöscht!')) return;
    
    // 2️⃣ Zweite Abfrage
    if (!confirm('⚠️ LETZTE WARNUNG!\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nWirklich löschen?')) return;

    try {
        const res = await fetch(`/api/turniere/${id}`, { method: 'DELETE' });

        if (res.ok) {
            alert('✅ Turnier wurde gelöscht!');
            ladeTurniere();
        } else {
            alert('❌ Fehler beim Löschen!');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// TURNIER - Archivieren
// ============================================
async function archiviereTurnier(id) {
    if (!confirm('Turnier archivieren?')) return;

    try {
        const res = await fetch('/api/archiv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turnier_id: id })
        });

        if (res.ok) {
            alert('✅ Turnier archiviert!');
        } else {
            alert('❌ Fehler beim Archivieren!');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// TEAMS - Einzelnes Team hinzufügen
// ============================================
async function fuegeTeamHinzu(gruppeId) {
    const input = document.getElementById(`neuesTeam-${gruppeId}`);
    const name = input.value.trim();

    if (!name) {
        alert('⚠️ Bitte einen Teamnamen eingeben!');
        return;
    }

    try {
        const res = await fetch(`/api/gruppen/${gruppeId}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (res.ok) {
            input.value = '';
            await aktualisiereTeamListe(gruppeId);
        } else {
            alert('❌ Fehler beim Hinzufügen!');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// TEAMS - Mehrere Teams hinzufügen
// ============================================
async function fuegeVieleteamsHinzu(gruppeId) {
    const textarea = document.getElementById(`mehreTeams-${gruppeId}`);
    const zeilen = textarea.value.split('\n')
        .map(z => z.trim())
        .filter(z => z.length > 0);

    if (zeilen.length === 0) {
        alert('⚠️ Bitte Teams eingeben!');
        return;
    }

    let erfolgreich = 0;
    let fehler = 0;

    for (const name of zeilen) {
        try {
            const res = await fetch(`/api/gruppen/${gruppeId}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) erfolgreich++;
            else fehler++;

        } catch (err) {
            fehler++;
        }
    }

    alert(`✅ ${erfolgreich} Teams hinzugefügt${fehler > 0 ? `\n❌ ${fehler} fehlgeschlagen` : ''}!`);
    textarea.value = '';
    await aktualisiereTeamListe(gruppeId);
}

// ============================================
// TEAMS - Liste neu laden & anzeigen
// ============================================
async function aktualisiereTeamListe(gruppeId) {
    try {
        const res = await fetch(`/api/gruppen/${gruppeId}/teams`);
        const teams = await res.json();
        const container = document.getElementById(`teams-${gruppeId}`);

        if (teams.length === 0) {
            container.innerHTML = 
                '<p style="color:#888; font-size:0.85rem;">Noch keine Teams.</p>';
            return;
        }

        // Wrapper mit 3-Spalten Grid
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(3, 1fr)';
            container.style.gap = '4px';

            container.innerHTML = teams.map(team => `
               <div style="display:flex; justify-content:space-between;
                align-items:center; padding:4px 8px;
                background:#f0f0f0; border-radius:4px;">
                <span style="font-size:0.85rem;">${team.name}</span>
            <button onclick="loescheTeam(${team.id}, ${gruppeId})"
                class="btn-danger"
                style="font-size:0.7rem; padding:2px 6px;">
                🗑️
            </button>
            </div>
`).join('');


    } catch (err) {
        console.error(err);
    }
}

// ============================================
// SPIELPLAN - Generieren
// ============================================
async function generiereSpielplan(gruppeId) {
    if (!confirm('Spielplan für diese Gruppe generieren?\n⚠️ Bestehender Spielplan wird überschrieben!')) return;

    try {
        // Teams laden
        const teamsRes = await fetch(`/api/gruppen/${gruppeId}/teams`);
        const teams = await teamsRes.json();

        if (teams.length < 2) {
            alert('⚠️ Mindestens 2 Teams nötig!');
            return;
        }

        // Rundenrobin Paarungen berechnen
        const paarungen = berechneRoundRobin(teams);

        // Spielplan ans Backend schicken
        const res = await fetch(`/api/gruppen/${gruppeId}/spielplan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paarungen })
        });

        if (res.ok) {
            alert(`✅ Spielplan generiert!\n📊 ${paarungen.length} Spiele erstellt!`);
        } else {
            alert('❌ Fehler beim Generieren!');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// SPIELPLAN - Round Robin Algorithmus
// ============================================
function berechneRoundRobin(teams) {
    const paarungen = [];
    const n = teams.length;

    // Bei ungerader Anzahl ein "Freilos" Team hinzufügen
    const liste = [...teams];
    if (n % 2 !== 0) liste.push({ id: null, name: 'Freilos' });

    const anzahl = liste.length;
    const runden = anzahl - 1;
    const proRunde = anzahl / 2;

    for (let runde = 0; runde < runden; runde++) {
        for (let i = 0; i < proRunde; i++) {
            const heim = liste[i];
            const gast = liste[anzahl - 1 - i];

            // Freilos-Spiele überspringen
            if (heim.id !== null && gast.id !== null) {
                paarungen.push({
                    team_links_id:   heim.id,
                    team_rechts_id:   gast.id,
                    heim_name: heim.name,
                    gast_name: gast.name,
                    runde:     runde + 1
                });
            }
        }

        // Teams rotieren (erstes Team bleibt fest)
        liste.splice(1, 0, liste.pop());
    }

    return paarungen;
}

// ============================================
// ZUSCHAUERBEREICH - Turnier laden
// ============================================
async function ladeZuschauerAnsicht(turnierId) {
    try {
        const res = await fetch(`/api/turniere/${turnierId}`);
        const turnier = await res.json();

        document.getElementById('turnier-titel').textContent = turnier.name;
        document.getElementById('turnier-datum').textContent =
            new Date(turnier.datum).toLocaleDateString('de-DE', {
                weekday: 'long',
                year:    'numeric',
                month:   'long',
                day:     'numeric'
            });

        // Gruppen laden
        await ladeGruppenTabellen(turnierId);
        await ladeSpielplan(turnierId);

    } catch (err) {
        console.error(err);
    }
}

// ============================================
// TABELLEN - Alle Gruppen laden
// ============================================
async function ladeGruppenTabellen(turnierId) {
    try {
        const res = await fetch(`/api/turniere/${turnierId}/gruppen`);
        const gruppen = await res.json();

        const container = document.getElementById('tabellen-container');
        container.innerHTML = '';

        for (const gruppe of gruppen) {
            const tabelle = await berechneTabelle(gruppe.id);
            container.innerHTML += erstelleTabelleHTML(gruppe, tabelle);
        }

    } catch (err) {
        console.error(err);
    }
}

// ============================================
// TABELLEN - Tabelle berechnen
// ============================================
async function berechneTabelle(gruppeId) {
    try {
        // Teams laden
        const teamsRes = await fetch(`/api/gruppen/${gruppeId}/teams`);
        const teams = await teamsRes.json();

        // Spiele laden
        const spieleRes = await fetch(`/api/gruppen/${gruppeId}/spiele`);
        const spiele = await spieleRes.json();

        // Statistiken für jedes Team
        const stats = {};
        teams.forEach(team => {
            stats[team.id] = {
                id:      team.id,
                name:    team.name,
                spiele:  0,
                siege:   0,
                unent:   0,
                nieder:  0,
                tore:    0,
                gegentore: 0,
                punkte:  0
            };
        });

        // Gespielte Spiele auswerten
        spiele.forEach(spiel => {
            if (spiel.tore_links === null || spiel.tore_rechts === null) return;

            const heim = stats[spiel.team_links_id];
            const gast = stats[spiel.team_rechts_id];

            if (!heim || !gast) return;

            heim.spiele++;
            gast.spiele++;
            heim.tore      += spiel.tore_links;
            heim.gegentore += spiel.tore_rechts;
            gast.tore      += spiel.tore_rechts;
            gast.gegentore += spiel.tore_links;

            // Punkte vergeben
            if (spiel.tore_links > spiel.tore_rechts) {
                // Heimsieg
                heim.siege++;
                heim.punkte += 3;
                gast.nieder++;
            } else if (spiel.tore_links < spiel.tore_rechts) {
                // Gastsieg
                gast.siege++;
                gast.punkte += 3;
                heim.nieder++;
            } else {
                // Unentschieden
                heim.unent++;
                gast.unent++;
                heim.punkte++;
                gast.punkte++;
            }
        });

        // Sortieren: Punkte → Tordifferenz → Tore
        return Object.values(stats).sort((a, b) => {
            if (b.punkte !== a.punkte) return b.punkte - a.punkte;
            const diffA = a.tore - a.gegentore;
            const diffB = b.tore - b.gegentore;
            if (diffB !== diffA) return diffB - diffA;
            return b.tore - a.tore;
        });

    } catch (err) {
        console.error(err);
        return [];
    }
}

// ============================================
// TABELLEN - HTML erstellen
// ============================================
function erstelleTabelleHTML(gruppe, tabelle) {
    return `
        <div style="background:#f8f9fa; border-radius:10px; 
                    padding:16px; margin-bottom:20px;">
            
            <h3 style="color:#e94560; margin-bottom:12px;">
                📊 ${gruppe.name}
            </h3>

            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; 
                              font-size:0.9rem;">
                    <thead>
                        <tr style="background:#0f3460; color:#fff;">
                            <th style="padding:8px; text-align:left;">#</th>
                            <th style="padding:8px; text-align:left;">Team</th>
                            <th style="padding:8px; text-align:center;">Sp</th>
                            <th style="padding:8px; text-align:center;">S</th>
                            <th style="padding:8px; text-align:center;">U</th>
                            <th style="padding:8px; text-align:center;">N</th>
                            <th style="padding:8px; text-align:center;">Tore</th>
                            <th style="padding:8px; text-align:center;">Diff</th>
                            <th style="padding:8px; text-align:center; 
                                       color:#e94560;">Pkt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tabelle.map((team, index) => `
                            <tr style="border-bottom:1px solid #0f3460;
                                       ${index === 0 ? 'background:#0f3460aa;' : ''}">
                                <td style="padding:8px; color:#888;">
                                    ${index + 1}.
                                </td>
                                <td style="padding:8px; font-weight:bold;">
                                    ${index === 0 ? '🥇' : 
                                      index === 1 ? '🥈' : 
                                      index === 2 ? '🥉' : ''}
                                    ${team.name}
                                </td>
                                <td style="padding:8px; text-align:center;">
                                    ${team.spiele}
                                </td>
                                <td style="padding:8px; text-align:center; 
                                           color:#4caf50;">
                                    ${team.siege}
                                </td>
                                <td style="padding:8px; text-align:center; 
                                           color:#ff9800;">
                                    ${team.unent}
                                </td>
                                <td style="padding:8px; text-align:center; 
                                           color:#e94560;">
                                    ${team.nieder}
                                </td>
                                <td style="padding:8px; text-align:center;">
                                    ${team.tore}:${team.gegentore}
                                </td>
                                <td style="padding:8px; text-align:center;
                                           color:${(team.tore - team.gegentore) >= 0 
                                                   ? '#4caf50' : '#e94560'}">
                                    ${team.tore - team.gegentore > 0 ? '+' : ''}
                                    ${team.tore - team.gegentore}
                                </td>
                                <td style="padding:8px; text-align:center; 
                                           font-weight:bold; color:#e94560;">
                                    ${team.punkte}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================
// SPIELPLAN - Anzeigen
// ============================================
async function ladeSpielplan(turnierId) {
    try {
        const gruppenRes = await fetch(`/api/turniere/${turnierId}/gruppen`);
        const gruppen = await gruppenRes.json();

        const container = document.getElementById('spielplan-container');
        container.innerHTML = '';

        for (const gruppe of gruppen) {
            const spieleRes = await fetch(`/api/gruppen/${gruppe.id}/spiele`);
            const spiele = await spieleRes.json();

            container.innerHTML += erstelleSpielplanHTML(gruppe, spiele);
        }

    } catch (err) {
        console.error(err);
    }
}

// ============================================
// SPIELPLAN - HTML erstellen
// ============================================
function erstelleSpielplanHTML(gruppe, spiele) {
    // Spiele nach Runden gruppieren
    const nachRunden = {};
    spiele.forEach(spiel => {
        if (!nachRunden[spiel.runde]) nachRunden[spiel.runde] = [];
        nachRunden[spiel.runde].push(spiel);
    });

    return `
        <div style="background:#f8f9fa; border-radius:10px; 
                    padding:16px; margin-bottom:20px;">
            
            <h3 style="color:#e94560; margin-bottom:12px;">
                📅 ${gruppe.name} – Spielplan
            </h3>

            ${Object.keys(nachRunden).sort((a,b) => a-b).map(runde => `
                <div style="margin-bottom:12px;">
                    <h4 style="color:#888; font-size:0.85rem; 
                               margin-bottom:8px;">
                        Runde ${runde}
                    </h4>
                    ${nachRunden[runde].map(spiel => `
                        <div style="display:flex; align-items:center;
                                    justify-content:space-between;
                                    background:#f0f0f0; border-radius:8px;
                                    padding:10px 14px; margin-bottom:6px;
                                    flex-wrap:wrap; gap:8px;">
                            
                            <!-- Heimteam -->
                            <span style="flex:1; text-align:right; 
                                         font-weight:bold;">
                                ${spiel.heim_name}
                            </span>

                            <!-- Ergebnis -->
                            <div style="background:#0f3460; border-radius:6px;
                                        padding:4px 12px; text-align:center;
                                        min-width:70px;">
                                ${spiel.tore_links !== null 
                                    ? `<span style="color:#e94560; font-weight:bold; font-size:1.1rem;">
                                           ${spiel.tore_links} : ${spiel.tore_rechts}
                                       </span>`
                                    : `<span style="color:#888;">vs</span>`
                                }
                            </div>

                            <!-- Gastteam -->
                            <span style="flex:1; text-align:left; 
                                         font-weight:bold;">
                                ${spiel.gast_name}
                            </span>

                            <!-- Uhrzeit -->
                            ${spiel.uhrzeit 
                                ? `<span style="color:#888; font-size:0.8rem;">
                                       🕐 ${spiel.uhrzeit}
                                   </span>` 
                                : ''
                            }
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// AUTO-REFRESH - Tabellen & Spielplan
// ============================================
function starteAutoRefresh(turnierId, intervallSekunden = 30) {
    // Sofort laden
    ladeGruppenTabellen(turnierId);
    ladeSpielplan(turnierId);

    // Dann alle X Sekunden neu laden
    setInterval(() => {
        ladeGruppenTabellen(turnierId);
        ladeSpielplan(turnierId);
    }, intervallSekunden * 1000);

    console.log(`🔄 Auto-Refresh alle ${intervallSekunden}s gestartet`);
}

// ============================================
// ERGEBNISSE - Eingabe Bereich laden
// ============================================
async function ladeErgebnisEingabe(turnierId) {
    try {
        const gruppenRes = await fetch(`/api/turniere/${turnierId}/gruppen`);
        const gruppen = await gruppenRes.json();

        const container = document.getElementById('ergebnis-container');
        container.innerHTML = '';

        for (const gruppe of gruppen) {
            const spieleRes = await fetch(`/api/gruppen/${gruppe.id}/spiele`);
            const spiele = await spieleRes.json();

            // Nur noch nicht gespielte Spiele anzeigen
            const offeneSpiele = spiele.filter(s => s.tore_links === null);
            const gespielte    = spiele.filter(s => s.tore_links !== null);

            container.innerHTML += `
                <div style="background:#f8f9fa; border-radius:10px;
                            padding:16px; margin-bottom:20px;">
                    
                    <h3 style="color:#e94560; margin-bottom:4px;">
                        ⚽ ${gruppe.name}
                    </h3>
                    <p style="color:#888; font-size:0.85rem; margin-bottom:12px;">
                        ${gespielte.length} / ${spiele.length} Spiele gespielt
                    </p>

                    <!-- Fortschrittsbalken -->
                    <div style="background:#0f3460; border-radius:999px; 
                                height:6px; margin-bottom:16px;">
                        <div style="background:#e94560; border-radius:999px;
                                    height:6px; width:${spiele.length > 0 
                                    ? (gespielte.length / spiele.length * 100) 
                                    : 0}%;
                                    transition:width 0.5s;">
                        </div>
                    </div>

                    <!-- Offene Spiele -->
                    ${offeneSpiele.length === 0 
                        ? `<p style="color:#4caf50; text-align:center;">
                               ✅ Alle Spiele gespielt!
                           </p>`
                        : offeneSpiele.map(spiel => 
                            erstelleErgebnisEingabeHTML(spiel)
                          ).join('')
                    }

                    <!-- Gespielte Spiele -->
                    ${gespielte.length > 0 ? `
                        <details style="margin-top:12px;">
                            <summary style="color:#888; cursor:pointer;
                                           font-size:0.85rem;">
                                📋 Gespielte Spiele anzeigen (${gespielte.length})
                            </summary>
                            <div style="margin-top:10px;">
                                ${gespielte.map(spiel => 
                                    erstelleGespielteSpielHTML(spiel)
                                ).join('')}
                            </div>
                        </details>
                    ` : ''}
                </div>
            `;
        }

    } catch (err) {
        console.error(err);
    }
}

// ============================================
// ERGEBNISSE - Eingabe HTML
// ============================================
function erstelleErgebnisEingabeHTML(spiel) {
    return `
        <div id="spiel-${spiel.id}" 
             style="background:#f0f0f0; border-radius:8px;
                    padding:12px; margin-bottom:10px;">
            
            <!-- Runde & Uhrzeit -->
            <div style="display:flex; justify-content:space-between;
                        margin-bottom:8px; flex-wrap:wrap; gap:4px;">
                <span style="color:#888; font-size:0.8rem;">
                    Runde ${spiel.runde}
                </span>
                ${spiel.uhrzeit 
                    ? `<span style="color:#888; font-size:0.8rem;">
                           🕐 ${spiel.uhrzeit}
                       </span>` 
                    : ''
                }
            </div>

            <!-- Spieleingabe -->
            <div style="display:flex; align-items:center; 
                        gap:8px; flex-wrap:wrap;">
                
                <!-- Heimteam -->
                <span style="flex:1; text-align:right; font-weight:bold;
                             min-width:80px;">
                    ${spiel.heim_name}
                </span>

                <!-- Tore Heim -->
                <input type="number" 
                       id="heim-${spiel.id}"
                       min="0" max="99" value=""
                       placeholder="0"
                       style="width:50px; text-align:center; padding:6px;
                              background:#0f3460; color:#fff; 
                              border:2px solid #e94560; border-radius:6px;
                              font-size:1.1rem; font-weight:bold;">

                <span style="color:#888; font-weight:bold;">:</span>

                <!-- Tore Gast -->
                <input type="number" 
                       id="gast-${spiel.id}"
                       min="0" max="99" value=""
                       placeholder="0"
                       style="width:50px; text-align:center; padding:6px;
                              background:#0f3460; color:#fff;
                              border:2px solid #e94560; border-radius:6px;
                              font-size:1.1rem; font-weight:bold;">

                <!-- Gastteam -->
                <span style="flex:1; text-align:left; font-weight:bold;
                             min-width:80px;">
                    ${spiel.gast_name}
                </span>

                <!-- Speichern Button -->
                <button onclick="speichereErgebnis(${spiel.id}, ${spiel.gruppe_id})"
                        style="background:#e94560; color:#fff; border:none;
                               border-radius:6px; padding:6px 14px;
                               cursor:pointer; font-weight:bold;
                               white-space:nowrap;">
                    ✅ Speichern
                </button>
            </div>

            <!-- Uhrzeit setzen -->
            <div style="margin-top:8px; display:flex; gap:8px; 
                        align-items:center; flex-wrap:wrap;">
                <input type="time"
                       id="uhrzeit-${spiel.id}"
                       style="padding:4px; background:#0f3460; 
                              color:#fff; border:1px solid #333;
                              border-radius:6px;">
                <button onclick="speichereUhrzeit(${spiel.id})"
                        style="background:#0f3460; color:#888; border:none;
                               border-radius:6px; padding:4px 10px;
                               cursor:pointer; font-size:0.8rem;">
                    🕐 Uhrzeit setzen
                </button>
            </div>
        </div>
    `;
}

// ============================================
// ERGEBNISSE - Gespielte Spiele HTML
// ============================================
function erstelleGespielteSpielHTML(spiel) {
    const heimGewonnen = spiel.tore_links > spiel.tore_rechts;
    const gastGewonnen = spiel.tore_rechts > spiel.tore_links;
    const unentschieden = spiel.tore_links === spiel.tore_rechts;

    return `
        <div style="display:flex; align-items:center; gap:8px;
                    background:#0f3460; border-radius:8px;
                    padding:8px 12px; margin-bottom:6px; flex-wrap:wrap;">
            
            <!-- Heim -->
            <span style="flex:1; text-align:right; 
                         font-weight:${heimGewonnen ? 'bold' : 'normal'};
                         color:${heimGewonnen ? '#4caf50' : '#fff'};">
                ${spiel.heim_name}
            </span>

            <!-- Ergebnis -->
            <div style="background:#f8f9fa; border-radius:6px;
                        padding:4px 12px; text-align:center; min-width:70px;">
                <span style="font-weight:bold; font-size:1.1rem;
                             color:${unentschieden ? '#ff9800' : '#e94560'};">
                    ${spiel.tore_links} : ${spiel.tore_rechts}
                </span>
            </div>

            <!-- Gast -->
            <span style="flex:1; text-align:left;
                         font-weight:${gastGewonnen ? 'bold' : 'normal'};
                         color:${gastGewonnen ? '#4caf50' : '#fff'};">
                ${spiel.gast_name}
            </span>

            <!-- Bearbeiten Button -->
            <button onclick="bearbeiteErgebnis(${spiel.id})"
                    style="background:transparent; color:#888; border:none;
                           cursor:pointer; font-size:0.85rem;">
                ✏️
            </button>
        </div>
    `;
}

// ============================================
// ERGEBNISSE - Speichern
// ============================================
async function speichereErgebnis(spielId, gruppeId) {
    const heimTore = document.getElementById(`heim-${spielId}`).value;
    const gastTore = document.getElementById(`gast-${spielId}`).value;

    if (heimTore === '' || gastTore === '') {
        alert('⚠️ Bitte beide Torwerte eingeben!');
        return;
    }

    try {
        const res = await fetch(`/api/spiele/${spielId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tore_links: parseInt(heimTore),
                tore_rechts: parseInt(gastTore)
            })
        });

        if (res.ok) {
            // Live Ticker Event senden
            sendeLiveTicker(spielId, heimTore, gastTore);

            // UI aktualisieren
            document.getElementById(`spiel-${spielId}`)
                    .style.opacity = '0.5';

            setTimeout(() => {
                ladeErgebnisEingabe(aktuelleTurnierId);
                ladeGruppenTabellen(aktuelleTurnierId);
            }, 500);

        } else {
            alert('❌ Fehler beim Speichern!');
        }
    } catch (err) {
        console.error(err);
        alert('❌ Verbindungsfehler!');
    }
}

// ============================================
// ERGEBNISSE - Uhrzeit speichern
// ============================================
async function speichereUhrzeit(spielId) {
    const uhrzeit = document.getElementById(`uhrzeit-${spielId}`).value;

    if (!uhrzeit) {
        alert('⚠️ Bitte eine Uhrzeit wählen!');
        return;
    }

    try {
        const res = await fetch(`/api/spiele/${spielId}/uhrzeit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uhrzeit })
        });

        if (res.ok) {
            alert(`✅ Uhrzeit ${uhrzeit} gespeichert!`);
        } else {
            alert('❌ Fehler!');
        }
    } catch (err) {
        console.error(err);
    }
}

// ============================================
// LIVE TICKER - Event senden
// ============================================
function sendeLiveTicker(spielId, heimTore, gastTore) {
    const events = JSON.parse(
        localStorage.getItem('liveTicker') || '[]'
    );

    events.unshift({
        id:        Date.now(),
        spielId,
        heimTore,
        gastTore,
        zeit:      new Date().toLocaleTimeString('de-DE')
    });

    // Nur die letzten 20 Events behalten
    localStorage.setItem('liveTicker', JSON.stringify(events.slice(0, 20)));
    aktualisiereLiveTicker();
}

// ============================================
// LIVE TICKER - Anzeige aktualisieren
// ============================================
function aktualisiereLiveTicker() {
    const container = document.getElementById('live-ticker');
    if (!container) return;

    const events = JSON.parse(
        localStorage.getItem('liveTicker') || '[]'
    );

    if (events.length === 0) {
        container.innerHTML = `
            <p style="color:#888; text-align:center; padding:20px;">
                ⏳ Noch keine Ergebnisse...
            </p>`;
        return;
    }

    container.innerHTML = events.map(e => `
        <div style="display:flex; align-items:center; gap:10px;
                    background:#f0f0f0; border-radius:8px;
                    padding:10px 14px; margin-bottom:8px;
                    border-left:3px solid #e94560;
                    animation: fadeIn 0.5s ease;">
            
            <span style="color:#e94560; font-size:1.2rem;">⚽</span>
            
            <div style="flex:1;">
                <span style="font-weight:bold;">
                    Spiel #${e.spielId}
                </span>
                <span style="background:#0f3460; border-radius:4px;
                             padding:2px 8px; margin:0 8px;
                             font-weight:bold; color:#e94560;">
                    ${e.heimTore} : ${e.gastTore}
                </span>
            </div>

            <span style="color:#888; font-size:0.8rem;">
                🕐 ${e.zeit}
            </span>
        </div>
    `).join('');
}

// ============================================
// LIVE TICKER - Auto starten
// ============================================
function starteLiveTicker() {
    aktualisiereLiveTicker();

    // Alle 5 Sekunden prüfen
    setInterval(aktualisiereLiveTicker, 5000);
}
