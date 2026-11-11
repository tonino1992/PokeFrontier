# PokéFrontier — piano di game design 0.3

> Aggiornamento implementazione 0.3: mansioni, talenti e catture sono ora parzialmente implementati. `ROADMAP.md` distingue le funzioni disponibili dalle proposte future; `WORKFORCE.md` descrive i coefficienti effettivi e le semplificazioni del primo rilascio.

**Stato: prima implementazione 0.3 disponibile; sviluppo del piano completo ancora in corso.** Vedere `ROADMAP.md` per le funzioni effettive.

## 1. Visione e confini

Ogni giocatore è un ricercatore che fonda e sviluppa avamposti nelle terre selvagge della Valle di Aster. I Pokémon provengono dal catalogo delle 151 specie di Kanto, con tipi contemporanei e doppi tipi. Kanto non è la mappa geografica del mondo.

Il gioco è online, persistente e in tempo reale. La composizione dell'interfaccia richiama i gestionali come OGame; il territorio è una mappa a caselle con coordinate e missioni temporizzate, sul modello Travian. Il server risolve partenze, operazioni, rientri, produzione e code anche quando il giocatore è offline. Non è un RTS.

Il traguardo è un mondo con almeno **100 giocatori dislocati sulla mappa**, sostenendo anche 100 connessioni contemporanee. Numero di caselle e capacità tecnica sono due aspetti distinti: entrambi vanno verificati.

### Decisioni concordate

- Libertà di giocare da soli, in gruppo, da generalisti o da specialisti.
- Nessuna classe permanente e nessuna collaborazione obbligatoria per progredire.
- Pokémon assegnabili a strutture e spedizioni; un esemplare svolge un incarico alla volta.
- Idoneità lavorativa basata sui tipi, senza richiedere specie precise.
- Tre abilità lavorative possibili per tipo, una delle quali rara.
- Una sola abilità lavorativa per esemplare; nessun talento esclusivo della singola specie.
- Nei doppi tipi il giocatore sceglie il tipo dell'abilità durante la preparazione della cattura, prima di conoscere il risultato.
- Energia come capacità prodotta/consumata, senza deposito o compravendita.
- Edifici, ricerche, strumenti e personale collegati da una progressione leggibile.

### Proposte iniziali da validare

Probabilità, percentuali, cap, tempi, dimensione della mappa, protezioni, limiti logistici e sistema contro la sfortuna riportati sotto sono ipotesi di progetto. Non sono già bilanciati né approvati da dati di gioco reali. Le abilità sono originali di questo strategico, separate dalle abilità canoniche dei giochi Pokémon.

## 2. Libertà senza assenza di decisioni

Tutte le funzioni essenziali devono essere ottenibili autonomamente. La specializzazione dà un vantaggio di efficienza o organizzazione; non crea dipendenze obbligatorie da altri account.

Ogni mansione essenziale ha almeno due soluzioni: Pokémon compatibili oppure attrezzature/automazione. Le infrastrutture iniziali hanno una modalità di servizio minima del ricercatore: partire con lo starter non spegne l'economia. Le modalità automatiche avanzate richiedono investimento e più potenza, ma devono permettere anche la progressione di un generalista con pochi lavoratori.

La mancanza di un tipo può ridurre l'efficienza o rendere conveniente cercarlo, non impedire di giocare per un tempo indefinito. Nessuna abilità rara sblocca da sola edifici, ricerche, ricette fondamentali o regioni necessarie. Le alternative devono essere disponibili prima del requisito che intendono coprire.

I vincoli significativi rimangono tempo, risorse, capacità energetica, spazi e incarichi. Devono essere prevedibili, reversibili dove possibile e accompagnati da un'anteprima. Nessuna perdita permanente per assenza, fame o sconfitta nell'impostazione iniziale.

## 3. Il ciclo di gioco

1. Sviluppare avamposto, risorse e attrezzature.
2. Organizzare i Pokémon fra lavoro, spedizioni, recupero e riserva.
3. Esplorare caselle e studiare gli habitat.
4. Preparare missioni, strumenti e obiettivi di cattura.
5. Catturare esemplari e scoprire l'abilità estratta.
6. Valutare se assegnarli, allenarli, evolverli, tenerli in riserva o scambiarli.
7. Usare i risultati per ampliare le possibilità dell'avamposto e scegliere il prossimo obiettivo.

