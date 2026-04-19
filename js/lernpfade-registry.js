/**
 * Zentrale Liste aller Lernpfade (HAK Steyr Abendschule · Mathematik).
 *
 * Überkapitel: z. B. Statistik mit `subchapters` (Unterkapitel mit eigenem pathSegment).
 * Erweiterung: Pfade unter dem jeweiligen Blatt-Kapitel; `semesterId` setzen, sobald bekannt.
 *
 * Semester-Reihenfolge (Hub „Nach Semester“): 3. → 4. → 5. → 6. → 7. → 8. (aufsteigend).
 * 7. Sem.: 01–05 (Finanz s7, Statistik, Einleitung Wahrscheinlichkeit); 8. Sem.: 01–04 (Verteilungen …);
 * 6. Sem.: 01–05 (Differenzial-/Integralrechnung, Kosten/Preis, Optimierung).
 * Wahrscheinlichkeitsordner: Navigationsreihenfolge über `chapterNavOrder` (Einstieg, dann 8. Sem.).
 * Finanzmathematik: zwei Lernpfade im 7. Semester (dynamische Investitionsrechnung; Kurs- und Rentabilitätsrechnung).
 * 6. Semester: Überkapitel „Differential- und Integralrechnung“ (Ordner Differential-Integralrechnung) mit Differenzial-/Integralrechnung sowie Wirtschaftsmathematik (Kosten-/Preistheorie, Optimierung).
 * 5. Semester (Hub 01–08): Zins/Zinseszins, Rente, Tilgung; Exp./Log.; lineare, exponentielle, beschränkte Wachstums-/Abnahmeprozesse; logistisches Wachstum.
 * 4. Semester (Hub-Reihenfolge 01–08): Funktionen Grundlagen, lineare Funktionen; LGS, Anwendungen LGS; quadratische Funktionen; quadratische Gleichungen*; Matrizen; Trigonometrie.
 * 3. Semester / Grundlagen (A): Bausteine 01–09 — inkl. lineare Gleichung in einer Variablen (Ordner Gleichungen/lineare-gleichungen); quadratische Gleichungen siehe 4. Sem. (06).
 *
 * Überkapitel-Buchstaben (Reihenfolge in `chapters`, Lehrplan/GK-nah): A Grundlagen, B Gleichungen,
 * C Matrizen, D Trigonometrie, E Funktionen, F Finanzmathematik, G Wachstums- und Abnahmeprozesse,
 * H Differential- und Integralrechnung, I Statistik, J Wahrscheinlichkeitsrechnung.
 */
