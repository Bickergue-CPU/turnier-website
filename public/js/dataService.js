// ==========================
// DATA SERVICE
// ==========================

const dataService = {

    // -----------------------------------------------
    // ORTE
    // -----------------------------------------------
    getOrte() {
        const local = localStorage.getItem("orteData");
        if (local) {
            const data = JSON.parse(local);
            // Falls Array direkt oder Objekt mit .orte
            return Array.isArray(data) ? data : (data.orte || []);
        }
        return [];
    },

    saveOrte(orte) {
        localStorage.setItem("orteData", JSON.stringify(orte));
    },

    // -----------------------------------------------
    // TURNIERE
    // -----------------------------------------------
    getTurniere() {
        const local = localStorage.getItem("turniereData");
        if (local) return JSON.parse(local);
        return [];
    },

    saveTurnier(turnier) {
        const turniere = this.getTurniere();
        turniere.push(turnier);
        localStorage.setItem("turniereData", JSON.stringify(turniere));
    },

    updateTurnier(turnier) {
        const turniere = this.getTurniere();
        const index = turniere.findIndex(t => t.id === turnier.id);
        if (index !== -1) {
            turniere[index] = turnier;
            localStorage.setItem("turniereData", JSON.stringify(turniere));
        }
    },

    deleteTurnier(id) {
        const turniere = this.getTurniere();
        const gefiltert = turniere.filter(t => t.id !== id);
        localStorage.setItem("turniereData", JSON.stringify(gefiltert));
    },

    // -----------------------------------------------
    // SPIELE
    // -----------------------------------------------
    getSpiele() {
        const local = localStorage.getItem("spieleData");
        if (local) return JSON.parse(local);
        return [];
    },

    saveSpiele(spiele) {
        localStorage.setItem("spieleData", JSON.stringify(spiele));
    },

    clearSpiele() {
        localStorage.removeItem("spieleData");
    }
};