Il gioco deve offrire obiettivi paralleli: collezione, ricerca, produzione, edilizia, commercio, esplorazione e cooperazione. Nessuno di questi stili richiede di partecipare al PvP.

## 4. Mansioni basate sul tipo

I Pokémon non hanno una matrice nascosta di attitudini specifiche per specie. Il tipo determina le famiglie di mansioni ammesse; livello e competenza lavorativa determinano la capacità. La singola specie conserva statistiche, evoluzioni, mobilità e interesse collezionistico.

| Struttura o attività | Tipi idonei iniziali | Mansione |
|---|---|---|
| Cava | Terra oppure Roccia | Scavo ed estrazione |
| Coltivazioni | Erba oppure Acqua | Coltivazione o irrigazione |
| Centrale ausiliaria | Elettro | Produzione elettrica e stabilizzazione |
| Officina | Fuoco oppure Acciaio | Lavorazione e assemblaggio |
| Laboratorio | Psico; Normale come supporto | Analisi e assistenza |
| Infermeria | Normale oppure Folletto | Assistenza e recupero |
| Osservatorio | Volante oppure Psico | Rilevamento e orientamento |
| Deposito logistico | Lotta oppure Terra | Movimentazione |
| Estrattore reagenti | Veleno oppure Acqua | Trattamento e separazione |
| Conservazione habitat | Erba, Coleottero oppure Folletto | Monitoraggio e recupero ecologico |
| Catena del freddo | Ghiaccio oppure Acqua | Conservazione e trasporto dei campioni |
| Studi specialistici | Spettro, Drago o altri tipi coerenti | Opportunità scientifiche facoltative |

Non tutti i tipi devono essere indispensabili a una struttura. Alcuni trovano la propria utilità soprattutto in missioni o specializzazioni. Normale deve essere un supporto diffuso e utile, non una categoria di scarto.

**Vincolo del catalogo:** i dati locali dei 151 Pokémon con tipi moderni contengono 17 tipi. Buio non è presente nelle forme standard di questo catalogo. Acciaio, Spettro e Drago hanno pochi rappresentanti. Nessuna funzione essenziale può richiederli senza un'alternativa equivalente. Non aggiungere forme regionali o specie fuori Kanto senza una decisione esplicita sul catalogo.

## 5. Incarichi e capacità lavorativa

Stati dell'esemplare: riserva, assegnato a una struttura, in spedizione, in recupero o vincolato a un contratto. Lo stesso ID non può comparire contemporaneamente in due incarichi, in uno scambio e in una missione.

Un doppio tipo è compatibile con entrambe le famiglie di lavoro, ma occupa un solo posto e copre una sola mansione per volta. Non equivale a due lavoratori.

Il livello dell'edificio determina attrezzature, numero di posti e capacità utile massima. Il livello del Pokémon migliora moderatamente il contributo; l'esperienza lavorativa rafforza l'esemplare già utilizzato senza rendere indispensabile la sostituzione continua. Nessuna fatica da azzerare manualmente ogni giorno e nessuna necessità di ruotare lavoratori per mantenere la produzione ordinaria.

Proposta di formula leggibile:

`resa = produzione nominale × copertura operativa × efficienza energetica × (1 + bonus ammessi)`

La copertura deriva da personale e moduli automatici. Il contributo automatico deve crescere tramite investimenti: non può rimanere fisso mentre i requisiti degli edifici aumentano fino a rendere l'automazione inutilizzabile. Gli edifici non generano produzione illimitata aggiungendo lavoratori oltre la capacità utile.

Obiettivo iniziale da provare: modalità di servizio ridotta al principio; automazione sviluppata intorno al 75–85% della capacità ordinaria, con maggior richiesta energetica; personale adeguato fino al 100%, oltre ai talenti entro cap. Sono obiettivi, non coefficienti già scelti. Un percorso interamente automatico deve essere più oneroso ma realmente giocabile.

### Assegnazione e rimozione

- Alla base, riassegnazione senza costi punitivi o attese arbitrarie.
- Durante un'operazione in corso, variazione dell'efficienza soltanto per il lavoro residuo, mai per risorse già prodotte o consumate.
- In viaggio, nessuna riassegnazione fino al rientro.
- Prima della partenza: confronto fra produzione, energia e code prima/dopo la rimozione.
- Automazione di riserva configurabile, con costo energetico dichiarato.
- Priorità di emergenza impostabili: mantenere cibo, materiali oppure reagenti.

