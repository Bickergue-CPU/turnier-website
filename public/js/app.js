// =============================================
// APP.JS – Angepasst an Server API
// =============================================

const API = 'http://localhost:3000/api';

document.addEventListener("DOMContentLoaded", function() {
    zeigeOrte();

    const kaderBtn = document.getElementById("btnKaderlisten");
    if (kaderBtn) {
        kaderBtn.addEventListener("click", function() {
            const sidebar = document.getElementById("sidebarWorkplace");
            if (!sidebar) return;
            const isVisible = sidebar.style.display === "flex";
            hideAllSections();
            if (!isVisible) {
                sidebar.style.display = "flex";
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const pdf = params.get("pdf");
    if (pdf) showPDF(pdf, false);
});

// =============================================
// PDF ANZEIGEN
// =============================================

function showPDF(pfad) {
    const viewer    = document.getElementById("pdfViewer");
    const container = document.getElementById("mainContainer");
    const controls  = document.getElementById("pdfControls");
    const download  = document.getElementById("downloadBtn");
    const scroll    = document.getElementById("mainScroll");
    const content   = document.getElementById("mainContent");

    if (!viewer || !container) return;

    if (scroll)   scroll.style.display = "none";
    if (content)  content.style.display = "none";

    viewer.src       = pfad;
    download.href    = pfad;
    container.style.display = "block";
    controls.style.display  = "flex";
}

function hidePDF() {
    const viewer    = document.getElementById("pdfViewer");
    const container = document.getElementById("mainContainer");
    const controls  = document.getElementById("pdfControls");
    const scroll    = document.getElementById("mainScroll");

    if (viewer)    viewer.src = "";
    if (container) container.style.display = "none";
    if (controls)  controls.style.display  = "none";
    if (scroll)    scroll.style.display    = "block";
}

// =============================================
// ALLE SEKTIONEN VERSTECKEN
// =============================================

function hideAllSections() {
    const ids = [
        "mainContainer", "pdfControls", "mainContent",
        "sidebarContent", "sidebarWorkplace"
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    const scroll = document.getElementById("mainScroll");
    if (scroll) scroll.style.display = "block";
}

// =============================================
// ORTE ANZEIGEN – von Server API
// =============================================

async function zeigeOrte() {
    const container = document.getElementById("orteContainer");
    if (!container) return;
    container.innerHTML = "";

    try {
        const res  = await fetch(`${API}/orte`);
        const orte = await res.json();

        if (!orte || orte.length === 0) {
            container.innerHTML = "<p>Keine Orte gefunden</p>";
            return;
        }

        orte.forEach((ort) => {
            const button = document.createElement("button");
            button.textContent = "📍 " + ort.name;
            button.classList.add("btn", "ort-button");
            button.onclick = () => {
                setActiveButton(button, ".ort-button");
                ortAuswaehlen(ort);
            };
            container.appendChild(button);
        });

    } catch (err) {
        console.error('Fehler beim Laden der Orte:', err);
        container.innerHTML = "<p>Server nicht erreichbar!</p>";
    }
}

// =============================================
// ORT AUSWÄHLEN
// =============================================

function ortAuswaehlen(ort) {
    hideAllSections();
    zeigeOrtDetails(ort);
}

// =============================================
// ORT DETAILS – Turniere vom Server laden
// =============================================

async function zeigeOrtDetails(ort) {
    const container = document.getElementById("sidebarContent");
    if (!container) return;

    container.style.display = "block";
    container.innerHTML = "<p>Wird geladen...</p>";

    try {
        const res      = await fetch(`${API}/turniere`);
        const turniere = await res.json();

        const ortTurniere = turniere.filter(t => t.ort_id === ort.id);

        if (ortTurniere.length === 0) {
            container.innerHTML = `<p>Keine Turniere für <strong>${ort.name}</strong></p>`;
            return;
        }

        let html = `<h4>📍 ${ort.name}</h4>`;
        ortTurniere.forEach(t => {
            html += `
                <button class="btn turnier-button" 
                    onclick="zeigeTurnierGruppen(${t.id}, '${t.altersgruppe}')">
                    🏆 ${t.altersgruppe}
                </button>`;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error('Fehler:', err);
        container.innerHTML = "<p>Fehler beim Laden!</p>";
    }
}

// =============================================
// TURNIER GRUPPEN ANZEIGEN
// =============================================

async function zeigeTurnierGruppen(turnierId, turnierName) {
    const main = document.getElementById("mainContent");
    if (!main) return;

    main.style.display = "block";
    main.innerHTML = "<p>Wird geladen...</p>";

    const scroll = document.getElementById("mainScroll");
    if (scroll) scroll.style.display = "none";

    try {
        const res     = await fetch(`${API}/gruppen?turnier_id=${turnierId}`);
        const gruppen = await res.json();

        if (gruppen.length === 0) {
            main.innerHTML = `<h3>${turnierName}</h3><p>Keine Gruppen vorhanden</p>`;
            return;
        }

        let html = `<h3>🏆 ${turnierName}</h3><div class="gruppen-buttons">`;
        gruppen.forEach(g => {
            html += `
                <button class="btn gruppe-button"
                    onclick="zeigeGruppeDetail(${g.id}, '${g.name}')">
                    ${g.name}
                </button>`;
        });
        html += `</div><div id="gruppeDetail"></div>`;

        main.innerHTML = html;

    } catch (err) {
        console.error('Fehler:', err);
        main.innerHTML = "<p>Fehler beim Laden!</p>";
    }
}

// =============================================
// GRUPPE DETAIL ANZEIGEN
// =============================================

async function zeigeGruppeDetail(gruppeId, gruppeName) {
    const detail = document.getElementById("gruppeDetail");
    if (!detail) return;

    detail.innerHTML = "<p>Wird geladen...</p>";

    try {
        const [spieleRes, tabRes] = await Promise.all([
            fetch(`${API}/spiele?gruppe_id=${gruppeId}`),
            fetch(`${API}/tabelle?gruppe_id=${gruppeId}`)
        ]);

        const spiele  = await spieleRes.json();
        const tabelle = await tabRes.json();

        let html = `<h4>📊 ${gruppeName}</h4>`;

        // Tabelle
        if (tabelle.length > 0) {
            html += `
                <table class="tabelle">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Team</th>
                            <th>Sp</th>
                            <th>S</th>
                            <th>U</th>
                            <th>N</th>
                            <th>Tore</th>
                            <th>Pkt</th>
                        </tr>
                    </thead>
                    <tbody>`;
            tabelle.forEach((row, i) => {
                html += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${row.team_name}</td>
                        <td>${row.spiele}</td>
                        <td>${row.siege}</td>
                        <td>${row.unentschieden}</td>
                        <td>${row.niederlagen}</td>
                        <td>${row.tore_plus}:${row.tore_minus}</td>
                        <td><strong>${row.punkte}</strong></td>
                    </tr>`;
            });
            html += `</tbody></table>`;
        }

        detail.innerHTML = html;

    } catch (err) {
        console.error('Fehler:', err);
        detail.innerHTML = "<p>Fehler beim Laden!</p>";
    }
}

// =============================================
// AKTIVEN BUTTON SETZEN
// =============================================

function setActiveButton(clickedButton, selector) {
    document.querySelectorAll(selector).forEach(btn => {
        btn.classList.remove("active");
    });
    clickedButton.classList.add("active");
}

// =============================================
// ADMIN BEREICH LADEN
// =============================================

async function zeigeAdmin() {
    const main     = document.getElementById("mainContainer");
    const controls = document.getElementById("pdfControls");
    const content  = document.getElementById("mainContent");
    const scroll   = document.getElementById("mainScroll");
    const orte     = document.getElementById("orteContainer");

    if (main)     main.style.display = "none";
    if (controls) controls.style.display = "none";
    if (scroll)   scroll.style.display = "none";
    if (orte)     orte.style.display = "none";

    if (!content) return;

    const response = await fetch("admin.html");
    const html     = await response.text();

    content.style.display = "block";
    content.innerHTML = html;

    // Altes Script entfernen
    const old = document.getElementById("adminScript");
    if (old) old.remove();

    // Admin Script neu laden
    const script = document.createElement("script");
    script.src = "js/admin.js";
    script.id  = "adminScript";

    // ✅ NACH dem Laden die init-Funktion aufrufen
script.onload = function() {
    initAdmin();
};
    document.body.appendChild(script);
}

// =============================================
// ZUSCHAUERBEREICH / ZURÜCK ZUR ÜBERSICHT
// =============================================

function zeigeTurnierUebersicht() {
    const mainContent   = document.getElementById("mainContent");
    const mainContainer = document.getElementById("mainContainer");
    const pdfControls   = document.getElementById("pdfControls");
    const sidebarContent = document.getElementById("sidebarContent");
    const orte  = document.getElementById("orteContainer");
    const scroll = document.getElementById("mainScroll");

    if (mainContent)    { mainContent.style.display = "none"; mainContent.innerHTML = ""; }
    if (mainContainer)  mainContainer.style.display = "none";
    if (pdfControls)    pdfControls.style.display = "none";
    if (sidebarContent) { sidebarContent.style.display = "none"; sidebarContent.innerHTML = ""; }
    if (orte)   orte.style.display = "flex";
    if (scroll) scroll.style.display = "block";

    zeigeOrte();
}

// =============================================
// GLOBAL VERFÜGBAR MACHEN
// =============================================

window.showPDF              = showPDF;
window.hidePDF              = hidePDF;
window.zeigeAdmin           = zeigeAdmin;
window.zeigeTurnierUebersicht = zeigeTurnierUebersicht;
window.zeigeTurnierGruppen  = zeigeTurnierGruppen;
window.zeigeGruppeDetail    = zeigeGruppeDetail;
