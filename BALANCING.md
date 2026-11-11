# Piano di bilanciamento v0.2 — integrato dalle regole 0.3

I coefficienti di personale, automazione e talenti ora implementati sono descritti in `WORKFORCE.md`. La produzione nominale di questo documento va moltiplicata per l’operatività della struttura; i tempi delle code dipendono dal personale. `BALANCE_REPORT.json` è stato rigenerato con queste regole.

Questa è una base di bilanciamento implementata e verificabile, non una dichiarazione di equilibrio competitivo raggiunto. Tutti i valori derivano da balance.mjs; balance-audit.mjs genera il rapporto riproducibile BALANCE_REPORT.json. L'universo online usa il profilo live ×1. Il profilo sandbox ×20 accelera produzione e tempi in un universo di prova separato; mantiene prerequisiti e rapporti economici. Non alternare profili sullo stesso mondo competitivo.

## Obiettivi e ritmo

- Nei primi 10 minuti: prime espansioni economiche e Centro operativo 2, con una ricognizione avviabile subito.
- Nelle prime ore: raggio locale, raccolta, laboratorio, studio e prime catture con tre Ball iniziali.
- Entro la prima giornata: filiera propria delle Ball e specializzazioni scientifiche.
- Giorni successivi: squadre da due e tre membri, scanner, infermeria, Mega Ball e logistica.
- Medio periodo: specie complesse, strumenti avanzati, raggio maggiore. Nessuna cattura precoce dei leggendari grazie ai requisiti dedicati.

Sono obiettivi di design da misurare con giocatori reali. Non sono promesse di durata né tempi ottimali calcolati.

## Dotazione e risorse

Nuovo avamposto: Centro operativo, Cava, Coltivazioni e Centrale solare al livello 1; tutte le altre strutture a 0; tutte le ricerche a 0. Scorte: 550 materiali, 350 cibo, 100 reagenti e 200 crediti. Tre Poké Ball, due pozioni, uno starter e un solo membro attivo.

Materiali: strutture e strumenti. Cibo: spedizioni, cure e habitat. Reagenti: laboratorio e strumenti. Crediti: finanziamento sul campo e componenti. L'energia è una capacità, non una quinta scorta. Il mercato è bloccato fino al Deposito logistico 1; niente scorciatoia iniziale mediante acquisto di strumenti.

## Energia come capacità

Potenza della centrale: floor(30 × livello × 1,1^(livello−1) × (1 + 0,05 × Energetica) × regolazione).

Consumo nominale: Cava 10 × L × 1,1^(L−1), Coltivazioni 8 × L × 1,1^(L−1), Estrattore reagenti 14 × L × 1,1^(L−1), ciascuno moltiplicato per la regolazione da 0 a 100%. Richiesta complessiva arrotondata all'intero superiore.

Efficienza = min(1, potenza prodotta / richiesta), oppure 1 se non esistono carichi. Tutti gli estrattori ricevono questo fattore proporzionale. L'interfaccia mostra bilancio e produzione: +12 / 30 indica 30 prodotti, 18 richiesti e 12 liberi; il surplus non viene immagazzinato.

Nessun costo, bottino, premio, carico, ricetta o mercato può consumare o consegnare energia. Alcune ricerche richiedono una soglia di potenza come prerequisito, senza spenderla. I vecchi premi e depositi di energia vengono convertiti in reagenti.

Per evitare blocchi irreversibili, i rifornimenti base rimangono 20 materiali/h, 12 cibo/h e 4 reagenti/h anche con impianti fermi. Queste piccole entrate non sono moltiplicate dall'efficienza energetica.

## Produzione e capacità