Le assegnazioni lavorative restano operative offline. Non sono unità fisiche da muovere sulla mappa per ogni cambio di edificio.

## 6. Abilità per tipo

Ogni esemplare riceve un'abilità lavorativa da uno dei suoi tipi. La rarità determina quale delle tre abilità è stata ottenuta, non un ulteriore moltiplicatore casuale nascosto.

Proposta iniziale: **70% comune, 25% non comune, 5% rara**. Queste probabilità valgono per ogni cattura riuscita eleggibile, prima dell'eventuale protezione contro la sfortuna. Nessun bonus alla rarità per doppi tipi, leggendari o Ball costose. Le Ball modificano la cattura, non la qualità dell'abilità.

L'abilità ha valore soltanto in contesti compatibili. Un talento che aumenta generazione elettrica non trasforma qualsiasi edificio in una centrale. Effetti non applicabili sono chiaramente indicati prima dell'assegnazione.

### Catalogo iniziale delle abilità

I numeri sono valori di prova al primo grado. Si applicano alla struttura ospitante o alla missione indicata, non all'intero account. Ogni riga rappresenta tre alternative, non tre bonus simultanei.

| Tipo | Comune, 70% | Non comune, 25% | Rara, 5% |
|---|---|---|---|
| Normale | Versatilità: +8% capacità nei ruoli di supporto | Ordine: −6% materiali delle ricette di supporto | Coordinamento: +8% contributo degli altri lavoratori della struttura, senza propagazione |
| Fuoco | Fornace: +10% velocità delle lavorazioni termiche | Recupero termico: −8% consumo dei moduli compatibili | Fusione precisa: −10% materiali dei componenti avanzati, nessun effetto sulle ricette semplici |
| Acqua | Irrigazione: +10% resa delle coltivazioni | Lavaggio: +8% resa dei reagenti trattati | Ciclo chiuso: −12% consumo delle installazioni irrigue o di trattamento |
| Erba | Coltivazione: +10% produzione agricola | Nutrimento: −8% cibo richiesto dalle lavorazioni dell'habitat | Botanica avanzata: +12% resa di ingredienti medicinali, senza aumentare il cibo ordinario |
| Elettro | Generazione: +10% potenza nella centrale ausiliaria | Stabilizzazione: −8% richiesta dei moduli produttivi ospitanti | Rete adattiva: attenua localmente la penalità da deficit, con cap; non crea potenza e non alimenta altri edifici |
| Ghiaccio | Refrigerazione: +10% capacità di conservazione dei campioni | Catena del freddo: −8% consumo dei moduli refrigerati | Crioconservazione: +12% resa delle lavorazioni con campioni conservati |
| Lotta | Movimentazione: +10% capacità di carico | Montaggio: +8% velocità delle lavorazioni pesanti | Cantiere coordinato: −10% lavoro residuo delle costruzioni assistite, senza completamenti istantanei |
| Veleno | Separazione: +10% resa dei reagenti | Decontaminazione: −8% reagenti nelle lavorazioni compatibili | Recupero chimico: recupera l'8% dei reagenti effettivamente consumati nei lotti avanzati, entro il costo netto minimo |
| Terra | Scavo: +10% resa mineraria | Prospezione: +8% raccolta in spedizioni estrattive | Filone profondo: +12% resa soltanto nei giacimenti ricchi identificati dalla ricognizione |
| Volante | Ricognitore: +8% velocità delle missioni di ricognizione | Orientamento: −8% cibo di viaggio delle missioni compatibili | Cartografo esperto: uno studio approfondito può rivelare un punto d'interesse aggiuntivo entro il raggio consentito |
| Psico | Analisi: +10% velocità di ricerca | Metodo: −8% costo in reagenti di nuove ricerche | Intuizione: +12% dati scientifici nei progetti approfonditi, non nelle ricognizioni ripetute |
| Coleottero | Impollinazione: +8% resa agricola | Monitoraggio: +10% velocità delle osservazioni ambientali | Simbiosi: aumenta l'efficacia degli interventi di recupero dell'habitat, senza accelerare catture rare |
| Roccia | Frantumazione: +10% capacità di lavorazione mineraria | Fondamenta: −8% materiali delle opere strutturali compatibili | Vena protetta: migliora del 12% il recupero di materiali nei siti di estrazione difficili |
| Spettro | Indagine: +10% velocità di studio delle rovine | Discrezione: riduce il rischio negli studi non invasivi pericolosi | Memoria del luogo: +12% dati dagli archivi delle rovine già messe in sicurezza |
| Drago | Resistenza: +10% capacità nelle spedizioni lunghe | Vigilanza: riduce il rischio delle spedizioni scientifiche avanzate | Presenza antica: +12% contributo nei progetti scientifici maggiori, senza bonus generali al combattimento |
| Acciaio | Assemblaggio: +10% velocità di produzione dei componenti | Precisione: −8% materiali nelle ricette meccaniche | Standardizzazione: +12% efficienza dei grandi lotti, con soglia e cap, senza vantaggio nei piccoli lotti |
| Folletto | Assistenza: +10% recupero nell'infermeria | Cura attenta: −8% ingredienti delle cure | Equilibrio: migliora del 12% la preparazione delle missioni di conservazione e soccorso |

