function generiereSpielplan(teams, config) {
    const {
        startzeit,      // z.B. "09:00"
        spielzeit,      // z.B. 10 (Minuten)
        wechselpause,   // z.B. 2 (Minuten)
        turnierpause_nach,  // z.B. 4 (nach X Spielen)
        turnierpause_dauer  // z.B. 15 (Minuten)
    } = config;

    // Alle Spiele erstellen (jeder gegen jeden)
    const spiele = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            spiele.push({
                team_links: teams[i],
                team_rechts: teams[j]
            });
        }
    }

    // Uhrzeiten berechnen
    let aktuelleZeit = zeitZuMinuten(startzeit);
    let spielNummer = 0;

    const spieleMitZeit = spiele.map(spiel => {
        spielNummer++;

        // Turnierpause einbauen
        if (turnierpause_nach > 0 && spielNummer > 1 && (spielNummer - 1) % turnierpause_nach === 0) {
            aktuelleZeit += turnierpause_dauer;
        }

        const uhrzeit = minutenZuZeit(aktuelleZeit);
        aktuelleZeit += spielzeit + wechselpause;

        return {
            ...spiel,
            spiel_nr: spielNummer,
            uhrzeit
        };
    });

    return spieleMitZeit;
}

// HILFSFUNKTIONEN
function zeitZuMinuten(zeit) {
    const [stunden, minuten] = zeit.split(':').map(Number);
    return stunden * 60 + minuten;
}

function minutenZuZeit(minuten) {
    const std = Math.floor(minuten / 60);
    const min = minuten % 60;
    return `${String(std).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

module.exports = { generiereSpielplan };
