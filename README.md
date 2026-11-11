# PokéFrontier — Spedizione Aurora

Gestionale multiplayer in tempo reale persistente: sei un ricercatore, fondi un avamposto nella Valle di Aster e organizzi spedizioni scientifiche. Layout da gestionale browser ispirato a OGame, territorio a caselle e missioni temporizzate sul modello Travian. La mappa non è Kanto: sono di Kanto le 151 specie del catalogo, con i tipi contemporanei.

## Stato dello sviluppo

Versione 0.3: Pokémon lavoratori, abilità per tipo, scelta del tipo a ogni cattura doppio tipo e automazione. Apri **Personale** per assegnare i lavoratori e scegliere una sola volta l’abilità degli esemplari precedenti. La pagina mostra l’anteprima prima di applicare un incarico. Dettagli numerici in `WORKFORCE.md`; avanzamento e prossimi passi in `ROADMAP.md`. Il mondo da cento giocatori e il multiplayer cooperativo avanzato sono ancora da realizzare.

## Avvio

Richiede Node.js 24 o successivo; nessuna installazione di pacchetti o chiave API. Apri `AVVIA.cmd` su Windows oppure esegui nella cartella del progetto:

```powershell
node server.mjs
```

Apri **http://127.0.0.1:3100/**. Non aprire direttamente `index.html`. Il server è locale e non pubblica il gioco su Internet. Ctrl+C ferma il server. Puoi impostare `PORT` per cambiare porta.

Per la futura versione online sono presenti account con password, persistenza SQLite e configurazione Docker/HTTPS. Hosting e dominio non sono ancora stati scelti: istruzioni e limiti in `ONLINE.md`. Il piano numerico con costi, prerequisiti e filiere è in `BALANCING.md`; `BALANCE_REPORT.json` contiene una prima simulazione riproducibile.

## Albero tecnologico

Apri **Albero tecnologico** per seguire i requisiti, scegliere un livello obiettivo e consultare gli effetti da 0 a 20. Le schede Avamposto e Ricerca mostrano anche il confronto attuale → successivo. Dettagli in `TECHNOLOGY.md`.

## Giocare

1. Scegli nome del ricercatore e starter.
2. La Panoramica mostra avamposto, risorse e code.
3. In Territorio seleziona una casella con coordinate. Le frecce spostano la vista, non i Pokémon. +/− cambia l'ampiezza della finestra.
4. Invia una **ricognizione** per scoprire le presenze in una casella sconosciuta. I dintorni della tua base sono già noti.
5. Sblocca **studio**, **cattura**, **raccolta** e **contenimento** tramite edifici e tecnologie. Inizialmente è disponibile la ricognizione. Prima della conferma sono mostrati requisiti, costo, durata e rientro. Per specie più complesse servono ulteriori ricerche.
6. La squadra rimane impegnata fino al rientro. Il server continua anche se chiudi il browser. Il richiamo crea un ritorno, senza teletrasporto.
7. I **Rapporti** mostrano gli esiti. Materiali e Pokémon catturati arrivano nell'avamposto solo al rientro.
8. Sviluppa 12 strutture, ricerca 8 tecnologie e fabbrica 7 strumenti nelle rispettive strutture. Ball, pozioni, scanner e moduli hanno ricette e tempi propri. Habitat 2 e 4 sbloccano secondo e terzo membro.
9. Apri Energia per regolare gli impianti. L'energia non si accumula: il surplus è capacità libera e il deficit riduce la produzione. Scorte immagazzinabili: materiali, cibo, reagenti e crediti.

Gli incontri non sono personaggi disposti sulla mappa: sono contenuti dell'habitat rivelati dalla ricognizione. Il tipo contemporaneo conta nella risoluzione automatica delle missioni. Non ci sono combattimenti comandati al secondo o un sistema completo di mosse canoniche.

## Multiplayer e salvataggi

Browser diversi o una finestra privata consentono account distinti nello stesso mondo. Due schede normali condividono il ricercatore. Nell'alpha esiste una squadra attiva di massimo tre Pokémon per account, fino a 116 avamposti per universo.

In sviluppo, `data/world.json` conserva il mondo e `accounts.json` gli eventuali hash delle password. In configurazione online si usa `frontier.sqlite`, con tabella account separata. I comandi accettati vengono salvati prima della risposta, oltre ai salvataggi periodici e degli eventi. Non condividere i file dati: contengono sessioni private. Dalla schermata Account puoi proteggere una sessione locale e poi accedere con nome e password da un altro browser. Il recupero via email non è ancora implementato.

Le missioni persistono offline e vengono recuperate dopo un riavvio, senza duplicare ricompense. La migrazione dal precedente prototipo conserva account, risorse, collezione e strutture; assegna caselle agli avamposti e annulla i vecchi ordini di movimento manuale.

## Stato e limiti

**Alpha 0.3 giocabile**, con preparazione alla prima istanza online, non release commerciale definitiva. Implementati: mappa 33×33, spedizioni persistenti, rapporti, progressione interconnessa, produzione e rete energetica, fabbricazione, catture, tipi moderni, mercato sbloccabile, alleanze, chat, account con password e persistenza SQLite opzionale.

Ancora da completare per un lancio pubblico: hosting e dominio, recupero account via email, backup remoto, moderazione, carico e bilanciamento prolungati. Espansioni future: avamposti secondari, PvP territoriale, rinforzi, boss cooperativi, stagioni, evoluzioni e scambi diretti. La configurazione Docker non è stata eseguita su un server remoto. Le basi restano protette. Il profilo predefinito è live ×1; per prove accelerate imposta `GAME_PROFILE=sandbox` su un mondo distinto.

## Dati e immagini

Tipi contemporanei, statistiche base e tabella dei 18 tipi sono inclusi localmente da PokéAPI:

- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_types.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_stats.csv
- Documentazione: https://pokeapi.co/docs/v2

Sprite caricati dal browser dall'archivio https://github.com/PokeAPI/sprites ; font da Google Fonts. Il server, i tipi e le regole funzionano senza Internet; le immagini esterne richiedono connettività. Pokémon e relativi personaggi e marchi appartengono ai rispettivi titolari. Il progetto non è affiliato né autorizzato da essi; la disponibilità degli asset non costituisce una licenza commerciale.

Riferimento del modello territoriale: https://support.travian.com/it/articles/215-guida-la-mappa-coordinate-distanza-e-navigazione

## Test

```powershell
node --test test/*.test.mjs
node balance-audit.mjs
```

La suite verifica regole di base, tipi moderni, missioni territoriali, richiami, consegne uniche, recupero offline e integrazione HTTP. I test HTTP creano e rimuovono soltanto una propria directory temporanea. Il server usato nel browser rimane separato dai test.