Buio rimane fuori dal catalogo lavorativo attivo: zero esemplari eleggibili. Non serve progettare tre abilità inutilizzabili o inventare un requisito non soddisfacibile.

### Limiti ai bonus

- Obiettivo: il raro migliore per un'attività offre un vantaggio circoscritto; non deve dominare contemporaneamente resa, costo e tempo.
- Una comune specializzata può superare una rara fuori contesto.
- A parità di investimento, divario ordinario fra squadra di lavoratori comuni e rara ottimizzata da mantenere indicativamente entro il 10–15%; va misurato.
- Per struttura: un talento guida al 100%, un supporto al 50% e un eventuale terzo al 25%; copie ulteriori non amplificano lo stesso effetto.
- Cap iniziali proposti: +25% velocità/resa da abilità, −20% costi, −20% domanda elettrica. I bonus non ricorsivi e i cap vanno verificati insieme.
- Nessuna catena Coordinamento → Coordinamento, nessun recupero superiore al consumo e nessuna combinazione che renda gratuitamente ripetibile una ricetta.
- Effetti probabilistici risolti dal server per operazione significativa, non a ogni aggiornamento della pagina o tick grafico.

## 7. Cattura e scelta del tipo dell'abilità

### Preparazione

1. Selezione della casella e della specie rilevata.
2. Selezione della squadra, della Ball e degli strumenti.
3. Se il bersaglio ha due tipi, scelta obbligatoria di uno dei due insiemi di abilità; per un solo tipo la scelta è implicita.
4. Anteprima delle tre abilità e delle rispettive probabilità, compreso l'eventuale progresso contro la sfortuna.
5. Conferma di costi, viaggio, rientro ed effetti sulla base lasciata dai lavoratori.

Esempio: bersaglio Erba/Veleno; scegliendo Erba si può ottenere soltanto una delle tre abilità Erba. Nessuna estrazione preventiva e nessuna scelta dopo aver visto il risultato.

### Risoluzione

- Il server registra `abilityPoolType` e versione del catalogo nella missione prima della partenza.
- Prima risolve il successo della cattura; soltanto in caso positivo estrae l'abilità dall'insieme scelto.
- Cattura fallita: nessuna abilità, nessun incremento del contatore delle catture riuscite.
- Cattura riuscita: ID univoco del nuovo esemplare, abilità e contatori salvati nella stessa transazione dell'evento.
- Il rapporto dal campo mostra il risultato; il Pokémon può essere assegnato soltanto dopo il rientro.
- Riconnessione, richiamo, riavvio o ripetizione della richiesta non possono cambiare l'estrazione.

Il doppio tipo mantiene entrambe le idoneità lavorative e i propri tipi di combattimento. Il tipo scelto determina solo l'origine dell'unica abilità lavorativa. Cambiare mansione non cambia l'abilità.

## 8. Ricerca dei migliori e protezione contro la sfortuna

Duplicati utili: abilità diverse, più incarichi contemporanei, squadre esterne e riserva. Non introdurre anche IV lavorativi casuali, qualità nascosta dell'abilità e probabilità di successo della crescita: una sola estrazione principale deve restare leggibile.

Senza protezione, con probabilità rara del 5% la probabilità di almeno una rara in 20 catture riuscite è circa 64%, non 100%. Il costo atteso e la dispersione devono essere mostrati correttamente nel bilanciamento.

