# Percorso verso l’alpha completa

La scaletta concordata resta il riferimento. Questo registro distingue ciò che funziona nel codice dai passi ancora da realizzare; un’interfaccia finita non equivale a un gioco completo.

## 1. Pokémon al centro — prima implementazione 0.3

Implementato:
- incarichi esclusivi e compatibilità per tipo, entrambi i tipi validi;
- personale nelle dodici strutture, posti crescenti fino a tre;
- servizio autonomo, moduli automatici e anteprima economica sul server;
- 51 talenti di lavoro, tre per ciascuno dei 17 tipi presenti nelle 151 specie standard di Kanto;
- scelta distinta del tipo **a ogni cattura** di un doppio tipo, prima della partenza;
- probabilità 70/25/5 e rara garantita alla quarantesima cattura riuscita consecutiva senza rara dello stesso insieme;
- talenti congelati nel risultato di missione e conservati alla consegna e al riavvio;
- scelta iniziale una tantum per starter ed esemplari precedenti;
- bonus locali a resa, energia, costi, code e spedizioni; copia guida al 100%, seconda al 50%, terza al 25%, cap 25% o 20% sui risparmi;
- filtri per tipo, rarità e incarico nel Pokédex;
- cambi di mansione applicati al solo lavoro residuo, costi già pagati invariati;
- ordine cronologico delle consegne di fabbricazione durante il recupero offline.

Da completare in questo filone: competenze lavorative, evoluzioni, riqualificazione deterministica e strumenti di confronto più avanzati. Alcuni talenti del piano sono stati tradotti in effetti già funzionanti: non sono implementati bonus a progetti, biomi speciali o attività che ancora non esistono. Il catalogo effettivo è `workforce.mjs`; il piano di design non costituisce un elenco di funzionalità disponibili.

## 2. Spedizioni e territorio

Già presenti: ricognizione, studio, cattura, raccolta, contenimento, strumenti e requisiti; i talenti della squadra modificano viaggio, cibo, operazione, carico o premio. Le caratteristiche vengono congelate alla partenza.

Prossimi passi: giacimenti e punti di interesse con specializzazioni, rischi e informazioni dichiarati; più squadre indipendenti; crescita della mappa e assegnazione equa degli avamposti. Accettazione: almeno due destinazioni sensate per uno stesso obiettivo, senza obbligare a uno specifico Pokémon.

## 3. Progressione completa

Presente il grafo di 12 edifici, 8 tecnologie e 7 ricette. La pagina Albero tecnologico mostra requisiti diretti e indiretti, soglie di sblocco, costi e confronto degli effetti per livello; le schede includono il confronto attuale → successivo. I nuovi coefficienti richiedono una nuova misura dei tempi: non è ancora validata una durata di due settimane. Prossimi passi: traguardi per fase, obiettivi economici e scientifici, interconnessioni avanzate e simulazioni di più stili.

## 4. Mondo sociale

Presenti alleanze, radio e mercato regionale. Mancano offerte tra giocatori, spedizioni cooperative e progetti di alleanza. Ogni funzione dovrà avere scadenze, consegne atomiche e alternative per chi gioca solo.

## 5. Obiettivi paralleli

Presenti Pokédex, studi, prestigio, incarichi iniziali e ricerca dei talenti. Da aggiungere: programmi scientifici, conservazione, collezioni tematiche, eventi e spedizioni leggendarie articolate.

## 6. Economia verificata

I test controllano raggiungibilità e integrità. La simulazione iniziale misura un generalista senza lavoratori. Da estendere a specialisti, collezionisti, automazione e gioco saltuario per almeno 14 giorni simulati. Misurare costi, inflazione, surplus, tempi morti e dispersione dei talenti. Nessuna dichiarazione di equilibrio competitivo prima di queste verifiche e dei test con persone.

## 7. Alpha online

Presenti account, SQLite e preparazione HTTPS. Il mondo attuale resta locale, 21×21 e massimo 25 account: non è ancora il mondo da cento persone. Servono dimensionamento, trasferimento efficiente dello stato, prova concorrente con 100 sessioni, backup con prova di ripristino, amministrazione e tutorial/mobile. Aprire prima un’alpha da 10–20 persone quando il ciclo centrale è validato.
