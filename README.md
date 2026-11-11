# Glück auf, Zukunft? – Das Ruhrgebiet zwischen Krise und Wandel

Interaktive Webseite für den Geographie-Unterricht. Sie führt als **Grubenfahrt** durch Krise und Strukturwandel des Ruhrgebiets: Man fährt in die Montanzeit ein, erreicht in der Krise die tiefste Sohle und fährt über Reindustrialisierung, Tertiärisierung, Bildung & Forschung und die IBA Emscher Park zurück ans Tageslicht. Am unteren Rand wächst dabei ein **Tausendfüßler** – vom „Zweibeiner“ (Kohle & Stahl) zu vielen wirtschaftlichen Standbeinen.

Leitfrage: *Inwiefern kann das Ruhrgebiet als zukunftsfähiger Wirtschaftsraum bezeichnet werden?*

## Bedienung

| Was | Wie |
|---|---|
| Kapitel wechseln | scrollen, **Fahrplan** (oben rechts) oder die Punkte im Schacht links |
| Präsentationsmodus (Beamer) | Knopf **Präsentieren** oder Taste **P** |
| Im Präsentationsmodus weiter / zurück | **→** / **←**, **Leertaste**, **Bild ↓ / Bild ↑** (Presenter-Klicker) |
| Präsentation beenden | **Esc** |
| Fachbegriff erklären | unterstrichenes Wort antippen |
| Tausendfüßler | antippen = alle Standbeine anzeigen, Knopf links = einklappen |

## Auf GitHub Pages veröffentlichen

1. Auf [github.com](https://github.com) ein neues, **öffentliches** Repository anlegen (z. B. `ruhrgebiet`).
2. Alle Dateien aus diesem Ordner hochladen (*Add file → Upload files*), also `index.html`, `.nojekyll`, `README.md` sowie die Ordner `css` und `js`.
3. Im Repository: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“**, Branch **main** und Ordner **/ (root)** wählen, speichern.
4. Nach ein bis zwei Minuten ist die Seite unter `https://<benutzername>.github.io/<repository>/` erreichbar.

Die Seite braucht keinen Build-Schritt und lädt **keine externen Inhalte** (keine Schriften oder Skripte von fremden Servern). Sie funktioniert deshalb auch offline – einfach `index.html` im Browser öffnen.

## Wo steht was?

```
index.html              alle Texte und Grafiken, Abschnitt für Abschnitt (Kommentare markieren die Kapitel)
css/style.css           Gestaltung, Farbwandel, Präsentationsmodus
js/main.js              Schacht-Tiefenmesser, Fahrplan, Präsentationsmodus, Begriffserklärungen
js/tausendfuessler.js   der Tausendfüßler und welche Beine (Branchen) wann wachsen
js/interaktionen.js     Wackeltest, Wirkungsgefüge, Grubenlampe, Bergsenkung, Zeitstrahl, Karten, Schieber, Waage
```

## Leitfrage-Abschnitt

Der Abschnitt `id="leitfrage"` in `index.html` besteht aus drei Teilen:

1. **Standort-Check** – Argument-Waage mit unseren Stärken und Schwächen. `data-side="pro"` bzw. `"contra"` an jedem `<li class="arg">` legt fest, wohin der Knopf „Unsere Einordnung zeigen“ das Argument legt.
2. **Chance: KI-Infrastruktur** – Puzzle aus Flüssen, Start-ups, Bildungslandschaft und Brachflächen. Ist es vollständig, bekommt der Tausendfüßler ein gestricheltes „Zukunftsbein“.
3. **Unser Urteil** – Ampel („bedingt zukunftsfähig“), Feld für das eigene Urteil und unser Fazit als Fließtext.

## Noch zu ergänzen

- **Begriffe ohne Erklärung** (in der Fußzeile, `<dl id="glossar">`): Shrinking Cities, Emscherzone, Altlasten, Physiognomie, Revitalisierung. Zum Ergänzen den Text im `<dd>` ersetzen und `class="is-luecke"` entfernen.
- **Fußzeile**: Namen, Kurs, Schuljahr und Quellen eintragen.

Alle Inhalte stammen aus der Ausarbeitung des Kurses. Die Grafiken sind selbst gezeichnet und schematisch (nicht maßstabsgetreu).