Proposta contro la sfortuna: **40ª cattura riuscita consecutiva senza rara nello stesso insieme di tipo → rara garantita**. Contatore per account e tipo scelto; azzeramento quando esce una rara di quell'insieme. Catture di altri tipi, fallimenti e scambi non avanzano quel contatore. La probabilità ordinaria resta 5%, ma quella effettiva nel lungo periodo con garanzia è superiore: la simulazione deve tenerne conto. Soglia 40 e introduzione stessa della garanzia sono da validare.

Seconda strada: un progetto di riqualificazione fornisce un cambio controllato, con costo e risultato noti. Disponibile senza alleanza, denaro reale o esemplari sacrificati. La durata dipende dal progetto, non da una nuova estrazione casuale. Può cambiare fra insiemi compatibili del Pokémon, mantenendo una sola abilità; ottenere la rara deve richiedere un investimento comparabile a una ricerca prolungata, senza rendere inutile catturare.

Nessuna vendita di estrazioni, garanzie, reset o Pokémon lavoratori migliori tramite denaro reale nell'impostazione prevista.

## 9. Crescita, evoluzioni e valore degli esemplari

Tre progressioni leggibili: livello generale, competenza lavorativa e abilità. La rarità non aumenta casualmente con i livelli. Le competenze crescono con attività concluse e lavoro effettivo, non lasciando una scheda aperta.

Le evoluzioni danno capacità e possibilità differenti, con maggiore ingombro o mantenimento dove appropriato. Le forme iniziali restano economicamente utili nei piccoli incarichi; non devono essere universalmente superiori alle evoluzioni né diventare subito scarti.

Regole proposte sull'abilità:
- Se il tipo dell'abilità rimane dopo l'evoluzione, abilità e competenza si conservano.
- Se quel tipo scompare, il giocatore sceglie un insieme fra i tipi della nuova forma; si mantiene la rarità e si mostra prima della conferma l'abilità corrispondente. Non si effettua un nuovo tiro.
- Se si aggiunge un secondo tipo, non nasce automaticamente una seconda abilità e non si ottiene un'estrazione gratuita.
- La scelta evolutiva e il possibile trasferimento di rarità, in particolare nelle evoluzioni ramificate, vanno inclusi nelle simulazioni economiche.

Solo evoluzioni comprese nelle 151 specie previste. Gli esemplari ricevuti tramite scambio conservano abilità, origine e progressione; il trasferimento non li rigenera.

## 10. Energia, automazione e mantenimento

La rete mostra potenza prodotta, domanda, bilancio ed efficienza. Nessuna energia immagazzinabile. Centrale solare di base indipendente dai Pokémon; centrale ausiliaria con personale Elettro come possibilità di specializzazione.

Rimuovere un generatore Pokémon riduce la potenza al momento effettivo della rimozione. Attivare l'automazione aumenta la domanda. Il comando deve mostrare il risultato prima della conferma e rispettare eventuali priorità impostate dall'utente.

Mantenere i Pokémon è un costo aggregato e prevedibile, non un'azione manuale per esemplare. In assenza di cibo si applica una modalità di emergenza dichiarata: riduzione del lavoro e rifornimenti minimi, nessuna morte, fuga o perdita di abilità. Il sistema deve prevedere un percorso autonomo di recupero da risorse esaurite e rete in deficit.

Per la prima implementazione limitare i carichi continui agli impianti produttivi e ai moduli automatici esplicitamente alimentati. Le ricerche possono richiedere una soglia di potenza senza spenderla come materiale. Non introdurre un consumo elettrico nascosto per ogni attività.

## 11. Strutture, ricette e filiere

Mantenere le 12 strutture di base della 0.2 come punto di partenza, aggiungendo incarichi e moduli invece di moltiplicare subito gli edifici. Le ricerche sbloccano strumenti, modalità operative e alternative automatiche. Nessun ramo richiede un talento raro.

Filiere da provare:
- Minerali → componenti lavorati → Ball e moduli.
- Coltivazioni → ingredienti → cure ed esche.
- Reagenti → analisi → scanner e componenti scientifici.

Introdurre al massimo cinque componenti intermedi nella prima prova; ciascuno deve creare una scelta reale. Evitare dieci passaggi obbligatori per una Ball comune. In ogni filiera iniziale deve esistere una versione semplice funzionante prima della specializzazione avanzata.

Costi di costruzione e ricerca crescono progressivamente, con rami paralleli. Spazi e personale permettono di scegliere una priorità ma non impongono di rinunciare per sempre alle altre. Rispecializzazione mediante riassegnazione e investimenti; niente reset integrale dell'account.

