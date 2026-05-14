import { loadOrte, saveOrte } from "./dataService.js";

// ✅ Gruppenlogik
function berechneGruppen(anzahlTeams) {
    if (anzahlTeams <= 7) {
        return { typ: "finalrunde", gruppen: 1 };
    } else if (anzahlTeams <= 12) {
        return { typ: "gruppen", gruppen: 2 };
    } else if (anzahlTeams <= 18) {
        return { typ: "gruppen", gruppen: 3 };
    } else if (anzahlTeams <= 24) {
        return { typ: "gruppen", gruppen: 4 };
    } else {
        return { typ: "gruppen", gruppen: 5 };
    }
}

// ✅ Eingabefelder erstellen
function erstelleEingabefelder() {
    const anzahl = parseInt(document.getElementById("anzahlOrte").value) || 0;
    const container = document.getElementById("eingabeContainer");
    container.innerHTML = "";

    for (let i = 0; i < anzahl; i++) {
        const input = document.createElement("input");
        input.placeholder = "Ort " + (i + 1);
        container.appendChild(input);
    }
}

// ✅ Orte speichern
async function speichern() {
    const inputs = document.querySelectorAll("#eingabeContainer input");
    const neueOrte = [];

    inputs.forEach(input => {
        const name = input.value.trim();
        if (name !== "") {
            neueOrte.push({
                name: name,
                turniere: []
            });
        }
    });

    saveOrte({ orte: neueOrte });

    document.getElementById("turnierTitel").innerText = "";
    document.getElementById("altersgruppenContainer").innerHTML = "";
    document.getElementById("vereineContainer").innerHTML = "";
    document.getElementById("eingabeContainer").innerHTML = "";

    await zeigeOrte();
    zeigeTurniere();
    resetTurnierBearbeiten();
}

