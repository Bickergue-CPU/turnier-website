import { loadOrte } from "./dataService.js";

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
// ORTE ANZEIGEN
// =============================================

async function zeigeOrte() {
    const container = document.getElementById("orteContainer");
    if (!container) return;
    container.innerHTML = "";
    const data = await loadOrte();
    if (!data || !data.orte || data.orte.length === 0) {
        container.innerHTML = "<p>Keine Orte gefunden</p>";
        return;
    }
    data.orte.forEach((ort) => {
        const button = document.createElement("button");
        button.textContent = ort.name;
        button.classList.add("btn", "ort-button");
        button.onclick = () => {
            setActiveButton(button, ".ort-button");
            ortAuswaehlen(ort);
        };
        container.appendChild(button);
    });
}

// =============================================
// ORT AUSWÄHLEN
// =============================================

function ortAuswaehlen(ort) {
    hideAllSections();
    zeigeOrtDetails(ort);
}

// =============================================
// ORT DETAILS IN SIDEBAR
// =============================================

function zeigeOrtDetails(ort) {
    const container = document.getElementById("sidebarContent");
    if (!container) return;
    container.style.display = "block";
    container.innerHTML = "";
    const turniere = ort.turniere || [];
    const box = document.createElement("div");
    box.classList.add("info-block");
    const title = document.createElement("h4");
    title.textContent = "Turnier in";
    const ortName = document.createElement("div");
    ortName.style.textAlign = "center";
    ortName.style.marginBottom = "10px";
    ortName.style.fontWeight = "bold";
    ortName.textContent = ort.name;
    box.appendChild(title);
    box.appendChild(ortName);
    if (!turniere.length) {
        const p = document.createElement("p");
        p.textContent = "Keine Turniere vorhanden";
        box.appendChild(p);
    } else {
        turniere.forEach(t => {
            const btn = document.createElement("button");
            btn.classList.add("btn", "altersklasse-button");
            btn.textContent = t.altersklasse;
            btn.addEventListener("click", () => {
                setActiveButton(btn, ".altersklasse-button");
                zeigeUntergruppen(t, box);
            });
            box.appendChild(btn);
        });
    }
    container.appendChild(box);
}

// =============================================
// UNTERGRUPPEN ANZEIGEN
// =============================================

function zeigeUntergruppen(turnier, parentBox) {
    const alte = parentBox.querySelector(".untergruppen-box");
    if (alte) alte.remove();
    const uBox = document.createElement("div");
    uBox.classList.add("untergruppen-box");
    uBox.style.marginTop = "10px";
    const title = document.createElement("div");
    title.textContent = "Gruppen:";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "5px";
    uBox.appendChild(title);
    const untergruppen = turnier.untergruppen || [];
    if (untergruppen.length > 0) {
        untergruppen.forEach(u => {
            const btn = document.createElement("button");
            btn.classList.add("btn", "gruppen-button");
            btn.textContent = u === "Finalrunde" ? "Finalrunde" : "Gruppe " + u;
            btn.addEventListener("click", () => {
                setActiveButton(btn, ".gruppen-button");
                const name = u === "Finalrunde" ? "Finalrunde" : "Gruppe " + u;
                zeigePlatzhalter(name);
            });
            uBox.appendChild(btn);
        });
    } else {
        const btn = document.createElement("button");
        btn.classList.add("btn", "gruppen-button");
        btn.textContent = "Finalrunde";
        btn.addEventListener("click", () => {
            setActiveButton(btn, ".gruppen-button");
            zeigePlatzhalter("Finalrunde");
        });
        uBox.appendChild(btn);
    }
    parentBox.appendChild(uBox);
}

// =============================================
// PLATZHALTER ANZEIGEN
// =============================================

function zeigePlatzhalter(gruppenName) {
    const main = document.getElementById("mainContainer");
    const controls = document.getElementById("pdfControls");
    const content = document.getElementById("mainContent");
    const scroll = document.getElementById("mainScroll");
    if (main) main.style.display = "none";
    if (controls) controls.style.display = "none";
    if (scroll) scroll.style.display = "none";
    if (content) {
        content.style.display = "block";
        content.innerHTML = `
            <div style="padding:20px; text-align:center;">
                <h3>${gruppenName}</h3>
                <p>Kein PDF vorhanden.</p>
            </div>
        `;
    }
}

// =============================================
// PDF ANZEIGEN
// =============================================

function showPDF(path, updateURL = true) {
    const viewer = document.getElementById("pdfViewer");
    const controls = document.getElementById("pdfControls");
    const main = document.getElementById("mainContainer");
    const content = document.getElementById("mainContent");
    const scroll = document.getElementById("mainScroll");
    const downloadBtn = document.getElementById("downloadBtn");

    if (scroll) scroll.style.display = "none";
    if (content) { content.style.display = "none"; content.innerHTML = ""; }
    // ← orte wird hier NICHT mehr ausgeblendet!

    if (viewer) viewer.src = path;
    if (main) main.style.display = "flex";
    if (controls) controls.style.display = "flex";
    if (downloadBtn) downloadBtn.href = path;
}

// =============================================
// PDF VERSTECKEN
// =============================================

function hidePDF() {
    const viewer = document.getElementById("pdfViewer");
    const controls = document.getElementById("pdfControls");
    const main = document.getElementById("mainContainer");
    const scroll = document.getElementById("mainScroll");
    const orte = document.getElementById("orteContainer"); // ← NEU

    if (viewer) viewer.src = "";
    if (controls) controls.style.display = "none";
    if (main) main.style.display = "none";
    if (scroll) scroll.style.display = "block";
    if (orte) orte.style.display = "flex";
}

// =============================================
// ALLE SEKTIONEN VERSTECKEN
// =============================================

function hideAllSections() {
    const main = document.getElementById("mainContainer");
    const controls = document.getElementById("pdfControls");
    const content = document.getElementById("mainContent");
    const scroll = document.getElementById("mainScroll");
    const orte = document.getElementById("orteContainer"); // ← NEU

    if (main) main.style.display = "none";
    if (controls) controls.style.display = "none";
    if (content) { content.style.display = "none"; content.innerHTML = ""; }
    if (scroll) scroll.style.display = "none";
    if (orte) orte.style.display = "flex"; // ← NEU wieder anzeigen
}

// =============================================
// ACTIVE BUTTON
// =============================================

function setActiveButton(clickedButton, group) {
    document.querySelectorAll(group).forEach(btn => {
        btn.classList.remove("active");
    });
    clickedButton.classList.add("active");
}

// =============================================
// GLOBAL
// =============================================

window.showPDF = showPDF;
window.hidePDF = hidePDF;
