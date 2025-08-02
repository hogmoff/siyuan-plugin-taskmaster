<template>
  <div class="task-modal-container">
    <!-- Aufgabentitel -->
    <div class="b3-form__item">
      <label class="b3-form__label">Titel</label>
      <input v-model="task.title" class="b3-text-field fn__block" placeholder="z.B. Marketing-Präsentation fertigstellen">
    </div>

    <!-- Fälligkeitsdatum und Uhrzeit getrennt -->
    <div class="b3-form__item">
      <label class="b3-form__label">Fälligkeitsdatum</label>
      <div class="fn__flex">
        <input 
          type="date" 
          v-model="task.dueDate" 
          class="b3-text-field fn__flex-1" 
          :class="{ 'fn__mr8': task.hasTime }"
          placeholder="Datum auswählen">
        <input 
          v-if="task.hasTime"
          type="time" 
          v-model="task.dueTime" 
          class="b3-text-field" 
          style="width: 120px;"
          placeholder="Uhrzeit">
      </div>
      <label class="b3-form__icon">
        <input type="checkbox" v-model="task.hasTime" class="b3-switch fn__mr4">
        <span>Mit Uhrzeit</span>
      </label>
    </div>

    <!-- Priorität -->
    <div class="b3-form__item">
      <label class="b3-form__label">Priorität</label>
      <select v-model="task.priority" class="b3-select fn__block">
        <option value="p4">P4 (Keine)</option>
        <option value="p3">P3 (Niedrig)</option>
        <option value="p2">P2 (Mittel)</option>
        <option value="p1">P1 (Hoch)</option>
      </select>
    </div>

    <!-- Projekt (Tag) -->
    <div class="b3-form__item">
      <label class="b3-form__label">Projekt</label>
      <input v-model="task.tag" list="existing-tags" class="b3-text-field fn__block" placeholder="Existierendes auswählen oder neues erstellen">
      <datalist id="existing-tags">
        <option v-for="tag in allTags" :key="tag" :value="tag" />
      </datalist>
    </div>

    <!-- Buttons -->
    <div class="b3-form__item task-modal-buttons">
      <button @click="cancel" class="b3-button b3-button--cancel">Abbrechen</button>
      <button @click="submit" class="b3-button b3-button--primary">Übernehmen</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineExpose } from 'vue';
import { fetchSyncPost } from 'siyuan';
import { getAllTags, getBlockAttrs, getChildBlocks } from '../api';

// Props, die vom Haupt-Plugin übergeben werden
const props = defineProps<{
  blockId: string;
  isEditing: boolean;
  initialTitle: string;
}>();

// NEU: Eine separate ref, um die ID des eigentlichen Aufgaben-Blocks (des Kind-Blocks) zu speichern
const taskBlockId = ref<string>('');

// Reaktives Objekt zur Speicherung der Formulardaten
const task = ref({
  title: props.initialTitle,
  dueDate: '',
  dueTime: '',
  hasTime: false,
  priority: 'p4',
  tag: '',
  isCompleted: false,
});

const allTags = ref<string[]>([]);

// Hilfsfunktion: Konvertiert 'YYYYMMDDHHmmss' in Datum und Zeit getrennt
const formatToDateTime = (siyuanDate: string): { date: string; time: string; hasTime: boolean } => {
  if (!siyuanDate || siyuanDate.length < 8) return { date: '', time: '', hasTime: false };
  
  const y = siyuanDate.substring(0, 4);
  const m = siyuanDate.substring(4, 6);
  const d = siyuanDate.substring(6, 8);
  
  const date = `${y}-${m}-${d}`;
  
  if (siyuanDate.length >= 14) {
    const h = siyuanDate.substring(8, 10);
    const min = siyuanDate.substring(10, 12);
    return { date, time: `${h}:${min}`, hasTime: true };
  }
  
  return { date, time: '', hasTime: false };
};

// Hilfsfunktion: Konvertiert Datum und Zeit in 'YYYYMMDDHHmmss' für Siyuan
const formatFromDateTime = (date: string, time: string, hasTime: boolean): string => {
  if (!date) return '';
  
  const formattedDate = date.replace(/-/g, '');
  
  if (hasTime && time) {
    const formattedTime = time.replace(/:/g, '');
    return `${formattedDate}${formattedTime}00`;
  }
  
  return `${formattedDate}000000`;
};

