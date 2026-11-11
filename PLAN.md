# PokéFrontier — piano di prodotto e game design

> **Piano corrente per lo sviluppo successivo:** vedere `DESIGN_PLAN.md` (design 0.3: Pokémon lavoratori, abilità per tipo, libertà di progressione e mondo da almeno cento giocatori). Il documento seguente conserva il riferimento al prototipo 0.2 già implementato. La prima parte delle nuove regole è implementata nella 0.3: stato effettivo in `ROADMAP.md` e coefficienti in `WORKFORCE.md`.

Versione 0.2: progressione e valori implementati in `BALANCING.md`; preparazione al server online in `ONLINE.md`. Questi due documenti dettagliano il piano generale e costituiscono il riferimento operativo per l'economia e il rilascio.

## Direzione vincolante

Il giocatore è un ricercatore della Spedizione Aurora che fonda un avamposto nelle terre selvagge della Valle di Aster. Non è un allenatore in viaggio nella mappa di Kanto: Kanto identifica soltanto il catalogo delle 151 specie disponibili. I tipi sono quelli contemporanei, compresi Folletto, Acciaio e doppi tipi.

Il modello è un gestionale browser: struttura dell'interfaccia ispirata a OGame; mappa territoriale e missioni ispirate al modello di Travian. Non è un RTS con movimento manuale, attacchi comandati al secondo o unità che vagano sullo schermo. Il mondo è persistente e in tempo reale: produzione, costruzioni, ricerche e spedizioni proseguono indipendentemente dalla presenza online.

## Promessa di gioco

Trasformare una stazione iniziale in un avamposto scientifico specializzato. Studiare gli habitat, documentare i Pokémon, organizzare squadre, raccogliere materiali e collaborare con altri ricercatori. Crescita della base e ricerca sul campo devono sostenersi reciprocamente.

Pilastri:
- Identità scientifica: osservazione non invasiva e conoscenza del territorio hanno valore proprio.
- Pianificazione: squadra, destinazione, durata, costo e rischio prima della partenza.
- Mondo condiviso: avamposti, habitat e riserve appartengono allo stesso stato server.
- Competizione sostenibile: progressi persistenti e nessuna perdita permanente dei Pokémon nell'alpha.
- Informazione leggibile: tempi, code, carichi ed esiti sempre verificabili.

## Ciclo principale

1. Produrre risorse e sviluppare strutture.
2. Preparare una squadra all'avamposto.
3. Selezionare una casella del territorio.
4. Inviare una ricognizione se la casella è sconosciuta.
5. Consultare il rapporto e scegliere studio, cattura, raccolta o contenimento.
6. Attendere andata, operazione e rientro, oppure gestire altre attività.
7. Ricevere carico ed esperienza; usare i risultati per la prossima espansione.

## Mappa territoriale

Alpha: 21 × 21 caselle, coordinate intere da −10 a +10. Il client mostra una finestra locale navigabile. Coordinate X e Y identificano la casella; i Pokémon sono incontri dell'habitat e non segnalini in movimento.

Ogni casella contiene bioma, difficoltà, eventuale avamposto, riserva di risorse e un insieme di specie. Le presenze non sono visibili prima della ricognizione. Le caselle adiacenti all'avamposto iniziale sono già note.

Biomi:
| Bioma | Caratteristiche | Risorsa |
|---|---|---|
| Bosco | Erba, Coleottero, Veleno, Folletto | Cibo |
| Prateria | Normale, Volante, Elettro | Cibo |
| Alture | Roccia, Terra, Lotta, Acciaio | Materiali |
| Palude | Acqua, Veleno, Spettro | Reagenti |
| Lago | Acqua e Ghiaccio | Reagenti |
| Rovine | Psico, Drago e Fuoco | Materiali |

Ogni avamposto occupa una casella e ha un proprietario. Le basi principali sono protette nell'alpha. Le riserve sono condivise: due spedizioni possono competere per ciò che rimane. Le caselle scaricate si rigenerano dopo un intervallo registrato dal server. Siti rari ospitano i cinque leggendari con difficoltà elevata.

## Spedizioni