Le code esistenti rimangono distinte. Non si può migliorare una struttura mentre svolge la propria attività incompatibile, ma il resto dell'avamposto continua. Spostare personale non cancella gli input di un lotto in corso: si aggiorna il lavoro residuo o si passa alla modalità alternativa secondo la regola mostrata.

## 12. Mondo da almeno cento giocatori

**Ipotesi iniziale di mappa: 81 × 81 caselle**, da sostituire se prove di densità e viaggio indicano una misura migliore. Progettare circa dieci distretti iniziali con 8–12 avamposti ciascuno, collegati da zone di esplorazione e aree specialistiche. Non disperdere cento persone uniformemente in migliaia di caselle vuote.

Proposte di generazione:
- Distanza minima indicativa di 3–5 caselle fra basi iniziali, evitando isolamento.
- In ogni distretto: risorse di base e possibilità realistiche di ottenere più tipi comuni fondamentali.
- Tipi rari, specie evolute e talenti rari non necessari al funzionamento iniziale.
- Validatore del mondo prima dell'apertura: accesso alle risorse, alternative di mansione, tempi di viaggio e distribuzione delle opportunità.
- Scelta fra alcuni siti iniziali con informazioni comprensibili; nessun sito oggettivamente peggiore senza compensazione.
- Spazio riservato per nuovi arrivati e protezione delle basi iniziali.

Le caselle presentano habitat, difficoltà, presenze, riserve e stato ecologico. La ricognizione rivela informazioni utili. Densità e qualità degli incontri cambiano nel tempo tramite migrazioni e recupero, non tramite svuotamento permanente di un bioma da parte dei primi arrivati.

Nell'area di avvio deve esistere un accesso di ricerca protetto sufficiente a non bloccare i nuovi utenti quando i vicini sfruttano i giacimenti comuni. Le ricompense introduttive protette sono finite e non producono una rendita commerciabile illimitata.

Fuori dalle aree iniziali: giacimenti condivisi più ricchi, rovine, progetti e opportunità territoriali. La distanza genera decisioni logistiche; i viaggi non devono impedire per giorni l'accesso a una funzione essenziale.

## 13. Popolazioni e conservazione

L'incentivo a catturare molti esemplari deve convivere con un mondo recuperabile. Catture frequenti possono modificare temporaneamente gli incontri e spingere a esplorare altre zone; nessun giocatore può estinguere definitivamente una specie del mondo.

Studi e interventi di conservazione contribuiscono al prestigio e ai progetti scientifici. Eventuali reintroduzioni o gestione dei duplicati non richiedono di distruggere esemplari per ottenere abilità migliori. La collezione ha strumenti di filtro, riserva e rilascio volontario con conferma chiara. Mai un rilascio automatico perché l'Habitat è pieno.

In caso di cattura riuscita con spazio indisponibile per un evento concorrente, il nuovo esemplare resta in un'accoglienza temporanea protetta, senza lavoro, vendita o riproduzione finché non si libera spazio. Non viene perso o duplicato.

## 14. Commercio, cooperazione e competizione

Ogni giocatore può sviluppare tutte le filiere essenziali. Collaborare può far risparmiare tempo, permettere grandi progetti e aprire opportunità, senza diventare l'unica strada per crescere.

Ordine di introduzione: scambio di risorse e strumenti; poi ordini di produzione e trasporto; infine scambi e prestiti temporanei di Pokémon. Contratti gestiti dal server con proprietà, disponibilità, pagamento, scadenza e restituzione verificabili.

Gli esemplari con talenti diversi hanno valore per attività differenti. Non deve esserci un unico raro economicamente dominante in ogni avamposto. Chi presta un lavoratore mantiene la proprietà e ne riottiene l'accesso automaticamente alla scadenza; il sistema non dipende dalla buona volontà del destinatario.

Alle autorità delle alleanze non viene dato accesso automatico alle collezioni personali. Depositi, progetti e prestiti hanno permessi e registri. Progetti collettivi valorizzano produzione, logistica e ricerca oltre al combattimento.

PvP facoltativo in aree dichiarate. Basi principali protette; nessun furto di Pokémon assegnati. Prestigio scientifico, produzione, collezione ed esplorazione hanno riconoscimenti distinti. Il controllo territoriale non deve amplificare senza limite il vantaggio dei vincitori.

