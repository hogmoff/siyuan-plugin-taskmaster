<template>
  <div class="task-modal-container">
    <!-- Aufgabentitel -->
    <div class="b3-form__item">
      <label class="b3-form__label">Titel</label>
      <input v-model="task.title" class="b3-text-field" placeholder="z.B. Marketing-Präsentation fertigstellen">
    </div>

    <!-- Fälligkeitsdatum und Uhrzeit -->
    <div class="b3-form__item">
      <label class="b3-form__label">Fälligkeitsdatum</label>
      <input type="datetime-local" v-model="task.dueDate" class="b3-text-field">
    </div>

    <!-- Priorität -->
    <div class="b3-form__item">
      <label class="b3-form__label">Priorität</label>
      <select v-model="task.priority" class="b3-select">
        <option value="p4">P4 (Keine)</option>
        <option value="p3">P3 (Niedrig)</option>
        <option value="p2">P2 (Mittel)</option>
        <option value="p1">P1 (Hoch)</option>
      </select>
    </div>

    <!-- Projekt (Tag) -->
    <div class="b3-form__item">
      <label class="b3-form__label">Projekt</label>
      <input v-model="task.tag" list="existing-tags" class="b3-text-field" placeholder="Existierendes auswählen oder neues erstellen">
      <datalist id="existing-tags">
        <option v-for="tag in allTags" :key="tag" :value="tag" />
      </datalist>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineExpose } from 'vue';
import { fetchSyncPost } from 'siyuan';

// Props, die vom Haupt-Plugin übergeben werden
const props = defineProps<{
  blockId: string;
  isEditing: boolean;
  initialTitle: string;
}>();

// Reaktives Objekt zur Speicherung der Formulardaten
const task = ref({
  title: props.initialTitle,
  dueDate: '',
  priority: 'p4',
  tag: '',
  isCompleted: false, // Hinzugefügt, um den Erledigungsstatus zu speichern
});

const allTags = ref<string[]>([]);

// Hilfsfunktion: Konvertiert 'YYYYMMDDHHmmss' in 'YYYY-MM-DDTHH:mm' für das Input-Feld
const formatToDateTimeLocal = (siyuanDate: string): string => {
  if (!siyuanDate || siyuanDate.length < 14) return '';
  const y = siyuanDate.substring(0, 4);
  const m = siyuanDate.substring(4, 6);
  const d = siyuanDate.substring(6, 8);
  const h = siyuanDate.substring(8, 10);
  const min = siyuanDate.substring(10, 12);
  return `${y}-${m}-${d}T${h}:${min}`;
};

// Hilfsfunktion: Konvertiert 'YYYY-MM-DDTHH:mm' in 'YYYYMMDDHHmmss' für Siyuan
const formatFromDateTimeLocal = (localDate: string): string => {
  if (!localDate) return '';
  return localDate.replace(/[-T:]/g, '') + '00';
};

// Beim Laden der Komponente: Daten abrufen
onMounted(async () => {
  // 1. Alle vorhandenen Tags im Notizbuch abrufen
  const tagsResponse = await fetchSyncPost('/api/tag/getTags');
  allTags.value = tagsResponse.data.map((t: any) => t.label);

  // 2. Wenn im Bearbeitungsmodus, die Daten des Blocks laden
  if (props.isEditing) {
    // Block-Attribute abrufen (Priorität, Datum)
    const attrsResponse = await fetchSyncPost('/api/attr/getBlockAttrs', { id: props.blockId });
    const attrs = attrsResponse.data;
    task.value.priority = attrs['custom-task-priority'] || 'p4';
    task.value.dueDate = formatToDateTimeLocal(attrs['custom-handle-time'] || '');

    // Block-Inhalt abrufen (Titel, Tag, Erledigungsstatus)
    const blockInfo = await fetchSyncPost('/api/block/getBlockInfo', { id: props.blockId });
    const markdown = blockInfo.data.markdown;

    // Erledigungsstatus extrahieren
    task.value.isCompleted = /-\s\[x\]/i.test(markdown);

    // Einfache Regex, um Titel und Tag zu extrahieren
    const tagMatch = markdown.match(/#([^#\s]+)#/);
    if (tagMatch) {
      task.value.tag = tagMatch[1];
    }
    task.value.title = markdown.replace(/- \[.\]\s*/, '').replace(/#([^#\s]+)#\s*/, '').trim();
  }
});

// Diese Funktion wird vom Dialog-Button aufgerufen, um die Daten zu speichern
const submit = async () => {
  // 1. Attribute für Siyuan vorbereiten
  const newAttrs = {
    id: props.blockId,
    attrs: {
      'custom-task-priority': task.value.priority,
      'custom-handle-time': formatFromDateTimeLocal(task.value.dueDate),
    }
  };
  await fetchSyncPost('/api/attr/setBlockAttrs', newAttrs);

  // 2. Den Markdown-Inhalt des Blocks aktualisieren
  const checkboxState = task.value.isCompleted ? 'x' : ' ';
  const newMarkdown = `- [${checkboxState}] ${task.value.title} ${task.value.tag ? `#${task.value.tag}#` : ''}`.trim();
  await fetchSyncPost('/api/block/updateBlock', {
    id: props.blockId,
    dataType: 'markdown',
    data: newMarkdown,
  });
};

// Die 'submit'-Funktion nach außen verfügbar machen, damit der Dialog darauf zugreifen kann
defineExpose({
  submit
});

</script>

<style>
.task-modal-container {
  padding: 16px;
}
.b3-form__label {
    font-weight: 500;
    margin-bottom: 8px;
    display: block;
}
.b3-form__item:not(:last-child) {
    margin-bottom: 16px;
}
</style>