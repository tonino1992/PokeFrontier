# Personale e abilità — regole effettive 0.3

Questa è la prima tappa della scaletta, con coefficienti di prova. Il catalogo implementato si trova in `workforce.mjs`; i dati dei tipi restano quelli contemporanei di Kanto.

## Incarichi

Un esemplare può stare in squadra, in riserva o al lavoro. L’assegnazione rimuove il Pokémon dalla squadra; la liberazione lo lascia in riserva. Non è possibile spostare un membro del gruppo in viaggio. Entrambi i tipi consentono l’accesso alle mansioni; una mansione occupa un solo posto.

Posti: uno ai livelli 1–5, due ai livelli 6–10, tre dal livello 11. Il contributo di un lavoratore è 1, con +0,5% per livello generale oltre il primo e massimo 1,1. Le competenze lavorative separate non sono ancora implementate.

Operatività: `max(base, 70% + 30% × min(1, contributo personale / posti))`. Base 70% in servizio, 85% in automazione. L’energia e i talenti di resa si applicano dopo l’operatività agli impianti produttivi. I rifornimenti minimi 20 materiali/h, 12 cibo/h e 4 reagenti/h restano disponibili senza energia o personale.

I pannelli solari funzionano al 100% anche senza personale. Gli Elettro possono migliorarne l’uscita; non sono combustibile. Nessuna energia viene immagazzinata.

Applicazioni:
- Cava, Coltivazioni, Estrattore: resa dell’impianto.
- Centro operativo: velocità delle costruzioni; Laboratorio: velocità delle ricerche.
- Officina, Habitat, Infermeria, Osservatorio e Deposito: velocità delle rispettive ricette.
- Infermeria: contributo alla guarigione della squadra alla base.
- Magazzino: incremento di capacità dovuto ai suoi livelli; la capacità base di 2000 resta disponibile.
- Osservatorio: parte del bonus alla velocità di viaggio, +2% per livello × operatività.
- Deposito: bonus al carico, +8% per livello × operatività.

Cambiare personale, modalità o talento iniziale rivaluta soltanto il lavoro residuo delle code. I costi già pagati rimangono pagati; gli sconti valgono sulle operazioni nuove. I costi delle ricette vengono arrotondati per unità e poi moltiplicati per il lotto. Le scorte eccedenti una capacità ridotta sono conservate.

## Automazione

Disponibile dal Centro operativo 2, sulle strutture già costruite. Il modulo costa `80 × livello struttura` materiali e `20 × livello struttura` reagenti al momento della prima installazione. Rimane installato, copre anche i futuri posti e può essere disattivato e riattivato gratuitamente. Non sono ancora presenti livelli separati dei moduli.

Se i posti non sono completamente coperti, l’automazione aumenta del 20% la domanda dell’impianto produttivo interessato. Questa prima implementazione applica il sovraccarico solo a Cava, Coltivazioni ed Estrattore: non aggiunge domanda elettrica alle code di servizio. L’anteprima sul server mostra l’effetto reale prima del pagamento. Anche senza modulo, l’intero grafo essenziale è raggiungibile in servizio.

## Abilità e catture

Ogni cattura di un Pokémon a doppio tipo richiede di scegliere uno dei due tipi durante la preparazione; la scelta viene cancellata dopo l’invio e va rifatta alla cattura successiva. Il server non accetta una cattura a doppio tipo senza una scelta valida, anche usando direttamente l’API. Per un tipo singolo la scelta è implicita.

Il tiro avviene solo dopo il successo della cattura: 70% comune, 25% non comune, 5% rara. Alla 40ª cattura riuscita senza rara dello stesso tipo viene assegnata una rara garantita. Una rara azzera quel contatore; fallimenti, richiami e catture di altri tipi non lo aumentano. La garanzia rende la frequenza effettiva di rare superiore al 5% nel lungo periodo.

L’abilità è salvata nel risultato dell’operazione e copiata nel nuovo esemplare al rientro. Ricaricare, cambiare mansione o riavviare il server non dà una nuova estrazione. Il tipo del talento non cambia i tipi del Pokémon.

Starter ed esemplari precedenti rimangono intatti: il proprietario sceglie una volta il tipo, poi il server estrae e salva l’abilità. Questa inizializzazione non aumenta il contatore delle catture. Non esistono ritiri del talento sullo stesso esemplare.

## Bonus

Ogni talento dichiara strutture o missioni e un singolo effetto. Le copie dello stesso effetto sono ordinate per contributo: guida al 100%, seconda al 50%, terza al 25%. Cap 25% a resa/velocità, 20% ai risparmi di materiali, cibo, reagenti ed energia. Nessuna propagazione tra edifici.

I talenti di spedizione valgono solo per i membri del gruppo, congelati alla partenza: viaggio, durata dell’operazione, cibo, carico o ricompensa degli studi. Le Ball non aumentano la rarità dei talenti. La standardizzazione dell’Acciaio richiede almeno cinque unità nel lotto.

Alcuni nomi ed effetti differiscono dal piano generale: nella prima versione i talenti fanno soltanto cose già supportate. Recupero chimico è uno sconto sui reagenti dei lotti nuovi, non un rimborso; Rete efficiente aumenta localmente la generazione; i talenti specialistici di studio modificano i premi degli studi unici. Progetti maggiori, recupero habitat, qualificazione e biomi speciali restano nella roadmap.

## Verifica

`node --test test/*.test.mjs` comprende test di esclusività, doppio tipo scelto a ogni cattura, persistenza, garanzia, costi, automazione, anteprima senza modifiche e ripianificazione delle code. `node balance-audit.mjs` misura anche il percorso senza lavoratori. I risultati sono prove di integrità e raggiungibilità, non una validazione della durata competitiva o della capacità per cento giocatori.