## 15. Interfaccia necessaria

- Panoramica con rete energetica, produzione, code e personale impiegato.
- Scheda struttura: mansioni, lavoratori, modalità alternativa, bonus effettivi, cap ed eventuali requisiti mancanti.
- Scheda Pokémon: tipi, abilità, rarità, tipo d'origine dell'abilità, competenza e incarico.
- Collezione filtrabile per tipo, abilità, rarità, mansione e disponibilità; confronto degli esemplari duplicati.
- Preparazione cattura con selezione del tipo dell'abilità, tre esiti possibili e probabilità.
- Prima di una spedizione: anteprima dell'effetto delle partenze sull'avamposto.
- Rapporti che distinguono risultato ottenuto, nuovi esemplari in rientro e consegna effettiva.
- Gestione delle assegnazioni con controlli accessibili; nessuna funzione essenziale disponibile soltanto tramite trascinamento.
- Navigazione compatta da gestionale, mappa territoriale locale, supporto desktop e mobile.

L'interfaccia deve spiegare perché un Pokémon è idoneo, quali bonus si applicano e quali no. Non esporre formule interne irrilevanti al posto di effetti comprensibili.

## 16. Bilanciamento e obiettivi di esperienza

Separare il bilanciamento 0.3 dai valori già in uso nella 0.2. La prima cattura della versione attuale può richiedere ore nel percorso passivo: non assumerla come obiettivo definitivo della nuova esperienza Pokémon.

Obiettivi da misurare per una nuova partita:
- Prima scelta di assegnazione significativa nei primi 5–10 minuti.
- Prima cattura indicativamente entro 15–30 minuti in una sessione guidata attiva, non garantita da un tiro favorevole necessario.
- Almeno due attività utili disponibili durante un viaggio.
- Possibilità di partire con lo starter mantenendo l'economia minima.
- Nessun bisogno di alleanza, scambio o rara nelle prime giornate o per le funzioni fondamentali successive.
- Utilità visibile del primo duplicato con abilità diversa.

Simulare giocatori occasionali, regolari, attivi, generalisti, autonomi, collezionisti e specialisti. Misurare tempi ai primi sblocchi, costo totale per cattura, numero di abilità rare, concentrazione delle assegnazioni, utilizzo dell'automazione, deficit energetico e dipendenza dagli scambi.

Confrontare distribuzioni e casi sfortunati, non soltanto medie. Il gruppo al decimo percentile deve poter progredire con esemplari comuni. Un raro può essere un traguardo desiderabile senza rendere frustrante tutto ciò che viene prima.

## 17. Architettura online per il nuovo traguardo

La 0.2 ha un processo singolo, snapshot di mondo e limite a 25 ricercatori. Non dichiararla pronta per cento soltanto aumentando quel limite.

Proposta: database transazionale con entità separate per account, Pokémon, incarichi, strutture, scorte, missioni, eventi, contratti e caselle. PostgreSQL è il candidato di progetto per il mondo ampliato; valutazione operativa prima della migrazione. Conservare un'unica autorità di simulazione per mondo finché non esiste un coordinamento fra worker verificato.

Requisiti:
- Unicità dell'incarico per ID Pokémon garantita dal database.
- Costi, disponibilità e assegnazioni verificati atomicamente alla partenza.
- Eventi persistenti con ID univoco e gestione idempotente.
- Abilità estratta una volta sola e legata alla cattura, senza rigenerazione al retry.
- Contatori contro la sfortuna aggiornati nella transazione della cattura riuscita.
- Visione della mappa per finestra/chunk e aggiornamenti differenziali, non invio dell'intero mondo a ogni client ogni secondo.
- Stima grafica dei contatori nel browser; lo stato autorevole rimane sul server.
- Proprietà e contratti verificati anche negli scambi concorrenti.
- Migrazioni versionate, backup e prova di ripristino, autenticazione e recupero account.

### Criteri tecnici di accettazione proposti

- 100 connessioni simultanee per almeno 30 minuti in un ambiente di prova documentato.
- Prova aggiuntiva con 150 connessioni e picchi di comandi; nessuna perdita di correttezza.
- Obiettivo iniziale: risposta ai comandi p95 sotto 300 ms in condizioni di rete controllate, da misurare sul futuro server.
- Riavvio durante risoluzione catture e consegne, con zero duplicazioni o perdite.
- Recupero dopo sette giorni offline senza deriva delle scorte, consumo negativo o code bloccate.
- Tentativi concorrenti di lavoro, partenza, scambio e prestito dello stesso esemplare respinti correttamente.

