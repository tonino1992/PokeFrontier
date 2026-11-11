# Albero tecnologico e confronti dei livelli

La voce **Albero tecnologico** della navigazione contiene strutture e ricerche. Scegli un elemento e un livello obiettivo da 1 a 20. Il diagramma mostra i requisiti diretti e indiretti, i livelli precedenti, il limite imposto dal Laboratorio e l’eventuale potenza installata minima. Verde indica un requisito raggiunto; ambra uno ancora mancante. I nodi sono collegamenti alle rispettive schede.

Le sezioni **Contribuisce a sbloccare** e **Requisiti per livelli superiori** separano nuovi edifici, ricerche, ricette, missioni e soglie di progressione. Un livello indicato è un contributo allo sblocco: gli altri prerequisiti restano necessari. Costi e durata riguardano il singolo passaggio, non l’intero percorso.

Nelle pagine Avamposto e Ricerca ogni scheda contiene il confronto attuale → successivo e il collegamento **Requisiti e livelli**. Il dettaglio tecnologico offre anche la tabella degli effetti da 0 a 20.

I valori vengono calcolati sul server da `technology.mjs`, usando le formule del motore e una copia del giocatore: non vengono modificati salvataggi o impostazioni. Per ciascun livello cambia solo l’elemento selezionato. Personale, tipi, talenti, regolazioni produttive e altri livelli restano quelli attuali. Il consumo aggiuntivo o i nuovi posti possono ridurre l’efficienza; le produzioni mostrate sono prima della saturazione del magazzino. I tempi base sono percentuali rispetto al tempo non accelerato di costruzione/ricerca, mentre la durata di una ricetta include i coefficienti del personale. Il costo per raggiungere un livello è calcolato a partire dal suo livello precedente.

`test/technology.test.mjs` controlla i 400 nodi, l’assenza di cicli, i confronti numerici, i salti di squadra dell’Habitat e gli sblocchi delle ricette. Il test HTTP verifica autenticazione, risposta delle anteprime e gestione degli elementi non validi.