// Beim Laden der Komponente: Daten abrufen
onMounted(async () => {
  // 1. Alle vorhandenen Tags im Notizbuch abrufen
  try {
    const tagsResponse = await getAllTags();
    allTags.value = tagsResponse;
  } catch (error) {
    console.error('Fehler beim Abrufen der Tags:', error);
  }

  // 2. Wenn im Bearbeitungsmodus, die Daten des Kind-Blocks laden
  if (props.isEditing) {
    try {
      const childBlockResponse = await getChildBlocks(props.blockId);
      if (!childBlockResponse || childBlockResponse.length === 0) {
        console.error('Kein Kind-Block zum Bearbeiten für den Block gefunden:', props.blockId);
        return;
      }

      taskBlockId.value = childBlockResponse[0].id;
      
      // KORREKTUR: Block-Attribute des Kind-Blocks asynchron abrufen
      const attrsResponse = await getBlockAttrs(taskBlockId.value);
      const attrs = attrsResponse.data || {};
      
      task.value.priority = attrs['custom-task-priority'] || 'p4';
      
      const dateTime = formatToDateTime(attrs['custom-handle-time'] || '');
      task.value.dueDate = dateTime.date;
      task.value.dueTime = dateTime.time;
      task.value.hasTime = dateTime.hasTime;
      
      const markdown = childBlockResponse[0].markdown;

      // Erledigungsstatus extrahieren
      task.value.isCompleted = /-\s\[x\]/i.test(markdown);

      // Titel und Tag extrahieren
      const tagMatch = markdown.match(/#([^#\s]+)#/);
      if (tagMatch) {
        task.value.tag = tagMatch[1];
      }
      task.value.title = markdown.replace(/-\s\[.\]\s*/, '').replace(/#([^#\s]+)#\s*/, '').trim();
    
    } catch (error) {
      console.error('Fehler beim Laden der Aufgabendaten:', error);
    }
  } else {
    // Logik für das Erstellen einer neuen Aufgabe (optional, falls benötigt)
    // Fürs Erste wird angenommen, dass props.blockId der Elternblock ist, unter dem eine neue Aufgabe erstellt wird.
    taskBlockId.value = props.blockId; // Dies müsste in der submit-Funktion speziell behandelt werden (z.B. mit insertBlock statt updateBlock)
  }
});

// Diese Funktion wird vom Dialog-Button aufgerufen, um die Daten zu speichern
const submit = async () => {
  try {
    if (!taskBlockId.value) {
      console.error('Fehler: Keine Block-ID zum Speichern vorhanden.');
      return;
    }

    // 1. Attribute für den Kind-Block vorbereiten und setzen
    const newAttrs = {
      id: taskBlockId.value, // Die korrekte ID des Kind-Blocks verwenden
      attrs: {
        'custom-task-priority': task.value.priority,
        'custom-handle-time': formatFromDateTime(task.value.dueDate, task.value.dueTime, task.value.hasTime),
      }
    };
    await fetchSyncPost('/api/attr/setBlockAttrs', newAttrs);

    // 2. Den Markdown-Inhalt des Kind-Blocks aktualisieren
    const checkboxState = task.value.isCompleted ? 'x' : ' ';
    const newMarkdown = `${task.value.title} ${task.value.tag ? `#${task.value.tag}#` : ''}`.trim();
    await fetchSyncPost('/api/block/updateBlock', {
      id: taskBlockId.value, // Die korrekte ID des Kind-Blocks verwenden
      dataType: 'markdown',
      data: newMarkdown,
    });

    // 3. Modal nach erfolgreichem Speichern schließen
    window.dispatchEvent(new CustomEvent('close-task-modal'));
  } catch (error) {
    console.error('Fehler beim Speichern der Aufgabe:', error);
  }
};

// Funktion zum Abbrechen - alle Änderungen verwerfen
const cancel = () => {
  // Modal schließen ohne zu speichern
  window.dispatchEvent(new CustomEvent('close-task-modal'));
};

// Die 'submit' und 'cancel' Funktionen nach außen verfügbar machen
defineExpose({
  submit,
  cancel
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
  color: var(--b3-theme-on-surface);
}

.b3-form__item:not(:last-child) {
  margin-bottom: 20px;
}

.b3-form__icon {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 14px;
  color: var(--b3-theme-on-surface-variant);
  cursor: pointer;
}

.b3-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.b3-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.b3-switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--b3-theme-surface-variant);
  transition: .4s;
  border-radius: 20px;
}

input:checked + .b3-switch-slider:before {
  transform: translateX(16px);
}

.task-modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--b3-theme-surface-variant);
}

.b3-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.b3-button--cancel {
  background-color: var(--b3-theme-surface);
  color: var(--b3-theme-on-surface);
  border-color: var(--b3-theme-surface-variant);
}

.b3-button--cancel:hover {
  background-color: var(--b3-theme-surface-variant);
}

.b3-button--primary {
  background-color: var(--b3-theme-primary);
  color: var(--b3-theme-on-primary);
  border-color: var(--b3-theme-primary);
}

.b3-button--primary:hover {
  background-color: var(--b3-theme-primary-hover);
  border-color: var(--b3-theme-primary-hover);
}

.b3-switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .b3-switch-slider {
  background-color: var(--b3-theme-primary);
}

input:checked + .b3-switch-slider:before {
  transform: translateX(16px);
}
</style>