// ✅ Orte anzeigen
async function zeigeOrte() {
    const container = document.getElementById("orteContainer");
    container.innerHTML = "";

    const data = await loadOrte();

    (data.orte || []).forEach((ort, index) => {
        const div = document.createElement("div");
        div.className = "ort-item";

        div.innerHTML = `
            <span class="ort-name" data-index="${index}">
                ${ort.name}
            </span>
            <div class="actions">
                <button class="edit-btn" data-index="${index}">✏️</button>
                <button class="delete-btn" data-index="${index}">❌</button>
            </div>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll(".ort-name").forEach(el => {
        el.addEventListener("click", (e) => {
            ortAuswaehlen(e.target.dataset.index);
        });
    });

    document.querySelectorAll(".edit-btn").forEach(el => {
        el.addEventListener("click", (e) => {
            ortBearbeiten(e.target.dataset.index);
        });
    });

    document.querySelectorAll(".delete-btn").forEach(el => {
        el.addEventListener("click", (e) => {
            ortLoeschen(e.target.dataset.index);
        });
    });
}

// ✅ Ort bearbeiten
async function ortBearbeiten(index) {
    const data = await loadOrte();
    const neuerName = prompt("Neuer Name:", data.orte[index].name);

    if (!neuerName || neuerName.trim() === "") return;

    data.orte[index].name = neuerName.trim();
    saveOrte(data);

    await zeigeOrte();
    zeigeTurniere();
}

// ✅ Ort löschen
async function ortLoeschen(index) {
    const data = await loadOrte();

    if (confirm("Wirklich löschen?")) {
        data.orte.splice(index, 1);
        saveOrte(data);

        await zeigeOrte();
        zeigeTurniere();
    }
}

// ✅ Ort auswählen
async function ortAuswaehlen(index) {
    const data = await loadOrte();
    const ort = data.orte[index];

    document.getElementById("turnierTitel").innerText =
        "Turnier für: " + ort.name;

    const altersklassen = [
        "U06","U07","U08","U09","U10","U11",
        "U12","U13","U14","U15","U16","U17","U18"
    ];

    zeigeAltersklassenMitEingabe(altersklassen);
    localStorage.setItem("aktuellesTurnier", index);
}

// ✅ Turniere anzeigen
async function zeigeTurniere() {
    const container = document.getElementById("anzeigeContainer");
    container.innerHTML = "";

    const data = await loadOrte();

    (data.orte || []).forEach(ort => {
        const div = document.createElement("div");

        const titel = document.createElement("h4");
        titel.textContent = ort.name;

        const liste = document.createElement("p");

        if (!ort.turniere || ort.turniere.length === 0) {
            liste.textContent = "Keine Turniere";
        } else {
            liste.innerHTML = ort.turniere.map(t => {
                if (t.gruppen.typ === "finalrunde") {
                    return `${t.altersklasse} (${t.anzahlTeams} Teams, Finalrunde)`;
                }
                return `${t.altersklasse} (${t.anzahlTeams} Teams, ${t.untergruppen.join(", ")})`;
            }).join("<br>");
        }

        div.appendChild(titel);
        div.appendChild(liste);
        container.appendChild(div);
    });
}

// ✅ Altersklassen UI
function zeigeAltersklassenMitEingabe(altersklassen) {
    const container = document.getElementById("vereineContainer");
    container.innerHTML = "";

    altersklassen.forEach(ak => {
        const div = document.createElement("div");

        div.innerHTML = `
            <label>
                <input type="checkbox" id="check_${ak}">
                ${ak}
            </label>
            <div id="bereich_${ak}" style="display:none; margin-left:20px;">
                Anzahl Vereine:
                <input type="number" min="5" max="30" id="anzahl_${ak}">
                <div id="gruppen_${ak}"></div>
                <div id="teams_${ak}"></div>
            </div>
        `;

        container.appendChild(div);

        const checkbox = document.getElementById(`check_${ak}`);
        const bereich = document.getElementById(`bereich_${ak}`);

        checkbox.addEventListener("change", () => {
            bereich.style.display = checkbox.checked ? "block" : "none";
        });

        document.getElementById(`anzahl_${ak}`)
            .addEventListener("input", (e) => {
                const anzahl = parseInt(e.target.value) || 0;
                updateGruppenAnzeige(ak);
                generiereTeams(ak, anzahl);
            });
    });
}

// ✅ Gruppenanzeige
function updateGruppenAnzeige(ak) {
    const input = document.getElementById(`anzahl_${ak}`);
    const anzahl = parseInt(input.value) || 0;
    const container = document.getElementById(`gruppen_${ak}`);

    if (anzahl < 5) {
        container.innerHTML = "";
        return;
    }

    const info = berechneGruppen(anzahl);

    if (info.typ === "finalrunde") {
        container.innerHTML = "<b>Finalrunde</b>";
    } else {
        let html = "<b>Gruppen:</b><br>";
        for (let i = 0; i < info.gruppen; i++) {
            html += "Gruppe " + String.fromCharCode(65 + i) + "<br>";
        }
        container.innerHTML = html;
    }
}

// ✅ Teams generieren
function generiereTeams(ak, anzahl) {
    const container = document.getElementById(`teams_${ak}`);
    container.innerHTML = "";

    for (let i = 0; i < anzahl; i++) {
        const input = document.createElement("input");
        input.placeholder = ak + " Team " + (i + 1);
        input.classList.add(`team_${ak}`);
        container.appendChild(input);
    }
}

// ✅ Turnier speichern
async function turnierSpeichern() {
    const ortIndex = localStorage.getItem("aktuellesTurnier");
    if (ortIndex === null) return;

    const data = await loadOrte();
    const ort = data.orte[ortIndex];

    const altersklassen = [
        "U06","U07","U08","U09","U10","U11",
        "U12","U13","U14","U15","U16","U17","U18"
    ];

    const turniere = [];
    let fehlerGesamt = false;

    altersklassen.forEach(ak => {
        const checkbox = document.getElementById(`check_${ak}`);
        if (!checkbox || !checkbox.checked) return;

        const input = document.getElementById(`anzahl_${ak}`);
        const anzahl = input ? parseInt(input.value) || 0 : 0;

        if (anzahl < 5) return;

        const teamInputs = document.querySelectorAll(`.team_${ak}`);
        const teams = [];

        teamInputs.forEach(t => {
            const name = t.value.trim();
            if (name !== "") teams.push(name);
        });

        if (teams.length !== anzahl) {
            alert(`Bitte alle ${anzahl} Teams für ${ak} eingeben!`);
            fehlerGesamt = true;
            return;
        }

        const gruppenInfo = berechneGruppen(anzahl);
        let untergruppen = [];

        if (gruppenInfo.typ !== "finalrunde") {
            for (let i = 0; i < gruppenInfo.gruppen; i++) {
                untergruppen.push(String.fromCharCode(65 + i));
            }
        }

        turniere.push({
            altersklasse: ak,
            anzahlTeams: anzahl,
            gruppen: gruppenInfo,
            untergruppen: untergruppen,
            teams: teams
        });
    });

    if (fehlerGesamt) return;

    ort.turniere = turniere;
    saveOrte(data);

    zeigeTurniere();
    alert("Turnier gespeichert ✅");
}

// ✅ Reset
function resetTurnierBearbeiten() {
    document.getElementById("turnierTitel").innerText = "";
    document.getElementById("altersgruppenContainer").innerHTML = "";
    document.getElementById("vereineContainer").innerHTML = "";

    const select = document.getElementById("turnierAuswahl");
    if (select) select.value = "";

    localStorage.removeItem("aktuellesTurnier");
}

// ✅ Start
document.addEventListener("DOMContentLoaded", async () => {
    await zeigeOrte();
    await zeigeTurniere();

    document.getElementById("erstellenBtn")
        .addEventListener("click", erstelleEingabefelder);

    document.getElementById("speichernBtn")
        .addEventListener("click", speichern);

    document.getElementById("turnierSpeichernBtn")
        ?.addEventListener("click", turnierSpeichern);
});

window.ortAuswaehlen = ortAuswaehlen;
window.ortBearbeiten = ortBearbeiten;
window.ortLoeschen = ortLoeschen;