Sono criteri futuri: nessuna di queste prove da cento giocatori è stata eseguita nella fase di pianificazione.

## 18. Piano di sviluppo, nell'ordine

| Fase | Contenuto | Verifica prima di procedere |
|---|---|---|
| A. Fondazioni del modello | Stati dei Pokémon, incarichi esclusivi, tipi e schema delle abilità | Nessun doppio impiego o perdita di identità |
| B. Lavoro e alternative | Tre strutture pilota: cava, coltivazioni e officina; automazione e anteprima | Progressione possibile con comuni e con pochi lavoratori |
| C. Catture | Scelta dell'insieme per doppi tipi, estrazione server, rapporto e consegna | Retry, riavvii e richiami non cambiano il risultato |
| D. Collezione e crescita | Filtri, confronto duplicati, competenze ed evoluzioni | Ogni trasferimento conserva un solo esemplare e un'abilità valida |
| E. Economia completa | Altre strutture, filiere, bonus e cap, energia e mantenimento | Nessun ciclo gratuito o requisito raro obbligatorio |
| F. Territorio ampliato | Generazione per distretti, validatore e popolazioni recuperabili | Nessuna posizione iniziale senza alternative fondamentali |
| G. Comunità | Scambi sicuri, ordini, cooperazione; prestiti in seguito | Autonomia preservata, contratti e permessi verificati |
| H. Alpha con gruppo crescente | Prima 3–10 persone, poi 30, infine almeno 100 | Correttezza e prestazioni misurate prima di aprire ulteriormente |

La prima prova deve mettere tre stili nello stesso distretto: un autonomo generalista, un collezionista e un produttore. Tutti devono poter avanzare; devono emergere vantaggi facoltativi nello scambio, non dipendenze obbligate. Non aggiungere nuovi edifici soltanto per compensare un ciclo economico che non funziona.

## 19. Migrazione dal prototipo

Nessuna modifica automatica ai salvataggi durante questa fase. Prima dell'implementazione: backup e migrazione versionata su una copia.

Proposta per gli esemplari già catturati: il proprietario sceglie una volta l'insieme compatibile; il server assegna l'abilità una sola volta, conservando livello, XP e proprietà. Il record di migrazione impedisce estrazioni ripetute. Non assegnare automaticamente una rara a tutti né cancellare la collezione. La modalità definitiva va scelta prima di aprire un mondo competitivo; un universo nuovo può essere più corretto per confrontare il bilanciamento.

Vecchie scorte e infrastrutture non vengono eliminate silenziosamente. Le modalità operative alternative devono essere disponibili quando entrano in vigore i nuovi incarichi. Nessuna base deve spegnersi al primo accesso dopo la migrazione.

## 20. Decisioni da chiudere prima della relativa fase

1. Confermare o ritoccare 70/25/5, garanzia proposta a 40 e progetto di riqualificazione dopo simulazione.
2. Validare i 51 talenti iniziali: utilità, sovrapposizioni, cap e leggibilità, prima di applicarli tutti.
3. Dimensionare capacità lavorativa, numero di posti e automazione con prove di tre avamposti.
4. Definire evoluzioni, competenze, mantenimento e costi con dati di prova, senza nuove lotterie nascoste.
5. Verificare densità e tempi della mappa 81×81 prima di adottarla come misura definitiva.
6. Scegliere hosting, dominio, recupero account e soluzione dati per l'alpha ampliata.
7. Stabilire regole contro abusi e multiaccount senza penalizzare automaticamente famiglie o connessioni condivise.

Non serve chiedere una nuova preferenza per ogni parametro: lo sviluppo deve seguire questi principi e rendere verificabili le scelte. Le decisioni che cambiano il patto di gioco, il catalogo o la monetizzazione richiedono invece un confronto esplicito.

## Risultato richiesto al termine del primo ciclo

Un giocatore capisce quali Pokémon gli servono, perché un duplicato può essere utile e cosa cambia assegnandolo o mandandolo in missione. Può cercare la rara desiderata, ma continua a divertirsi e progredire anche senza trovarla. Cento ricercatori condividono un territorio vivo senza essere costretti a giocare tutti nello stesso modo.
