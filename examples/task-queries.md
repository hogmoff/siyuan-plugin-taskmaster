# Task Query Beispiele

Diese Datei zeigt verschiedene Beispiele für die Verwendung von Task-Queries im Siyuan TaskMaster Plugin.

## Beispiel 1: Alle offenen Aufgaben

```tasks
status: todo,in-progress
sort: dueDate
```

## Beispiel 2: Dringende Aufgaben dieser Woche

```tasks
priority: urgent,high
status: todo
starts: >today
starts: <next week
```

## Beispiel 3: Aufgaben mit bestimmten Tags

```tasks
tag: work,important
-tag: archive
status: todo
sort: priority desc
limit: 10
```

## Beispiel 4: Überfällige Aufgaben

```tasks
due: <today
status: todo
sort: dueDate
```

## Beispiel 5: Aufgaben nach Priorität gruppiert

```tasks
status: todo
priority: urgent
sort: dueDate desc
limit: 5
```

## Beispiel 6: Aufgaben in bestimmten Projekten

```tasks
path: projects/work*
status: todo,in-progress
sort: priority desc
```

## Beispiel 7: Komplexe Abfrage

```tasks
status: todo,in-progress
priority: high,urgent
due: >today
due: <next month
tag: work
-tag: waiting
sort: dueDate
limit: 15
```

## Beispiel 8: Erledigte Aufgaben dieser Woche

```tasks
status: done
starts: >last week
sort: dueDate desc
```

## Beispiel 9: Textsuche

```tasks
meeting review
status: todo
sort: priority desc
```

## Beispiel 10: Aufgaben ohne Fälligkeitsdatum

```tasks
status: todo
-due: *
sort: priority desc
```

## Beispiel 11: Nur Aufgabenliste ohne UI-Elemente

```tasks
status: todo
sort: dueDate
ui.elements: tasks
```