Una squadra attiva per ricercatore nella prima versione; da uno a tre Pokémon. Tutti i membri sono impegnati dalla partenza fino al rientro. Non si cambia formazione e non si usa una pozione su una squadra in missione.

| Tipo | Costo iniziale | Operazione nell'alpha | Risultato |
|---|---|---|---|
| Ricognizione | 10 cibo | 30 s | Rivela presenze e risorse della casella |
| Studio | 15 cibo | 60 s | Documenta una specie, senza combattere |
| Cattura | 25 cibo + 1 Ball | 90 s | Tentativo automatico su una specie scelta |
| Raccolta | 15 cibo | 120 s | Preleva risorse finite e le trasporta |
| Contenimento | 20 cibo | 90 s | Confronto con gli incontri, ricompense ed esperienza |

Questi sono i tempi base del profilo live ×1; il costo alimentare include inoltre distanza e membri. Il sandbox separato accelera tempi e produzione ×20. Tipi di missione, difficoltà e strumenti sono sbloccati dall'albero tecnologico.

Stati persistenti:
1. **Andata:** partenza, origine, destinazione e istante d'arrivo.
2. **Sul campo:** durata specifica della missione; risoluzione alla scadenza.
3. **Rientro:** risultato noto, squadra e carico ancora in viaggio.
4. **Conclusa:** carico e nuovo Pokémon entrano nell'avamposto una sola volta.

Il tempo di viaggio dipende dalla distanza euclidea fra caselle e dalla velocità del membro più lento, derivata dalla sua statistica base di Velocità. Il client mostra la stima prima della conferma. La squadra non appare come personaggi liberamente controllabili: il movimento è un record temporale sul server.

Richiamo: possibile prima del rientro. Non teletrasporta la squadra; crea un viaggio di ritorno. Cibo consumato, Ball riservata restituita se il tentativo non è ancora avvenuto. Nessuna seconda spedizione mentre la prima è attiva.

## Ricerca sul campo e rapporti

La ricognizione rivela la casella. Lo studio documenta la specie senza catturarla; ricompensa una volta ciascuna specie. Il Pokédex distingue ciò che è documentato da ciò che si possiede: solo gli esemplari catturati entrano nella formazione.

Ogni missione produce un rapporto con coordinate, tipo, esito, specie, ricompense ed eventuali ferite. Un rapporto dal campo indica che il carico è ancora in rientro. La consegna all'avamposto aggiorna il rapporto e non riassegna ricompense già ricevute.

Le missioni si completano anche con browser chiuso o dopo un riavvio del server: le scadenze vengono recuperate in ordine cronologico dal salvataggio.

## Pokémon, tipi e combattimenti

151 specie di Kanto, starter Bulbasaur, Charmander e Squirtle. Dati centralizzati e statistiche base contemporanee. Ogni esemplare possiede ID univoco, specie, livello, XP e salute persistenti. Habitat: 3 + 9 posti per livello. Il secondo membro di squadra richiede Habitat 2, il terzo Habitat 4. Fasce di specie e leggendari hanno requisiti scientifici dedicati.

Tipi completi contemporanei, anche doppi: Bulbasaur Erba/Veleno, Charizard Fuoco/Volante, Magnemite Elettro/Acciaio, Clefairy Folletto, Mr. Mime Psico/Folletto. La tabella comprende tutti i 18 tipi. Debolezze e resistenze difensive si moltiplicano: immunità 0, resistenza doppia 0,25 e debolezza doppia 4.

Gli scontri delle spedizioni sono risoluzioni automatiche. La forza della squadra deriva da attacco, livello, ricerca e tipo più efficace disponibile contro la specie bersaglio. Le immunità possono impedire il successo di un contenimento. Non è una riproduzione del sistema completo di mosse dei giochi principali.

Cattura: una Poké Ball riservata alla partenza; probabilità calcolata sul server in base alla squadra, difficoltà e tecnologia. Il nuovo Pokémon viene consegnato al rientro. Gli scontri possono ferire la squadra, ma non eliminano definitivamente gli esemplari. Recupero all'avamposto e pozioni prima della partenza.

## Economia e strutture

