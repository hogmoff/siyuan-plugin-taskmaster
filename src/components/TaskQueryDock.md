# Task Query Dock

Das Task Query Dock ist eine Benutzeroberfläche für das TaskMaster Plugin, die es ermöglicht, Task-Query-Codeblöcke zu bearbeiten und zu verwalten.

## Funktionen

### 1. Query Editor
- **Query String Eingabe**: Großes Textfeld zum Bearbeiten von Task-Queries
- **Syntax-Highlighting**: Monospace-Schrift für bessere Lesbarkeit
- **Beispiele**: Integrierte Beispiele für häufige Query-Patterns

### 2. Aktionen
- **Update Queries**: Aktualisiert alle vorhandenen Task-Query-Blöcke im Dokument mit dem neuen Query-String
- **Refresh All**: Lädt alle Tasks neu und verarbeitet alle Queries erneut
- **Create Query Block**: Erstellt einen neuen Task-Query-Codeblock im Dokument

### 3. Status-Anzeige
- **Echtzeit-Status**: Zeigt den aktuellen Status von Operationen an
- **Zeitstempel**: Jede Statusmeldung wird mit einem Zeitstempel versehen
- **Farbkodierung**: Verschiedene Farben für Info, Erfolg, Warnung und Fehler

### 4. Query-Übersicht
- **Existing Queries**: Liste aller vorhandenen Task-Query-Blöcke im Dokument
- **Automatische Aktualisierung**: Die Liste wird nach jeder Operation aktualisiert
- **Klickbare Einträge**: Queries können durch Klicken ausgewählt werden

## Verwendung

### Query-Syntax
```
tasks
filter: status = "open"
sort: priority desc, due asc
limit: 10
```

### Häufige Filter
- `status = "open"` - Nur offene Tasks
- `priority = "high"` - Nur hohe Priorität
- `due < "2024-01-01"` - Tasks mit Fälligkeitsdatum vor einem bestimmten Datum
- `tag = "work"` - Tasks mit einem bestimmten Tag

### Sortierung
- `sort: priority desc` - Nach Priorität absteigend
- `sort: due asc` - Nach Fälligkeitsdatum aufsteigend
- `sort: created desc` - Nach Erstellungsdatum absteigend

### Limitierung
- `limit: 5` - Zeigt nur die ersten 5 Ergebnisse
- `limit: 20` - Zeigt nur die ersten 20 Ergebnisse

## Tastenkürzel

- **Ctrl+Shift+T**: Öffnet das Task Query Panel (falls konfiguriert)

## Technische Details

### Integration
Das Dock wird automatisch beim Laden des Plugins erstellt und in der rechten unteren Ecke positioniert.

### Abhängigkeiten
- TaskQueryRenderer: Für die Verarbeitung der Queries
- TaskService: Für das Laden und Verwalten der Tasks

### Events
Das Dock reagiert auf WebSocket-Events und aktualisiert sich automatisch bei Änderungen im Dokument.

## Fehlerbehebung

### Häufige Probleme
1. **"TaskQueryRenderer not available"**: Das Plugin wurde möglicherweise nicht vollständig geladen
2. **"Query string cannot be empty"**: Geben Sie eine gültige Query ein
3. **Keine Ergebnisse**: Überprüfen Sie die Filter-Syntax

### Debug-Informationen
Alle Operationen werden in der Browser-Konsole protokolliert. Öffnen Sie die Entwicklertools (F12) für detaillierte Informationen.