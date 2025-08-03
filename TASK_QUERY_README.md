# Task Query Funktionalität

Diese Erweiterung ermöglicht es, Aufgaben-Abfragen direkt im Editor mit einer speziellen Syntax zu erstellen, ähnlich wie im Obsidian Tasks Plugin.

## Verwendung

### Grundlegende Syntax

Erstelle einen Code-Block mit der Sprache `tasks` und definiere deine Abfrage:

```tasks
status: todo, in-progress
priority: high, urgent
due: <2024-12-31
tag: work,important
sort: dueDate desc
limit: 10
```

### Verfügbare Filter

#### Status
- `status: todo` - Zeigt nur Aufgaben mit Status "todo"
- `status: done` - Zeigt nur erledigte Aufgaben
- `status: todo,in-progress` - Zeigt Aufgaben mit mehreren Status

#### Priorität
- `priority: low` - Niedrige Priorität
- `priority: medium` - Mittlere Priorität
- `priority: high` - Hohe Priorität
- `priority: urgent` - Dringende Priorität

#### Fälligkeitsdatum
- `due: 2024-12-31` - Fällig am 31.12.2024
- `due: <2024-12-31` - Fällig vor dem 31.12.2024
- `due: >2024-12-31` - Fällig nach dem 31.12.2024

#### Startdatum
- `starts: 2024-12-31` - Startet am 31.12.2024
- `starts: <2024-12-31` - Startet vor dem 31.12.2024
- `starts: >2024-12-31` - Startet nach dem 31.12.2024

#### Tags
- `tag: work` - Aufgaben mit dem Tag "work"
- `tag: work,important` - Aufgaben mit Tags "work" ODER "important"
- `-tag: archive` - Ausschließen von Aufgaben mit dem Tag "archive"

#### Pfad
- `path: projects/work*` - Aufgaben in Pfaden, die mit "projects/work" beginnen

#### Sortierung
- `sort: dueDate` - Sortiert nach Fälligkeitsdatum (aufsteigend)
- `sort: dueDate desc` - Sortiert nach Fälligkeitsdatum (absteigend)
- `sort: priority` - Sortiert nach Priorität
- `sort: startDate` - Sortiert nach Startdatum
- `sort: description` - Sortiert alphabetisch nach Beschreibung

#### Limit
- `limit: 5` - Zeigt maximal 5 Aufgaben an

### Textsuche
- `meeting` - Zeigt Aufgaben, die "meeting" in der Beschreibung enthalten
- `project report` - Zeigt Aufgaben, die "project" UND "report" enthalten

## Beispiele

### Alle offenen Aufgaben sortiert nach Fälligkeitsdatum
```tasks
status: todo,in-progress
sort: dueDate
```

### Dringende Aufgaben dieser Woche
```tasks
priority: urgent
status: todo
starts: >today
starts: <next week
```

### Aufgaben mit bestimmten Tags
```tasks
tag: work,important
-tag: archive
status: todo
sort: priority desc
limit: 20
```

### Überfällige Aufgaben
```tasks
due: <today
status: todo
sort: dueDate
```

## Interaktion

Die angezeigten Aufgaben sind interaktiv:
- **Checkbox**: Klicken zum Markieren als erledigt/nicht erledigt
- **Refresh-Button**: Aktualisiert die Abfrage mit aktuellen Daten
- **Fehlermeldungen**: Werden direkt im Query-Block angezeigt

## Technische Hinweise

- Die Abfragen werden in Echtzeit verarbeitet
- Bei Dokument-Änderungen werden die Abfragen automatisch aktualisiert
- Die Syntax orientiert sich stark an der Obsidian Tasks Plugin Syntax