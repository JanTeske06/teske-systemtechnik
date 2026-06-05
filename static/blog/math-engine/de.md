Eine Zahl auswerten, die als Text hereinkommt, etwa `3 + 4 * 2` aus einem Formularfeld, einer Konfigurationsdatei oder einer API, klingt nach einer Zeile Python: `eval("3 + 4 * 2")`. Genau diese Zeile ist das Problem. Mit **Math Engine** habe ich eine vollständige Auswertungs-Engine von Grund auf gebaut, die mathematische Ausdrücke sicher, exakt und nachvollziehbar berechnet, ganz ohne Pythons `eval()`. Seit dieser Woche ist sie als Version 0.6.7 live auf PyPI.

## Warum nicht einfach eval()

`eval()` führt beliebigen Python-Code aus. Eine als Zahl getarnte Eingabe wie `__import__('os').system(...)` wird klaglos ausgeführt. Für jede Anwendung, die Ausdrücke aus einer Datei, einem Formular oder einer API entgegennimmt, ist `eval()` damit kein Taschenrechner, sondern ein offener Weg zur Code-Ausführung.

Dazu kommen zwei leisere Defekte. Erstens die Korrektheit: Pythons `float` rechnet binär, `0.1 + 0.2` ergibt `0.30000000000000004`. Für eine Finanz-Formel oder einen Lehrkontext ist das nicht fast richtig, sondern falsch. Zweitens die Diagnostik: Ein kaputter Ausdruck liefert einen Python-Traceback an einer internen Zeilennummer, nicht die Stelle im Eingabe-String, an der das Problem wirklich sitzt.

Die Aufgabe war also eine Engine, die niemals fremden Code ausführt, exakt statt näherungsweise rechnet und jeden Fehler zeichengenau lokalisiert. Und das in Bibliotheks-Qualität: getestet, dokumentiert, versioniert und per `pip` installierbar.

## Sicher, weil es gar nicht anders kann

Die Engine ruft an keiner Stelle `eval()`, `exec()` oder `compile()` auf. Das ist kein nachträglicher Filter, sondern die Architektur selbst. Jede Eingabe durchläuft eine geschlossene Pipeline:

```
Input → Tokenizer → Parser → Evaluator → Formatter → Output
```

Das Alphabet dieser Pipeline ist endlich: Zahlen, Operatoren, Klammern und eine feste Liste erlaubter Funktionsnamen. Eine feindliche Eingabe kann im schlimmsten Fall einen typisierten Fehler auslösen, niemals Code ausführen. Das ist die Sicherheitsgarantie, die eine `eval()`-basierte Lösung prinzipiell nicht geben kann.

## Wie der Parser Vorrang versteht

Punkt vor Strich, Klammern zuerst: Operator-Vorrang ist in Math Engine nicht per Tabelle hineingehackt, sondern als Struktur kodiert. Ein Recursive-Descent-Parser staffelt zehn Vorrang-Ebenen ineinander, von der Zuweisung über bitweise Operatoren und Addition bis hin zur Potenz. Ob ein Operator links- oder rechtsassoziativ ist, ergibt sich aus dieser Struktur von selbst: `a - b - c` wird als `(a - b) - c` gelesen, `2 ** 3 ** 2` dagegen rechts gebunden, genau wie in Python.

Eine bewusste Entscheidung dabei: `^` ist bitweises XOR, nicht Potenz. Potenziert wird mit `**`, exakt wie in C und Python, damit die Engine sich so verhält, wie ein Programmierer es erwartet.

## Exakt statt fast richtig

Jede Zahl ist von der ersten bis zur letzten Stufe ein `decimal.Decimal`, niemals ein `float`. Deshalb ist `0.1 + 0.2` hier exakt `0.3`. Die Rechengenauigkeit wird pro Berechnung neu bestimmt, zwischen 100 und 10.000 Stellen je nach Eingabe, mit einer harten Obergrenze von 20.000 Stellen. So wird ein langes Ergebnis nie still abgeschnitten, und ein kurzes belegt keinen unnötigen Speicher.

## Fehler, die auf das Zeichen zeigen

Parallel zu den Token führt der Tokenizer für jedes eine Span: Start-Spalte, End-Spalte, Originaltext. Diese Position wandert durch den gesamten Syntaxbaum und hängt am Ende an jedem Fehler. Das Ergebnis ist eine Diagnostik, die nicht „Syntaxfehler irgendwo" meldet, sondern auf das schuldige Zeichen zeigt.

Dieselben Positionsdaten bedienen zwei Modi, umschaltbar über ein einziges Setting. Für die Bibliothek propagiert ein typisierter Fehler an den Aufrufer, mit Code und Position zum Abfangen. Für die Konsole fängt die Engine selbst und zeichnet einen Zeiger exakt unter die fehlerhafte Stelle:

```
12 + * 3
     ^
hier wurde ein Wert erwartet, kein Operator
```

Darunter liegt ein katalogisiertes System aus 78 vierstelligen Fehlercodes in neun Familien. Die Ziffern sind strukturiert: Code `3008` heißt „Calculator, Kern-Parser, mehr als ein Punkt in einer Zahl". Diese Codes werden bewusst nie umnummeriert, sie sind ein Vertrag gegenüber der Oberfläche und gegenüber externen Log-Parsern.

## Mehr als ein Taschenrechner

Auf demselben Syntaxbaum sitzen zwei weitere Fähigkeiten. Enthält ein Ausdruck ein `=` und eine Variable, löst die Engine die lineare Gleichung symbolisch, statt zu raten, inklusive sauber benannter Sonderfälle für „keine Lösung" und „unendlich viele Lösungen". Und für hardwarenahe Arithmetik gibt es einen Programmer's-Calculator-Modus mit fester Wortbreite von 8 bis 64 Bit, Zweierkomplement und bitweisen Operatoren, sodass `127 + 1` im 8-Bit-Modus korrekt zu `-128` überläuft.

## Geprüft, versioniert, ausgeliefert

Eine sichere Engine, der man nicht vertrauen kann, ist nutzlos. Hinter den rund 4.200 Zeilen Produktionscode steht deshalb eine Suite von 399 pytest-Tests bei 90 % Coverage. Ein eigener Helfer prüft nicht nur, dass ein Ausdruck fehlschlägt, sondern dass er mit dem exakten Fehlercode an der exakten Zeichenposition fehlschlägt. GitHub Actions fährt die volle Suite bei jedem Push gegen fünf Python-Versionen, von 3.8 bis 3.12.

Ausgeliefert wird das Ganze als reines Python-Wheel mit nur zwei Abhängigkeiten und drei Konsolen-Kommandos, inklusive interaktivem REPL mit History und Tab-Vervollständigung. Sechs Releases in rund fünf Monaten, durchgehend nach Semantic Versioning.

## Selbst ausprobieren

Math Engine ist quelloffen unter der MIT-Lizenz und in einer Zeile installiert:

```
pip install math-engine
```

Der Code liegt auf [GitHub](https://github.com/JanTeske06/math_engine), das Paket auf [PyPI](https://pypi.org/project/math-engine/). Dieselbe Engineering-Disziplin, die hier eine veröffentlichte Bibliothek trägt, steckt auch in Kundenprojekten: sichere, eval()-freie Verarbeitung von Ausdrücken für DSLs, Formel-Editoren und Rule-Engines.