Scorte: materiali, cibo, reagenti e crediti. Energia: capacità istantanea prodotta dalla centrale e consumata dagli impianti; nessuna scorta, costo materiale o compravendita. In deficit la produzione degli impianti cala proporzionalmente. Regolazione degli impianti da 0 a 100%. Costi detratti dal server; i carichi arrivano solo al rientro.

Dodici strutture: Centro operativo, Cava, Coltivazioni, Centrale solare, Estrattore reagenti, Habitat, Laboratorio, Osservatorio, Magazzino, Officina, Infermeria e Deposito logistico. Otto ricerche e sette strumenti con ricette collegate alle strutture. Una coda di costruzione, una di ricerca e una di fabbricazione. Laboratorio e strutture produttive non si migliorano mentre eseguono il rispettivo lavoro. Mercato bloccato fino al Deposito; strumenti fabbricati a tempo, senza acquisti istantanei. Valori e prerequisiti completi in `BALANCING.md`.

La panoramica evidenzia stato dell'avamposto, produzione, capacità e code. L'alpha usa ritmi brevi; i bilanciamenti di un mondo pubblico richiedono prove prolungate.

## Socialità e progressione

Chat globale e privata di alleanza, creazione/adesione/uscita dalle alleanze, classifica di prestigio. Incarichi: studio iniziale, vittoria, cattura, raccolta, miglioramento e tre ricognizioni. Premi riscattabili una sola volta.

Avanzamenti successivi, fuori dall'alpha corrente: squadre multiple, insediamento di nuovi avamposti, depositi alleati, rinforzi, incontri cooperativi, PvP a missioni, conquista territoriale e stagioni. Il vecchio PvP da RTS non viene esposto dall'interfaccia né accettato dal server territoriale.

## Interfaccia

Risorse in alto; menu laterale compatto; panoramica dell'avamposto come apertura. Schermate: Panoramica, Territorio, Avamposto, Pokédex, Spedizioni, Rapporti, Ricerca, Mercato, Alleanza, Classifica e Incarichi.

La mappa mostra caselle selezionabili, coordinate, habitat, basi e destinazione della propria missione. Nel dettaglio: informazioni note, specie, tipo di operazione, costo, andata e rientro. Nessun comando di movimento continuo o abilità da premere durante i combattimenti.

## Architettura tecnica

Node.js, HTTP e Server-Sent Events. Il server è autorevole e conserva lo stato. Il client riceve aggiornamenti per interfaccia e contatori, non simula il mondo.

Le azioni sono eventi con timestamp persistenti. Il server pianifica il prossimo arrivo, completamento, ritorno o fine coda. Non serve una simulazione fisica a 10 o 60 Hz. Un aggiornamento periodico di un secondo mantiene freschi contatori e interfaccia; non rappresenta movimenti fisici.

Persistenza SQLite per la preparazione online, JSON per sviluppo locale. Account con password hash scrypt, login da altri browser, sessioni HttpOnly e Secure in produzione. Origine delle richieste verificata e limiti ai tentativi. Recupero cronologico degli eventi trascorsi e consegna unica. Gli account precedenti conservano collezione, strutture e scorte; il vecchio deposito di energia è convertito in reagenti, senza scartare eccedenze. Dettagli di infrastruttura e limiti della beta in `ONLINE.md`.

## Validazione e avanzamento

Verificare mappe e coordinate; caselle sconosciute; vincolo della squadra; costi iniziali; quattro fasi della missione; consegna unica; richiamo; recupero offline; tipi moderni; privacy dei rapporti; persistenza e sessioni HTTP. Verifica visiva desktop/mobile e prova di almeno una spedizione completa nel browser.

Questa consegna è un'alpha giocabile con configurazione pronta per una prima istanza online, non ancora pubblicata: manca la scelta di hosting e dominio. Account, SQLite e regole economiche hanno test automatici; il pacchetto Docker/HTTPS non è stato eseguito su infrastruttura remota. Prima di un servizio pubblico definitivo restano recupero credenziali, backup remoto, moderazione, monitoraggio, carico, economia di lungo periodo e diritti dei contenuti. Nessuna monetizzazione attiva.
