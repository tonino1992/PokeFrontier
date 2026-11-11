# Preparazione alla versione online

## Stato della consegna

Non è stato scelto un hosting e non è stato pubblicato alcun servizio. Il progetto contiene ora una configurazione concreta per una prima beta chiusa online: server persistente, account con password, login da altri browser, database SQLite, dominio HTTPS tramite Caddy e volume dati persistente. La mappa offre 116 avamposti distinti per universo. Il playtest simula 100 ricercatori sullo stesso server di gioco.

## Architettura della prima istanza

Browser → HTTPS/Caddy → un processo Node.js 24 → SQLite su volume persistente.

Un processo autorevole gestisce territorio, economia, code, missioni e ricompense. Il client invia comandi e riceve aggiornamenti SSE. Gli eventi temporizzati sono registrati nel mondo: chiudere un browser non ferma la partita. SQLite salva atomicamente lo snapshot del mondo; gli account sono in una tabella separata. La creazione di un account e il suo primo snapshot vengono salvati nella stessa transazione in modalità SQLite.

Non avviare più istanze del simulatore sullo stesso universo: la simulazione è in memoria e il progetto non contiene ancora un coordinamento fra processi. Per più mondi si usano istanze e volumi distinti. Per espandere un singolo mondo serviranno un database relazionale strutturato e un sistema di eventi idempotenti fra worker.

## File già presenti

- `Dockerfile`: runtime Node 24, utente non root, controllo di salute.
- `compose.yaml`: gioco, reverse proxy e volumi separati.
- `Caddyfile`: HTTPS e proxy con flusso SSE non bufferizzato.
- `.env.example`: dominio da configurare.
- `storage.mjs`: JSON per sviluppo locale o SQLite per la configurazione online.
- `auth.mjs`: hash scrypt con salt casuale e confronto a tempo costante.
- `balance.mjs`: unica sorgente dei parametri economici.

## Quando saranno disponibili server e dominio

1. Scegliere un server persistente con Docker e Compose, non un hosting solo statico.
2. Collegare il dominio al server e rendere raggiungibili le porte HTTP/HTTPS del proxy.
3. Copiare il progetto; creare `.env` a partire da `.env.example` e impostare `DOMAIN`.
4. Avviare dalla cartella del progetto:

```sh
docker compose up --build -d
docker compose logs --tail=100 game proxy
```

5. Verificare il dominio HTTPS, la creazione account e l'accesso da due browser distinti.
6. Eseguire una spedizione, riavviare il servizio e controllare rapporto, scorte e consegna unica.
7. Impostare backup e monitoraggio prima di invitare giocatori.

La configurazione Docker è stata preparata ma non eseguita né verificata su un VPS in questa consegna. Server, autenticazione e persistenza SQLite sono verificati tramite test HTTP locali. Il rilascio reale resta una fase separata quando avremo infrastruttura e dominio.

## Configurazione

| Variabile | Uso |
|---|---|
| NODE_ENV=production | Attiva i requisiti della configurazione online |
| PUBLIC_ORIGIN=https://dominio | Origine esatta consentita, senza percorsi o slash finale |
| PERSISTENCE=sqlite | Persistenza online richiesta |
| DATA_DIR | Directory privata e persistente, fuori dai file statici |
| HOST=0.0.0.0 | Ascolto del servizio interno al container |
| PORT=3100 | Porta interna del gioco |
| GAME_PROFILE=live | Economia e tempi ×1 |
| GAME_PROFILE=sandbox | Mondo di test ×20, da non mescolare al mondo competitivo |
| AUTH_REQUIRED=true | Obbligo di password anche fuori da production |
| TRUST_PROXY=true | Usa l'IP inoltrato da un reverse proxy controllato |

La porta del gioco non è pubblicata direttamente da Compose: soltanto Caddy espone 80/443. TRUST_PROXY va mantenuto disattivato se il server è raggiungibile direttamente da client non fidati. In produzione l'avvio fallisce se mancano SQLite o un'origine HTTPS valida.

## Account

La registrazione online richiede una password di 12–128 caratteri. Password memorizzate come hash scrypt, non in chiaro. Cookie di sessione HttpOnly/SameSite=Strict, anche Secure in produzione, durata 30 giorni. Logout revoca il token. Limiti ai comandi e ai tentativi di autenticazione; controllo dell'origine delle richieste. Credenziali e hash non sono inclusi nello stato inviato al browser.

In locale è ancora possibile creare una sessione senza password. Dalla schermata Account il proprietario può proteggerla prima di spostare il mondo online. Per migrare: trasferire insieme `world.json` e `accounts.json` nella directory dati prima del primo avvio SQLite; l'import iniziale conserva entrambi. Conservare una copia privata dei file originali. I vecchi cookie locali non sono credenziali valide sul nuovo dominio: si rientra con nome e password.

Non è implementato un recupero password via email né la verifica dell'indirizzo email. Prima di una beta pubblica va completato il ciclo di recupero account e definito il servizio di assistenza. Non inviare password nei messaggi del gioco.

## Persistenza e operatività

SQLite è configurato in WAL con synchronous=FULL. I comandi accettati vengono salvati prima della risposta; gli eventi pianificati vengono salvati alla risoluzione, con un ulteriore salvataggio periodico. Health endpoint: `/api/health`.

Il volume dati contiene informazioni private, incluse le sessioni. Non servirlo via web e non inserirlo in archivi pubblici del progetto. Per un backup consistente del file SQLite usare un backup SQLite online o fermare il gioco e copiare la directory dati completa; non copiare il solo file principale mentre esistono scritture WAL. Verificare il ripristino su un'istanza di prova, non solo l'esistenza della copia.

## Prima di un lancio pubblico più ampio

Completare recupero account, moderazione/segnalazioni, politiche dati, backup remoto e allarmi; misurare carico, dimensione degli snapshot e tempi del database; validare il bilanciamento con giocatori reali e verificare i diritti dei contenuti. Il prototipo attuale non comprende ancora PvP territoriale, nuove colonie, commercio diretto fra utenti o stagioni. Nessuna monetizzazione è attiva.