(function () {
  var semesters = [
    { id: 's3', label: '3. Semester', shortLabel: '3. Sem.', hubOrder: 10 },
    { id: 's4', label: '4. Semester', shortLabel: '4. Sem.', hubOrder: 20 },
    { id: 's5', label: '5. Semester', shortLabel: '5. Sem.', hubOrder: 30 },
    { id: 's6', label: '6. Semester', shortLabel: '6. Sem.', hubOrder: 40 },
    { id: 's7', label: '7. Semester', shortLabel: '7. Sem.', hubOrder: 50 },
    { id: 's8', label: '8. Semester', shortLabel: '8. Sem.', hubOrder: 60 }
  ];

  var chapters = [
    {
      id: 'semester3',
      chapterLetter: 'A',
      title: 'Grundlagen',
      pathSegment: 'Grundlagen',
      hubTabLabel: 'Grundlagen',
      isParentChapter: true,
      subchapters: [
        {
          id: 's3-01-grundlagen',
          title: 'Grundlagen der Mathematik',
          pathSegment: 'Grundlagen/grundlagen-mathematik',
          curriculumRef: '01',
          competencies: [
            'Die Zahlenmengen auf der Zahlengeraden veranschaulichen.',
            'Die Zahlenmengen mit Hilfe mathematischer Symbole beschreiben.',
            'Die Beziehungen zwischen den Zahlenmengen herstellen und erklären.'
          ],
          paths: [
            {
              id: 's3-p01',
              href: 'lernpfad-grundlagen-mathematik.html',
              navLabel: '01 Grundlagen der Mathematik',
              cardTitle: 'Grundlagen der Mathematik',
              semesterTopicCode: '01',
              description:
                'Zahlenmengen auf der Zahlengeraden, mathematische Symbole, Beziehungen zwischen den Mengen — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 10
            }
          ],
          order: 10
        },
        {
          id: 's3-02-grundrechnen',
          title: 'Die 4 Grundrechnungsarten',
          pathSegment: 'Grundlagen/grundrechnungsarten',
          curriculumRef: '02',
          competencies: [
            'Die Zahlenbereiche der natürlichen, ganzen, rationalen und reellen Zahlen beschreiben und damit rechnen.',
            'Berechnungen mit sinnvoller Genauigkeit durchführen und Ergebnisse angemessen runden.',
            'Ergebnisse von Berechnungen abschätzen.'
          ],
          paths: [
            {
              id: 's3-p02',
              href: 'lernpfad-grundrechnungsarten.html',
              navLabel: '02 Die 4 Grundrechnungsarten',
              cardTitle: 'Die 4 Grundrechnungsarten',
              semesterTopicCode: '02',
              description:
                'Natürliche, ganze, rationale und reelle Zahlen; Genauigkeit, Runden und Abschätzen — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 20
            }
          ],
          order: 20
        },
        {
          id: 's3-03-prozent',
          title: 'Rechnen mit Prozenten',
          pathSegment: 'Grundlagen/prozent-rechnen',
          curriculumRef: '03',
          competencies: [
            'Zahlenangaben in Prozent und Promille verstehen, Prozente bzw. Promille berechnen und mit Prozent- bzw. Promilleangaben in unterschiedlichem Kontext rechnen.'
          ],
          paths: [
            {
              id: 's3-p03',
              href: 'lernpfad-prozent-rechnen.html',
              navLabel: '03 Rechnen mit Prozenten',
              cardTitle: 'Rechnen mit Prozenten',
              semesterTopicCode: '03',
              description:
                'Prozent und Promille verstehen, berechnen und im Kontext anwenden — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 30
            }
          ],
          order: 30
        },
        {
          id: 's3-04-masse',
          title: 'Maßeinheiten',
          pathSegment: 'Grundlagen/masseinheiten',
          curriculumRef: '04',
          competencies: [
            'Grundlegende Maßeinheiten (Längen-, Flächen-, Raum- und Hohlmaße, Zeit, Masse) beschreiben, diese zueinander in Beziehung setzen und damit rechnen.',
            'Beliebige Maßeinheiten nach vorgegebenen Kriterien umwandeln.'
          ],
          paths: [
            {
              id: 's3-p04',
              href: 'lernpfad-masseinheiten.html',
              navLabel: '04 Maßeinheiten',
              cardTitle: 'Maßeinheiten',
              semesterTopicCode: '04',
              description:
                'Längen, Flächen, Volumen, Zeit, Masse — Beziehungen und Umrechnungen — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 40
            }
          ],
          order: 40
        },
        {
          id: 's3-05-potenzen',
          title: 'Potenzen',
          pathSegment: 'Grundlagen/potenzen',
          curriculumRef: '05',
          competencies: [
            'Die Rechengesetze von Potenzen mit ganzzahligen und rationalen Exponenten anwenden und begründen.',
            'Potenz- und Wurzelschreibweise ineinander überführen.'
          ],
          paths: [
            {
              id: 's3-p05',
              href: 'lernpfad-potenzen.html',
              navLabel: '05 Potenzen',
              cardTitle: 'Potenzen',
              semesterTopicCode: '05',
              description:
                'Rechengesetze für ganzzahlige und rationale Exponenten; Potenz- und Wurzelform — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 50
            }
          ],
          order: 50
        },
        {
          id: 's3-06-gleitkomma',
          title: 'Gleitkommadarstellung',
          pathSegment: 'Grundlagen/gleitkomma',
          curriculumRef: '06',
          competencies: [
            'Zahlen in Fest- und Gleitkommaschreibweise darstellen, die Darstellungsform wechseln und damit rechnen.'
          ],
          paths: [
            {
              id: 's3-p06',
              href: 'lernpfad-gleitkomma.html',
              navLabel: '06 Gleitkommadarstellung',
              cardTitle: 'Gleitkommadarstellung',
              semesterTopicCode: '06',
              description:
                'Fest- und Gleitkomma, Wechsel der Darstellung und Rechnen — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 60
            }
          ],
          order: 60
        },
        {
          id: 's3-07-terme',
          title: 'Terme',
          pathSegment: 'Grundlagen/terme',
          curriculumRef: '07',
          competencies: [
            'Mit Termen rechnen, Terme umformen und dies durch Rechenregeln begründen.',
            'Die Struktur eines Terms erkennen, um Terme mit der jeweiligen Technologie gezielt verarbeiten zu können.'
          ],
          paths: [
            {
              id: 's3-p07',
              href: 'lernpfad-terme.html',
              navLabel: '07 Terme',
              cardTitle: 'Terme',
              semesterTopicCode: '07',
              description:
                'Termumformungen mit Begründung, Struktur erkennen, Technologie gezielt nutzen — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 70
            }
          ],
          order: 70
        },
        {
          id: 's3-08-formeln',
          title: 'Formeln',
          pathSegment: 'Grundlagen/formeln',
          curriculumRef: '08',
          competencies: [
            'Lineare Gleichungen (Formeln) in mehreren Variablen nach einer variablen Größe explizieren, die gegenseitige Abhängigkeit der Größen interpretieren und erklären.',
            'In Formeln, die auch Potenzen mit rationalen Exponenten enthalten, die gegenseitige Abhängigkeit der Größen interpretieren, erklären und nach einer variablen Größe explizieren.'
          ],
          paths: [
            {
              id: 's3-p08',
              href: 'lernpfad-formeln.html',
              navLabel: '08 Formeln',
              cardTitle: 'Formeln',
              semesterTopicCode: '08',
              description:
                'Mehrere Variablen, Umstellen, Abhängigkeiten deuten; Formeln mit rationalen Potenzen — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 80
            }
          ],
          order: 80
        },
        {
          id: 'gl-sub-lineare-1v',
          title: 'Lineare Gleichungen',
          pathSegment: 'Gleichungen/lineare-gleichungen',
          curriculumRef: '09',
          competencies: [
            'Lineare Gleichungen in einer Variablen lösen.',
            'Die Lösungsmenge einer linearen Gleichung in einer Variablen interpretieren, dokumentieren und in Bezug auf die Aufgabenstellung argumentieren.',
            'Lineare Gleichungen aus den Bereichen Prozentrechnung und Bewegung aufstellen.'
          ],
          paths: [
            {
              id: 'gl-lineare-1v',
              href: 'lernpfad-lineare-gleichungen.html',
              navLabel: '09 Lineare Gleichungen',
              cardTitle: 'Lineare Gleichungen',
              semesterTopicCode: '09',
              description:
                'Eine Variable: lösen, Lösungsmenge deuten und dokumentieren; Sachaufgaben Prozent und Bewegung — Inhalt wird ergänzt.',
              semesterId: 's3',
              order: 90
            }
          ],
          order: 90
        }
      ]
    },
    {
      id: 'gleichungen',
      chapterLetter: 'B',
      title: 'Gleichungen und Gleichungssysteme',
      hubTabLabel: 'Gleichungen',
      pathSegment: 'Gleichungen',
      isParentChapter: true,
      subchapters: [
        {
          id: 'gl-sub-lgs',
          title: 'Lineare Gleichungssysteme',
          pathSegment: 'Gleichungen/lineare-systeme',
          curriculumRef: '03',
          competencies: [
            'Den Zusammenhang zwischen linearer Funktion und linearer Gleichung in zwei Variablen beschreiben.',
            'Die Lösungsmenge eines linearen Gleichungssystems in zwei Variablen als Schnittpunkt zweier Geraden interpretieren.',
            'Verschiedene Lösungsverfahren für lineare Gleichungssysteme in zwei Variablen anführen, lineare Gleichungssysteme in zwei Variablen lösen.'
          ],
          paths: [
            {
              id: 's4-gl-lgs',
              href: 'lernpfad-lineare-gleichungssysteme.html',
              navLabel: '03 Lineare Gleichungssysteme',
              cardTitle: 'Lineare Gleichungssysteme',
              semesterTopicCode: '03',
              description:
                'Geraden, Schnittpunkt, Einsetz-, Gleichsetz- und Additionsverfahren — inhaltlich und rechnerisch. Inhalt wird ergänzt.',
              semesterId: 's4',
              order: 30
            }
          ],
          order: 10
        },
        {
          id: 'gl-sub-anwend',
          title: 'Anwendungsaufgaben linearer Gleichungssysteme',
          pathSegment: 'Gleichungen/anwendungen-lineare-lgs',
          curriculumRef: '04',
          competencies: [
            'Lineare Gleichungssysteme in zwei Variablen für Aufgaben aus den Bereichen Prozentrechnung und Bewegung aufstellen und lösen.',
            'Die Lösungsmenge linearer Gleichungssysteme interpretieren, dokumentieren (auch grafisch) und in Bezug auf die Aufgabenstellung argumentieren.',
            'Probleme aus verschiedenen Anwendungsbereichen in lineare Gleichungssysteme mit mehreren Variablen übersetzen, mit Hilfe von Technologieeinsatz lösen und das Ergebnis in Bezug auf die Problemstellung interpretieren und argumentieren.'
          ],
          paths: [
            {
              id: 's4-gl-anwend',
              href: 'lernpfad-anwendungen-lineare-lgs.html',
              navLabel: '04 Anwendungsaufgaben linearer Gleichungssysteme',
              cardTitle: 'Anwendungsaufgaben linearer Gleichungssysteme',
              semesterTopicCode: '04',
              description:
                'Prozent und Bewegung, Grafik und Argumentation; Systeme mit mehreren Unbekannten mit Technologie. Inhalt wird ergänzt.',
              semesterId: 's4',
              order: 40
            }
          ],
          order: 20
        },
        {
          id: 'gl-sub-quadratisch-gl',
          title: 'Quadratische Gleichungen',
          pathSegment: 'Gleichungen/quadratische-gleichungen',
          curriculumRef: '06',
          competencies: [
            'Quadratische Gleichungen in einer Variablen lösen.',
            'Die Lösungsmenge einer quadratischen Gleichung in einer Variablen über der Grundmenge ℝ interpretieren, dokumentieren und in Bezug auf die Aufgabenstellung argumentieren.'
          ],
          paths: [
            {
              id: 's4-gl-quadratisch',
              href: 'lernpfad-quadratische-gleichungen.html',
              navLabel: '06 Quadratische Gleichungen',
              cardTitle: 'Quadratische Gleichungen*',
              semesterTopicCode: '06',
              description:
                'Lösungsmethoden, Grundmenge ℝ, Deutung und Dokumentation — Inhalt wird ergänzt.',
              semesterId: 's4',
              order: 60
            }
          ],
          order: 30
        }
      ]
    },
    {
      id: 'matrizen',
      chapterLetter: 'C',
      title: 'Matrizen',
      hubTabLabel: 'Matrizen',
      pathSegment: 'Matrizen',
      paths: [
        {
          id: 's4-matrizen',
          href: 'lernpfad-matrizen.html',
          navLabel: '07 Matrizen',
          cardTitle: 'Matrizen',
          semesterTopicCode: '07',
          description:
            'Matrizendarstellung und Elemente; Addition, Subtraktion, Multiplikation und Inverse mit Technologie; Anwendungen inkl. Gozintographen. Inhalt wird ergänzt.',
          semesterId: 's4',
          order: 70
        }
      ]
    },
    {
      id: 'trigonometrie',
      chapterLetter: 'D',
      title: 'Trigonometrie',
      hubTabLabel: 'Trigonometrie',
      pathSegment: 'Trigonometrie',
      paths: [
        {
          id: 's4-trig',
          href: 'lernpfad-trigonometrie.html',
          navLabel: '08 Trigonometrie',
          cardTitle: 'Trigonometrie',
          semesterTopicCode: '08',
          description:
            'Sinus, Cosinus und Tangens im rechtwinkligen Dreieck; Altgrad und Bogenmaß; Einheitskreis und grafische Darstellung — Inhalt wird ergänzt.',
          semesterId: 's4',
          order: 80
        }
      ]
    },
    {
      id: 'funktionen',
      chapterLetter: 'E',
      title: 'Funktionen',
      hubTabLabel: 'Funktionen',
      pathSegment: 'Funktionen',
      isParentChapter: true,
      subchapters: [
        {
          id: 'fun-sub-grundlagen',
          title: 'Funktionen - Grundlagen',
          pathSegment: 'Funktionen/funktionen-grundlagen',
          curriculumRef: '01',
          competencies: [
            'Die Definition der Funktion als eindeutige Zuordnung beschreiben.',
            'Funktionen als Modelle zur Beschreibung von Zusammenhängen zwischen Größen verstehen und erklären.',
            'Funktionen in einer Variablen in einem kartesischen Koordinatensystem darstellen.'
          ],
          paths: [
            {
              id: 's4-f-grundlagen',
              href: 'lernpfad-funktionen-grundlagen.html',
              navLabel: '01 Funktionen - Grundlagen',
              cardTitle: 'Funktionen - Grundlagen',
              semesterTopicCode: '01',
              description:
                'Funktionsbegriff, Zuordnung, Darstellung im Koordinatensystem; Modellbildung. Inhalt wird ergänzt.',
              semesterId: 's4',
              order: 10
            }
          ],
          order: 10
        },
        {
          id: 'fun-sub-linear',
          title: 'Lineare Funktionen',
          pathSegment: 'Funktionen/lineare-funktionen',
          curriculumRef: '02',
          competencies: [
            'Die Darstellungsformen linearer Funktionen interpretieren und erklären, insbesondere die Bedeutung der Parameter „Steigung“ und „Achsenabschnitt“.',
            'Lineare Funktionen implizit und explizit darstellen und zwischen diesen wechseln.',
            'Den Begriff der Umkehrfunktion auf lineare Funktionen anwenden.',
            'Das Modell der linearen Funktion in unterschiedlichen Kontexten, insbesondere mit Wirtschaftsbezug (Kostenfunktion, Erlös- bzw. Umsatzfunktion, Gewinnfunktion, Fixkosten, variable Kosten und Break-even-Punkt) beschreiben und selbstständig lineare Modellfunktionen bilden.'
          ],
          paths: [
            {
              id: 's4-f-linear',
              href: 'lernpfad-lineare-funktionen.html',
              navLabel: '02 Lineare Funktionen',
              cardTitle: 'Lineare Funktionen',
              semesterTopicCode: '02',
              description:
                'Parameter, Darstellungsweisen, Umkehrfunktion, Wirtschaftsmodelle (Kosten, Erlös, Gewinn, Break-even). Inhalt wird ergänzt.',
              semesterId: 's4',
              order: 20
            }
          ],
          order: 20
        },
        {
          id: 'fun-sub-quadratisch',
          title: 'Quadratische Funktionen',
          pathSegment: 'Funktionen/quadratische-funktionen',
          curriculumRef: '05',
          competencies: [
            'Die Bedeutung der Koeffizienten einer quadratischen Funktion f mit f(x)=ax²+bx+c auf den Verlauf ihres Graphen beschreiben und interpretieren.',
            'Quadratische Funktionen aus drei gegebenen Punkten bzw. aus dem Scheitel und einem weiteren Punkt des Funktionsgraphen aufstellen.',
            'Den Zusammenhang zwischen der Lösungsmenge einer quadratischen Gleichung und den Nullstellen einer quadratischen Funktion interpretieren und damit argumentieren.',
            'Das Modell der quadratischen Funktion in unterschiedlichen Kontexten, insbesondere mit Wirtschaftsbezug, anwenden.'
          ],
          paths: [
            {
              id: 's4-f-quadratisch',
              href: 'lernpfad-quadratische-funktionen.html',
              navLabel: '05 Quadratische Funktionen',
              cardTitle: 'Quadratische Funktionen',
              semesterTopicCode: '05',
              description:
                'Normalparabel, Scheitel, Koeffizienten, Aufstellen aus Punkten; Nullstellen, Wirtschaftskontext. Inhalt wird ergänzt.',
              semesterId: 's4',
              order: 50
            }
          ],
          order: 30
        },
        {
          id: 'fun-sub-explog',
          title: 'Exponential- und Logarithmusrechnung/-funktion',
          pathSegment: 'Funktionen/exponential-logarithmus',
          curriculumRef: '04',
          competencies: [
            'Den Begriff des Logarithmus beschreiben.',
            'Logarithmische Rechengesetze anwenden.',
            'Den Begriff der Exponentialfunktion und deren Eigenschaften beschreiben.',
            'Den Begriff der Logarithmusfunktion als Umkehrfunktion der Exponentialfunktion und ihre Eigenschaften beschreiben.',
            'Exponentialfunktionen grafisch darstellen.',
            'Mit Hilfe des Logarithmus Exponentialgleichungen vom Typ a^(k*x)=b nach der Variablen x auflösen.',
            'Komplexere Exponentialgleichungen mit Einsatz von Technologie lösen.'
          ],
          paths: [
            {
              id: 's5-exp-log',
              href: 'lernpfad-exponential-logarithmus.html',
              navLabel: '04 Exponential- und Logarithmusrechnung/-funktion',
              cardTitle: 'Exponential- und Logarithmusrechnung/-funktion',
              semesterTopicCode: '04',
              description:
                'Logarithmusbegriff und Rechengesetze, Exponential- und Logarithmusfunktion inkl. Umkehrfunktion, Grafik, lösen von Exponentialgleichungen — auch mit Technologie. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 40
            }
          ],
          order: 40
        }
      ]
    },
    {
      id: 'finanzmathematik',
      chapterLetter: 'F',
      title: 'Finanzmathematik',
      pathSegment: 'Finanzmathematik',
      hubTabLabel: 'Finanzmath.',
      isParentChapter: true,
      subchapters: [
        {
          id: 'fin-sub-zins',
          title: 'Zins- und Zinseszinsrechnung',
          pathSegment: 'Finanzmathematik/zins-zinseszins',
          curriculumRef: '01',
          competencies: [
            'Die einfache dekursive Verzinsung und die dekursive Verzinsung mittels Zinseszins für ganz- und unterjährige Zinsperioden sowie die stetige Verzinsung beschreiben.',
            'Diese Verzinsungsmodelle kontextbezogen anwenden.'
          ],
          paths: [
            {
              id: 'fin-s5-zins',
              href: 'lernpfad-zins-zinseszins.html',
              navLabel: '01 Zins- und Zinseszinsrechnung',
              cardTitle: 'Zins- und Zinseszinsrechnung',
              semesterTopicCode: '01',
              description:
                'Einfache und dekursive Verzinsung, Zinseszins (ganz/unterjährig), stetige Verzinsung — beschreiben und in Kontextaufgaben anwenden. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 10
            }
          ],
          order: 10
        },
        {
          id: 'fin-sub-renten',
          title: 'Rentenrechnung',
          pathSegment: 'Finanzmathematik/rentenrechnung',
          curriculumRef: '02',
          competencies: [
            'Den Zusammenhang zwischen geometrischen Reihen und der Rentenrechnung beschreiben.',
            'Die charakteristischen Größen der Rentenrechnung berechnen, interpretieren und im Kontext deuten.',
            'Den Begriff des Effektivzinssatzes erklären, mittels Technologie berechnen und das Ergebnis interpretieren.',
            'Zahlungsströme grafisch darstellen und gegebene grafische Darstellungen des Zahlungsstroms interpretieren.',
            'Rentenumwandlungen und Schuldkonvertierungen durchführen und deren Ergebnisse interpretieren.'
          ],
          paths: [
            {
              id: 'fin-s5-renten',
              href: 'lernpfad-rentenrechnung.html',
              navLabel: '02 Rentenrechnung',
              cardTitle: 'Rentenrechnung',
              semesterTopicCode: '02',
              description:
                'Geometrische Reihen, Rentengrößen, Effektivzins, Zahlungsströme grafisch, Umwandlungen und Konvertierungen — mit Technologie. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 20
            }
          ],
          order: 20
        },
        {
          id: 'fin-sub-tilgung',
          title: 'Tilgungspläne',
          pathSegment: 'Finanzmathematik/tilgungsplaene',
          curriculumRef: '03',
          competencies: [
            'Die Annuitätenschuld als eine Möglichkeit der Schuldtilgung beschreiben und diese auf wirtschaftliche Aufgabenstellungen anwenden.'
          ],
          paths: [
            {
              id: 'fin-s5-tilgung',
              href: 'lernpfad-tilgungsplaene.html',
              navLabel: '03 Tilgungspläne',
              cardTitle: 'Tilgungspläne',
              semesterTopicCode: '03',
              description:
                'Annuitätenschuld und Anwendung in Aufgaben — inhaltlich und rechnerisch. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 30
            }
          ],
          order: 30
        },
        {
          id: 'fin-sub-dyn-inv',
          title: 'Dynamische Investitionsrechnung',
          pathSegment: 'Finanzmathematik/dynamische-investitionsrechnung',
          competencies: [],
          paths: [
            {
              id: 'fin-dyn-inv',
              href: 'lernpfad-dynamische-investitionsrechnung.html',
              navLabel: '01 Dynamische Investitionsrechnung',
              cardTitle: 'Dynamische Investitionsrechnung',
              semesterTopicCode: '01',
              description:
                'Kapitalwertmethode, interner Zinssatz und modifizierter interner Zinssatz — Methoden beschreiben, Investitionsanalysen durchführen und Investitionen bewerten. Inhalt wird ergänzt.',
              semesterId: 's7',
              order: 10
            }
          ],
          order: 40
        },
        {
          id: 'fin-sub-kurs',
          title: 'Kurs- und Rentabilitätsrechnung',
          pathSegment: 'Finanzmathematik/kurs-rentabilitaetsrechnung',
          competencies: [],
          paths: [
            {
              id: 'fin-kurs-rent',
              href: 'lernpfad-kurs-rentabilitaetsrechnung.html',
              navLabel: '02 Kurs- und Rentabilitätsrechnung',
              cardTitle: 'Kurs- und Rentabilitätsrechnung',
              semesterTopicCode: '02',
              description:
                'Begriffe erklären und argumentativ nutzen; Rendite, Barwert sowie Kauf- und Verkaufspreis am Kuponzahlungstag (jährliche Kuponzahlung, festverzinsliche Werte) berechnen und deuten. Inhalt wird ergänzt.',
              semesterId: 's7',
              order: 20
            }
          ],
          order: 50
        }
      ]
    },
    {
      id: 'wachstumsprozesse',
      chapterLetter: 'G',
      title: 'Wachstums- und Abnahmeprozesse',
      hubTabLabel: 'Wachstum & Abnahme',
      pathSegment: 'Wachstumsprozesse',
      isParentChapter: true,
      subchapters: [
        {
          id: 'wachstum-linear',
          title: 'Lineare Wachstums- und Abnahmeprozesse',
          pathSegment: 'Wachstumsprozesse/linear',
          curriculumRef: '05',
          competencies: [
            'Die stetigen Modelle für lineares Wachstum beschreiben und mit diesem Modell rechnen, diese grafisch darstellen, interpretieren und im allgemeinen und wirtschaftlichen Kontext deuten.'
          ],
          paths: [
            {
              id: 's5-w-linear',
              href: 'lernpfad-lineare-wachstumsprozesse.html',
              navLabel: '05 Lineare Wachstums- und Abnahmeprozesse',
              cardTitle: 'Lineare Wachstums- und Abnahmeprozesse',
              semesterTopicCode: '05',
              description:
                'Stetige lineare Modelle, Rechnen, Darstellung und Deutung im Kontext. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 50
            }
          ],
          order: 10
        },
        {
          id: 'wachstum-exponentiell',
          title: 'Exponentielle Wachstums- und Abnahmeprozesse',
          pathSegment: 'Wachstumsprozesse/exponentiell',
          curriculumRef: '06',
          competencies: [
            'Exponentialfunktionen als Modelle für Zu- und Abnahmeprozesse interpretieren und damit Berechnungen durchführen.',
            'Die Bedeutung der einzelnen Parameter der Exponentialfunktionen der Form f(x)=a·b^x bzw. f(x)=a·e^(k·x) beschreiben, in unterschiedlichen Kontexten deuten und damit argumentieren.',
            'Die stetigen Modelle für exponentielles Wachstum beschreiben und mit diesem Modell rechnen, diese grafisch darstellen, interpretieren und im allgemeinen und wirtschaftlichen Kontext deuten.'
          ],
          paths: [
            {
              id: 's5-w-exp',
              href: 'lernpfad-exponentielle-wachstumsprozesse.html',
              navLabel: '06 Exponentielle Wachstums- und Abnahmeprozesse',
              cardTitle: 'Exponentielle Wachstums- und Abnahmeprozesse',
              semesterTopicCode: '06',
              description:
                'Exponentielle Modelle, Parameter deuten, stetige Modelle und Anwendungen. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 60
            }
          ],
          order: 20
        },
        {
          id: 'wachstum-beschraenkt',
          title: 'Beschränktes Wachstum- und Abnahmeprozesse',
          pathSegment: 'Wachstumsprozesse/beschraenkt',
          curriculumRef: '07',
          competencies: [
            'Stetige Modelle für beschränktes Wachstum beschreiben und mit diesen Modellen rechnen, diese grafisch darstellen, interpretieren und im allgemeinen und wirtschaftlichen Kontext deuten.'
          ],
          paths: [
            {
              id: 's5-w-beschr',
              href: 'lernpfad-beschraenktes-wachstum.html',
              navLabel: '07 Beschränktes Wachstum- und Abnahmeprozesse',
              cardTitle: 'Beschränktes Wachstum- und Abnahmeprozesse',
              semesterTopicCode: '07',
              description:
                'Beschränkte Wachstumsmodelle — Darstellung, Rechnen und Kontextdeutung. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 70
            }
          ],
          order: 30
        },
        {
          id: 'wachstum-logistisch',
          title: 'Logistisches Wachstum',
          pathSegment: 'Wachstumsprozesse/logistisch',
          curriculumRef: '08',
          competencies: [
            'Logistisches Wachstum beschreiben und mit diesen Modellen rechnen, diese grafisch darstellen, interpretieren und im allgemeinen und wirtschaftlichen Kontext deuten.'
          ],
          paths: [
            {
              id: 's5-w-log',
              href: 'lernpfad-logistisches-wachstum.html',
              navLabel: '08 Logistisches Wachstum',
              cardTitle: 'Logistisches Wachstum',
              semesterTopicCode: '08',
              description:
                'Logistisches Modell: Aufstellen, rechnen, grafisch darstellen und deuten. Inhalt wird ergänzt.',
              semesterId: 's5',
              order: 80
            }
          ],
          order: 40
        }
      ]
    },
    {
      id: 'semester6-analysis',
      chapterLetter: 'H',
      title: 'Differential- und Integralrechnung',
      pathSegment: 'Differential-Integralrechnung',
      hubTabLabel: 'Differential- und Integralrechnung',
      paths: [
        {
          id: 's6-diff-grund',
          href: 'lernpfad-grundlagen-differenzialrechnung.html',
          navLabel: '01 Grundlagen Differenzialrechnung',
          cardTitle: 'Grundlagen Differenzialrechnung',
          semesterTopicCode: '01',
          description:
            'Grenzwert und Stetigkeit, Differenzenquotient mit Interpretation; Zusammenhang Differenzen- und Differenzialquotient, mittlere und lokale Änderungsraten, Sekanten- und Tangentensteigung.',
          semesterId: 's6',
          order: 10
        },
        {
          id: 's6-ableitungen',
          href: 'lernpfad-ableitungen-funktionsbetrachtungen.html',
          navLabel: '02 Ableitungen + Funktionsbetrachtungen',
          cardTitle: 'Differenzialrechnung: Ableitungen + Funktionsbetrachtungen',
          semesterTopicCode: '02',
          description:
            'Ableitungsfunktion grafisch, Ableitungsregeln (u. a. Summe, Faktor, Kette, Produkt, Quotient), e^x und ln, Monotonie und Krümmung.',
          semesterId: 's6',
          order: 20
        },
        {
          id: 's6-kosten-preis',
          href: 'lernpfad-kosten-preistheorie.html',
          navLabel: '03 Kosten- und Preistheorie',
          cardTitle: 'Kosten- und Preistheorie',
          semesterTopicCode: '03',
          description:
            'Nachfrage- und Angebotsfunktionen, Gleichgewicht, Elastizitäten, Kostenverläufe, ertragsgesetzliche Kostenfunktion 3. Grades, typische Begriffe und Grenzfunktionen.',
          semesterId: 's6',
          order: 30
        },
        {
          id: 's6-optimierung',
          href: 'lernpfad-optimierungsprozesse.html',
          navLabel: '04 Optimierungsprozesse',
          cardTitle: 'Optimierungsprozesse',
          semesterTopicCode: '04',
          description:
            'Optimierung unter Nebenbedingungen (Standardmodelle), Methode der kleinsten Quadrate — Idee, Güte, Technologie für Modellgleichungen.',
          semesterId: 's6',
          order: 40
        },
        {
          id: 's6-integral',
          href: 'lernpfad-integralrechnung.html',
          navLabel: '05 Integralrechnung',
          cardTitle: 'Integralrechnung',
          semesterTopicCode: '05',
          description:
            'Bestimmtes Integral intuitiv, Stammfunktion und unbestimmtes Integral, Integrationsregeln, Flächeninhalt, wirtschaftliche Anwendungen inkl. Grenzfunktionen und Zahlungsströme.',
          semesterId: 's6',
          order: 50
        }
      ]
    },
    {
      id: 'statistik',
      chapterLetter: 'I',
      title: 'Statistik',
      pathSegment: 'Statistik',
      isParentChapter: true,
      subchapters: [
        {
          id: 'statistik-grundlagen',
          title: 'Grundlagen der Statistik',
          pathSegment: 'Statistik/grundlagen',
          curriculumRef: '03',
          competencies: [
            'Die unterschiedlichen Datentypen (nominalskaliert, ordinalskaliert, metrisch) beschreiben und erhobene Daten entsprechend zuordnen.',
            'Daten erheben, Häufigkeitsverteilungen (absolute und relative Häufigkeiten) grafisch darstellen und interpretieren.',
            'Die Auswahl einer bestimmten Darstellungsweise problembezogen argumentieren.'
          ],
          paths: [
            {
              id: 'stat-grund-desk',
              href: 'lernpfad-deskriptive-grundlagen.html',
              navLabel: '03 Grundlagen der Statistik',
              cardTitle: 'Grundlagen der Statistik',
              semesterTopicCode: '03',
              description:
                'Fünf-Schritte-Modell der Datenanalyse, Skalenniveaus, absolute und relative Häufigkeiten, sinnvolle Diagramme und problembezogene Begründung — mit Übungen und Abschlussquiz.',
              semesterId: 's7',
              order: 30
            }
          ],
          order: 10
        },
        {
          id: 'statistik-beschreibend',
          title: 'Beschreibende Statistik',
          pathSegment: 'Statistik/beschreibende-statistik',
          curriculumRef: '04',
          competencies: [
            'Verschiedene Zentralmaße (arithmetisches Mittel, Median, Modus, geometrisches Mittel) berechnen, interpretieren und ihre Verwendung unter anderem in Bezug auf die verschiedenen Datentypen argumentieren.',
            'Unterschiedliche Streumaße (Standardabweichung und Varianz, Spannweite, Quartile) berechnen und interpretieren.',
            'Median, Quartile und Spannweite in einem Boxplot darstellen und interpretieren.',
            'Den Korrelationskoeffizienten nach Pearson berechnen und interpretieren.',
            'Die Lorenzkurve und den Gini-Koeffizienten als Konzentrationsmaß nennen, die zugrundeliegende Idee erklären, berechnen und die Ergebnisse im Kontext deuten.'
          ],
          paths: [
            {
              id: 'stat-beschreibend',
              href: 'lernpfad-beschreibende-statistik.html',
              navLabel: '04 Beschreibende Statistik',
              cardTitle: 'Beschreibende Statistik',
              semesterTopicCode: '04',
              description:
                'Vier-Perspektiven-Modell: Zentral- und Streuungsmaße, Boxplot, Pearson-Korrelation, Lorenzkurve und Gini — mit Rechenübungen, Fehlerhinweisen und Abschlussquiz.',
              semesterId: 's7',
              order: 40
            }
          ],
          order: 20
        }
      ]
    },
    {
      id: 'wahrscheinlichkeit',
      chapterLetter: 'J',
      title: 'Wahrscheinlichkeitsrechnung',
      pathSegment: 'Wahrscheinlichkeitsrechnung',
      paths: [
        {
          id: 'wk-grund',
          href: 'lernpfad-wahrscheinlichkeit-grundlagen.html',
          navLabel: '05 Einleitung Wahrscheinlichkeit',
          cardTitle: 'Einleitung Wahrscheinlichkeit',
          semesterTopicCode: '05',
          chapterNavOrder: 10,
          description:
            'Fakultät und Binomialkoeffizient, Laplace und relative Häufigkeit, Additions- und Multiplikationsregel, bedingte Wahrscheinlichkeit — Einstieg mit Rechnern und Übungen.',
          semesterId: 's7',
          order: 50
        },
        {
          id: 'wv-dist',
          href: 'lernpfad-wahrscheinlichkeitsverteilungen.html',
          navLabel: '01 Wahrscheinlichkeitsverteilungen',
          cardTitle: 'Wahrscheinlichkeitsverteilungen',
          semesterTopicCode: '01',
          chapterNavOrder: 20,
          description:
            'Diskret und stetig, PMF und PDF, Verteilungsfunktion, Erwartungswert, Varianz und Standardabweichung — interaktiv mit Beispielen und Quiz.',
          semesterId: 's8',
          order: 10
        },
        {
          id: 'binom',
          href: 'lernpfad-binomialverteilung.html',
          navLabel: '02 Binomialverteilung',
          cardTitle: 'Binomialverteilung',
          semesterTopicCode: '02',
          chapterNavOrder: 30,
          description:
            'Modell Bin(n, p): Voraussetzungen, PMF und CDF, Kennzahlen, Sales-Beispiel und interaktives Balkendiagramm mit Übungen.',
          semesterId: 's8',
          order: 20
        },
        {
          id: 'nv-grund',
          href: 'lernpfad-normalverteilung.html',
          navLabel: '03 Normalverteilung',
          cardTitle: 'Normalverteilung',
          semesterTopicCode: '03',
          chapterNavOrder: 40,
          description:
            'Glockenkurve, Begriffe (μ, σ, Dichte), Faustregel 68–95–99,7, Standardisierung und Anwendungen mit Übungen.',
          semesterId: 's8',
          order: 30
        },
        {
          id: 'nv-approx',
          href: 'lernpfad-approximation-normalverteilung.html',
          navLabel: '04 Approximation der BV durch NV',
          cardTitle: 'Approximation der BV durch NV',
          semesterTopicCode: '04',
          chapterNavOrder: 50,
          description:
            'Von der Binomialverteilung zur Normalverteilung: Faustregeln, Stetigkeitskorrektur, GeoGebra und Aufgaben zur Näherung.',
          semesterId: 's8',
          order: 40
        }
      ]
    },
  ];

  function semesterById(sid) {
    for (var i = 0; i < semesters.length; i++) {
      if (semesters[i].id === sid) return semesters[i];
    }
    return null;
  }

  /** Alle „Blatt“-Kapitel: ohne subchapters, jeweils mit parent (Überkapitel) oder null. */
  function eachLeafChapter(callback) {
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i];
      if (ch.subchapters && ch.subchapters.length) {
        for (var j = 0; j < ch.subchapters.length; j++) {
          callback(ch.subchapters[j], ch);
        }
      } else {
        callback(ch, null);
      }
    }
  }

  function chapterById(cid) {
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i];
      if (ch.id === cid) return ch;
      if (ch.subchapters) {
        for (var j = 0; j < ch.subchapters.length; j++) {
          if (ch.subchapters[j].id === cid) return ch.subchapters[j];
        }
      }
    }
    return null;
  }

  function chapterByPathSegment(segment) {
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i];
      if (ch.pathSegment === segment) return ch;
      if (ch.subchapters) {
        for (var j = 0; j < ch.subchapters.length; j++) {
          if (ch.subchapters[j].pathSegment === segment) return ch.subchapters[j];
        }
      }
    }
    return null;
  }

  function getNavLinksForPathSegment(segment) {
    var ch = chapterByPathSegment(segment);
    var links = [{ id: 'index', href: 'index.html', label: 'Übersicht' }];
    if (!ch || !ch.paths || !ch.paths.length) return links;
    var hasChapterNav = false;
    for (var hi = 0; hi < ch.paths.length; hi++) {
      if (ch.paths[hi].chapterNavOrder != null) {
        hasChapterNav = true;
        break;
      }
    }
    var sorted = ch.paths.slice().sort(function (a, b) {
      if (hasChapterNav) {
        return (a.chapterNavOrder || 0) - (b.chapterNavOrder || 0);
      }
      return (a.order || 0) - (b.order || 0);
    });
    for (var i = 0; i < sorted.length; i++) {
      var p = sorted[i];
      links.push({ id: p.id, href: p.href, label: p.navLabel });
    }
    return links;
  }

  function pathUrl(chapter, pathEntry) {
    return chapter.pathSegment + '/' + pathEntry.href;
  }

  function displayChapterTitle(leaf, parent) {
    if (parent) {
      var Lp = parent.chapterLetter ? parent.chapterLetter + ' · ' : '';
      return Lp + parent.title + ' · ' + leaf.title;
    }
    var Lf = leaf.chapterLetter ? leaf.chapterLetter + ' · ' : '';
    return Lf + leaf.title;
  }

  function getPathsGroupedBySemester() {
    var semList = semesters.slice().sort(function (a, b) {
      var oa = a.hubOrder != null ? a.hubOrder : 1000 + semesters.indexOf(a);
      var ob = b.hubOrder != null ? b.hubOrder : 1000 + semesters.indexOf(b);
      return oa - ob;
    });
    var out = [];
    for (var si = 0; si < semList.length; si++) {
      var sem = semList[si];
      var items = [];
      eachLeafChapter(function (leaf, parent) {
        if (!leaf.paths || !leaf.paths.length) return;
        for (var pi = 0; pi < leaf.paths.length; pi++) {
          var p = leaf.paths[pi];
          if (p.semesterId === sem.id) {
            items.push({
              chapter: leaf,
              parentChapter: parent,
              path: p,
              url: pathUrl(leaf, p),
              displayTitle: displayChapterTitle(leaf, parent)
            });
          }
        }
      });
      items.sort(function (a, b) {
        var oa = a.path.order || 0;
        var ob = b.path.order || 0;
        if (oa !== ob) return oa - ob;
        return a.displayTitle.localeCompare(b.displayTitle, 'de');
      });
      out.push({ semester: sem, items: items });
    }
    return out;
  }

  function getChaptersForHub() {
    return chapters.slice();
  }

  function getParentChapter(chapterId) {
    for (var i = 0; i < chapters.length; i++) {
      var ch = chapters[i];
      if (!ch.subchapters) continue;
      for (var j = 0; j < ch.subchapters.length; j++) {
        if (ch.subchapters[j].id === chapterId) return ch;
      }
    }
    return null;
  }

  function getUberChapterLetterForChapterId(chapterId) {
    if (!chapterId) return '';
    var p = getParentChapter(chapterId);
    if (p) return p.chapterLetter || '';
    var ch = chapterById(chapterId);
    return (ch && ch.chapterLetter) || '';
  }

  function injectChapterLetterBadge() {
    if (document.querySelector('.lp-chapter-letter-badge')) return;
    var cid =
      document.body.getAttribute('data-chapter-id') ||
      document.body.getAttribute('data-parent-chapter-id');
    if (!cid) {
      var folderAttr = document.body.getAttribute('data-chapter-folder');
      if (folderAttr) {
        var leafCh = chapterByPathSegment(folderAttr);
        if (leafCh) cid = leafCh.id;
      }
    }
    var letter = getUberChapterLetterForChapterId(cid);
    if (!letter) return;
    var h1 = document.querySelector('.hub-hero h1, .hero h1');
    if (!h1) return;
    h1.classList.add('lp-chapter-title-with-letter');
    var span = document.createElement('span');
    span.className = 'lp-chapter-letter-badge';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', 'Überkapitel ' + letter);
    span.textContent = letter;
    h1.insertBefore(span, h1.firstChild);
  }

  window.LernpfadeRegistry = {
    semesters: semesters,
    chapters: chapters,
    semesterById: semesterById,
    chapterById: chapterById,
    chapterByPathSegment: chapterByPathSegment,
    getNavLinksForPathSegment: getNavLinksForPathSegment,
    getPathsGroupedBySemester: getPathsGroupedBySemester,
    getChaptersForHub: getChaptersForHub,
    getParentChapter: getParentChapter,
    getUberChapterLetterForChapterId: getUberChapterLetterForChapterId,
    injectChapterLetterBadge: injectChapterLetterBadge,
    pathUrl: pathUrl,
    displayChapterTitle: displayChapterTitle
  };
})();
