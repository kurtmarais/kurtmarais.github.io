# Studenteverslag: hoe om die Excel-lêer te lees

Die skrip `student_report.py` lees die inskrywings-, puntelys- en
nagraadse aansoekverslae en skryf een Excel-lêer met die oortjies hieronder.
Statusse en name van kolomme in die lêer is in Engels; hierdie gids verduidelik
wat hulle beteken.

## Kleure

| Kleur | Betekenis |
|---|---|
| Groen | Geslaag, `Eligible` of `Qualifies` |
| Geel | Punt nog uitstaande (`Outstanding`). Dit beïnvloed nie die status nie. |
| Oranje | `Check eligibility`: moet met die hand nagegaan word |
| Rooi | Gedruip (onder 50), `Not eligible` of `Below 60%` |
| Grys | Module nie geneem nie (`Not taken`) |
| Blou | Eksterne aansoeker |

## Overview (oorsig)

Telling per program. Elke afdeling het 'n geel sel by **Programme**: kies 'n
program uit die aftreklys om net daardie program te tel, of `All` vir almal.
Die tellings werk vanself by wanneer punte op die **Modules**-oortjie
ingevul word.

- **BDatSci**: hoeveel studente na die finale jaar kan voortgaan (`Eligible`),
  verdeel in "all marks in" en "marks outstanding", en hoeveel nie
  (`Not eligible`).
- **Honours**: hoeveel kwalifiseer, hoeveel nagegaan moet word
  (`Check eligibility`, volgens 3 of 2 OR3-modules), hoeveel onder 60% is,
  hoeveel nie in aanmerking kom nie, en hoeveel eksterne aansoekers.
- **Masters / PhD**: totale aansoekers, intern en ekstern, en die telling per
  `Program Eligibility Status` uit die aansoekverslag.

## BDatSci

Een ry per BDatSci-student wat moontlik na die finale jaar kan voortgaan.

**Wie is ingesluit:** BDatSci-studente wat vanjaar ingeskryf is, met ten minste
een van OR 314, 344 of 352 op rekord. **Uitgesluit:** Student Status
"Final Year"; 'n fokusarea anders as Analytics and Optimisation (geen
fokusarea word ingesluit); hoogste modulevlak vanjaar laer as 3.

- **Status**: `Eligible` = niks gedruip nie, en OR 314, 344 en 352 is geslaag
  of word geneem. `Not eligible` = 'n module gedruip, of nie vir een van die
  drie OR-modules ingeskryf nie. Uitstaande punte verander nie die status nie.
- **Operations Research 314 / 344 / 352**: uitslag van elke vereiste module,
  met die punt tussen hakies, `Outstanding`, of `Not enrolled (required)`.
- **Failed modules (below 50)**: name en punte van alle gedruipte modules.
- **Failed / Required not enrolled / Outstanding marks**: tellings; rooi of
  geel as dit meer as 0 is.
- **Highest module level this year / Level-4 modules this year**: net vir
  inligting, word nie vir besluite gebruik nie.
- **Repeated modules**: modules wat meer as een keer geneem is.

## Honours

Net aansoekers vir Honneurs, en net OR-modules (55336-2xx en 55336-3xx) tel.

- **Status** (in hierdie volgorde bepaal):
  1. `Not eligible (failed OR module)`: 'n OR-module gedruip.
  2. `Not eligible (fewer than 2 OR3 modules)`: 0 of 1 OR3-modules geneem.
  3. `Below 60%`: OR3-gemiddeld tot dusver onder 60%.
  4. `Check eligibility`: 2 of 3 OR3-modules geneem; gaan met die hand na.
  5. `Qualifies`: al 4 OR3-modules geneem, niks gedruip nie, gemiddeld 60% of
     hoër.
  6. `External applicant`: geen US-nommer nie; onderaan gelys.
- **Rank**: net studente met `Qualifies` en 'n gemiddeld, van hoog na laag.
- **OR3 modules taken**: aantal OR3-modules ingeskryf of met 'n punt.
- **OR3 average / OR2 average / OR2 + OR3 average**: ongeweegde gemiddeldes
  van die punte wat reeds beskikbaar is.
- **OR 314, OR 322, ... (een kolom per module)**: die punt wat tel, of
  `Outstanding` / `Not taken`.
- **Mark improvement (earlier mark)**: modules wat vroeër 'n punt gehad het en
  vanjaar weer ingeskryf is, met die vroeëre punt tussen hakies. Die nuwe punt
  (of `Outstanding`) tel.
- **Current programme**: die student se huidige program (laaste inskrywing).
- Verder: aansoekbesonderhede en vorige tersiêre studies uit die aansoekverslag.

## Masters en PhD

Een ry per aansoeker, interne aansoekers (met US-nommer) eerste. Iemand wat
vir meer as een program aansoek gedoen het, kry een ry met al die programme en
die status van elke aansoek. Die skrip besluit nie oor geskiktheid nie; gebruik
die `Eligibility Status` uit die aansoekverslag.

## Modules

Die bron van al die berekeninge. Elke student het 'n vet ry (met 'n opsomming
en gedruipte modules), met die student se modules daaronder gegroepeer. Gebruik die
+/- in die linkerkantlyn om 'n student oop of toe te vou.

- **Mark** (geel selle): **tik hier punte in (0 tot 100)**. Die uitslag,
  statusse, gemiddeldes en die Oorsig werk vanself by.
- **Result**: `Passed`, `Failed`, `Outstanding`, `Not taken` of
  `Not enrolled (required)`.
- **Mark improvement (earlier mark)**: vroeëre punt as die module herhaal word.
- **Attempts**: elke poging met semester en punt, bv. `Semester 3: 42; Semester 5: 63`.
- **Changed by hand**: `Yes` as die punt verskil van die oorspronklike verslag.

## Notes

Die reëls wat gebruik is, die lêers wat gelees is, die "BDatSci check" (hoeveel
studente by elke stap uitgesluit is) en hoeveel aansoekrye oorgeslaan is
(gewoonlik die voetry van die verslag).

## Wenke

- Rye word gesorteer wanneer die lêer geskep word. Na die invul van punte:
  gebruik die filterpyltjies om weer te sorteer.
- Die BDatSci-, Honours-, Masters- en PhD-oortjies is Excel-tabelle: klik in die tabel en kies
  *Table Design > Insert Slicer* om 'n snyer (bv. op Programme) by te voeg.
- As Excel die lêer in *Protected View* oopmaak, klik *Enable Editing* sodat
  die formules bereken word.