Produzione nominale oraria: Cava 60 × L × 1,1^(L−1); Coltivazioni 40 × L × 1,1^(L−1); Estrattore reagenti 24 × L × 1,1^(L−1). Si applicano regolazione ed efficienza, poi bonus Ecologia (+3% per livello al cibo delle coltivazioni) e Analisi (+5% per livello ai reagenti dell'estrattore).

Capienza per risorsa = floor(2000 × 1,7^Magazzino). Nessuna crescita illimitata offline oltre capienza. Eventuali scorte pregresse oltre il nuovo limite sono conservate; la produzione resta sospesa finché non scendono sotto il tetto. Habitat = 3 + 9 × livello posti. Squadra = min(3, 1 + floor(Habitat/2)): secondo membro ad Habitat 2, terzo ad Habitat 4.

## Strutture e sblocchi

Le colonne riportano il costo base da 0 a 1; ogni successivo livello moltiplica il costo per il fattore. Le dotazioni già presenti al livello 1 pagano quindi il costo del livello 2 per il primo miglioramento. I requisiti possono aumentare ai livelli successivi.

| Struttura | Costo base | Fattore | Requisiti del primo livello |
|---|---|---|---|
| Centro operativo | 220 materiali + 100 cibo + 20 reagenti | 1.65 | Dotazione iniziale |
| Cava | 60 materiali + 25 cibo | 1.55 | Dotazione iniziale |
| Coltivazioni | 45 materiali + 15 cibo | 1.55 | Dotazione iniziale |
| Centrale solare | 75 materiali + 12 reagenti | 1.6 | Dotazione iniziale |
| Estrattore reagenti | 180 materiali + 70 cibo | 1.65 | Centro operativo 2, Cava 2, Centrale solare 2 |
| Habitat | 140 materiali + 100 cibo | 1.7 | Centro operativo 2, Coltivazioni 2 |
| Laboratorio | 240 materiali + 70 reagenti + 20 crediti | 1.8 | Centro operativo 2, Estrattore reagenti 1 |
| Osservatorio | 200 materiali + 50 reagenti | 1.7 | Centro operativo 2, Laboratorio 1 |
| Magazzino | 160 materiali + 50 cibo | 1.65 | Centro operativo 2, Cava 2 |
| Officina | 280 materiali + 100 reagenti | 1.8 | Centro operativo 2, Laboratorio 1, Ecologia applicata 1 |
| Infermeria | 220 materiali + 150 cibo + 70 reagenti | 1.7 | Centro operativo 3, Habitat 2, Ecologia applicata 1 |
| Deposito logistico | 320 materiali + 120 cibo + 100 reagenti | 1.75 | Centro operativo 4, Magazzino 2, Officina 2, Logistica 1 |

Requisiti ulteriori: Centro operativo 2 richiede Cava 2 e Coltivazioni 2; livello 3 richiede Laboratorio 1; livello 5 Osservatorio 3; dal livello 8 Logistica 3. Laboratorio dal livello 2 richiede Energetica 1. Habitat 2 richiede Centro operativo 3 ed Ecologia 1; Habitat 4 richiede Centro operativo 5 ed Ecologia 3. Officina dal livello 2 richiede Centro operativo 3, Laboratorio 2 e Cattura 1. Altri livelli sono limitati dalla progressione del Centro operativo; controlli eseguiti dal server, non solo dall'interfaccia. Massimo 20.

## Tecnologie

| Tecnologia | Effetto | Requisiti | Costo iniziale | Fattore |
|---|---|---|---|---|
| Energetica | +5% potenza della centrale per livello. | Laboratorio 1, Centrale solare 2, potenza 60 | 80 materiali + 50 reagenti | 1.9 |
| Ecologia applicata | Sblocca studi e specie più complesse. +3% produzione alimentare per livello. | Laboratorio 1, Habitat 1 | 45 reagenti + 60 cibo | 1.85 |
| Estrazione efficiente | +10% carico raccolto per livello. | Laboratorio 1, Cava 3 | 100 materiali + 45 reagenti | 1.85 |
| Cartografia | Aumenta la difficoltà delle zone raggiungibili e abilita scanner. | Laboratorio 1, Osservatorio 1 | 80 materiali + 60 reagenti | 1.85 |
| Tecniche di cattura | +3 punti percentuali alla cattura e accesso a Ball avanzate. | Laboratorio 2, Officina 1, Ecologia applicata 1 | 100 materiali + 90 reagenti + 30 crediti | 1.9 |
| Tattiche di contenimento | +6% efficacia offensiva della squadra per livello. | Laboratorio 2, Habitat 2, Ecologia applicata 1 | 150 materiali + 80 reagenti | 1.9 |
| Logistica | +8% velocità di viaggio per livello. Abilita moduli di carico. | Laboratorio 3, Osservatorio 2, Cartografia 2 | 200 materiali + 120 reagenti | 1.95 |
| Analisi dei reagenti | +5% produzione di reagenti per livello. | Laboratorio 3, Estrattore reagenti 2, Ecologia applicata 2, potenza 140 | 180 materiali + 180 reagenti | 1.95 |

Limite: min(20, 2 × livello del Laboratorio). Una costruzione, una ricerca e un lotto di fabbricazione possono procedere in parallelo in strutture differenti. Il Laboratorio non può essere migliorato mentre ricerca; non si avviano ricerche durante i lavori al Laboratorio. Una struttura non può fabbricare e migliorarsi simultaneamente.

## Strumenti prodotti nelle strutture

| Strumento | Struttura | Requisiti | Costo unitario | Uso |
|---|---|---|---|---|
| Poké Ball | Officina | Officina 1 | 12 materiali + 6 reagenti + 2 crediti | Strumento base per una missione di cattura. |
| Mega Ball | Officina | Officina 3, Tecniche di cattura 3 | 30 materiali + 22 reagenti + 6 crediti | +8 punti percentuali di cattura rispetto alla Ball base. |
| Ultra Ball | Officina | Officina 6, Tecniche di cattura 6 | 65 materiali + 50 reagenti + 15 crediti | +15 punti percentuali di cattura. |
| Pozione | Infermeria | Infermeria 1, Ecologia applicata 1 | 35 cibo + 5 reagenti | Ripristina fino a 55 PS a ciascun membro alla base. |
| Esca di ricerca | Habitat | Habitat 2, Ecologia applicata 2 | 30 cibo + 12 reagenti | Consumabile: +5 punti percentuali in una cattura. |
| Scanner da campo | Osservatorio | Osservatorio 2, Cartografia 2 | 35 materiali + 25 reagenti | Consumabile: una ricognizione rivela anche le caselle adiacenti. |
| Modulo di carico | Deposito logistico | Deposito logistico 2, Officina 2, Logistica 2 | 8 materiali + 3 reagenti | Consumabile: +50% carico in una raccolta. |

Un lotto contiene da 1 a 20 unità. Costi detratti alla conferma; strumenti disponibili solo a fine lavorazione. Il tempo cresce linearmente con la quantità ed è ridotto del 15% per ogni livello della struttura oltre il primo, tramite il divisore 1 + 0,15 × (livello−1). Nessuna ricetta produce potenza elettrica da trasportare.

Ball e accessori vengono riservati alla partenza della missione. Il richiamo prima dell'operazione restituisce esattamente gli strumenti prenotati. Dopo la risoluzione, i consumabili sono utilizzati: nessun rimborso duplicato. Scanner: ricognizione estesa alle caselle adiacenti. Esche: +5 punti percentuali alla cattura. Moduli di carico: +50% carico della raccolta. Mega/Ultra Ball: +8/+15 punti percentuali. Il vantaggio va valutato con il costo del viaggio e la rarità dell'incontro, non solo sul costo della Ball.

## Missioni e progressione Pokémon

Ricognizione disponibile subito. Raccolta: Centro operativo 2 e Cava 2. Studio e cattura base: Laboratorio 1, Habitat 1 ed Ecologia 1. Contenimento: Habitat 2 e Tattiche 1. La ricerca Cattura migliora le probabilità e sblocca le fasce avanzate, ma non è necessaria per consumare le tre Ball iniziali su specie comuni.

Raggio = 3 + 2 × Osservatorio + Logistica. Difficoltà massima = 1 + floor(Centro operativo/2) + Cartografia. Velocità determinata dal più lento, con +8% per livello di Logistica. Viaggio minimo 45 secondi. Costo alimentare = costo della missione + ceil(2 × distanza) + 3 × membri.

Specie comuni: requisiti base. Fascia 2 (somma statistiche base ≥350): Centro operativo 4, Cattura 2, Ecologia 2. Fascia 3 (≥480): Centro operativo 6, Cattura 3, Ecologia 4. Leggendari: Centro operativo 9, Laboratorio 6, Cattura 6, Ecologia 6. Queste sono fasce di progressione dello strategico, non categorie canoniche Pokémon.

La raccolta base trasporta 15 unità per membro, con +10% per Estrazione e +8% per livello del Deposito; il modulo moltiplica il carico per 1,5. Giacimenti condivisi da 300 unità, rigenerazione dopo tre ore nel profilo live. Lo studio di una nuova specie paga 25 crediti e 10 reagenti una volta soltanto. Le ricognizioni nuove pagano 20 crediti e 8 reagenti; ripetere una casella nota non genera denaro infinito.

## Prima simulazione riproducibile

Scenario conservativo: solo produzione passiva, nessun reddito da missioni, nessun ottimizzatore o acquisto. La sequenza costruisce i prerequisiti minimi e non reinveste sistematicamente in tutta la produzione. Non è il percorso più veloce.

| Traguardo | Minuti simulati |
|---|---|
| Centro operativo 2 | 7 |
| Studio e cattura base sbloccati | 275 |
| Prima Ball fabbricata | 479 |
| Tecnologia Cattura 1 | 1052 |

L'audit prova raggiungibilità, disponibilità delle scorte e assenza di cicli nel percorso iniziale. Un ulteriore test percorre tutti i livelli fino al 20 e tutte le ricette con scorte di prova, verificando che nessun ramo richieda un prerequisito impossibile; questo secondo controllo riguarda l'albero, non i tempi economici. Non sono prove di retention, equilibrio PvP, ottimalità o assenza di strategie dominanti. Prima della beta, provare almeno tre profili reali: occasionale (due accessi/giorno), regolare (quattro accessi) e attivo (spedizioni frequenti). Raccogliere tempi effettivi ai primi sblocchi, strumenti spesi per cattura, ore in deficit, risorse ferme al tetto e distribuzione della collezione.

## Criteri per ritoccare i numeri

- Se la prima giornata è dominata dall'attesa, abbassare costi dei primi livelli o migliorare le ricompense scientifiche una tantum; non eliminare l'albero.
- Se tutti scelgono gli stessi edifici nello stesso ordine, introdurre alternative con utilità misurabile, non bonus gratuiti cumulativi.
- Se il deficit energetico è inevitabile durante lo sblocco base, rivedere domanda/centrale o segnalare chiaramente la regolazione; mantenere sempre la strada di recupero.
- Se uno strumento costa più del beneficio medio in ogni situazione, ridurne il costo o specializzarlo. Il Modulo di carico è già stato dimensionato per carichi e costi di questa economia.
- Non modificare costi o velocità silenziosamente durante un universo competitivo. Versionare il bilanciamento, comunicare migrazioni e separare i mondi di prova.

Il comportamento dell'energia segue il principio descritto da Gameforge: capacità non accumulabile e riduzione proporzionale della produzione in deficit. I coefficienti di questo progetto sono originali e non copie dei valori OGame. Riferimento: https://gameforge.com/en-GB/games/ogame-resources.html
