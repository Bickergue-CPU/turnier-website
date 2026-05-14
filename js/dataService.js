// ==========================
// DATA SERVICE
// ==========================

export async function loadOrte() {
    // Zuerst localStorage prüfen (Admin-Daten)
    const local = localStorage.getItem("orteData");
    if (local) {
        return JSON.parse(local);
    }

    // Sonst JSON Datei laden
    try {
        const response = await fetch("data/orte-data.json");
        const data = await response.json();
        return data;
    } catch (e) {
        console.error("Fehler beim Laden der Orte:", e);
        return { anzahl: 0, orte: [] };
    }
}

export function saveOrte(data) {
    localStorage.setItem("orteData", JSON.stringify(data));
}
