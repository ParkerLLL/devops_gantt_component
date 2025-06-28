<script setup lang="ts">
import type { GanttTask } from '@/types';

// eslint-disable-next-line no-unused-vars
const props = defineProps<{
  task: GanttTask;
  level: number;
}>();

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
}>();

const handleToggle = () => {
  if (props.task.children && props.task.children.length > 0) {
    emit('toggle', props.task.id);
  }
};
</script>

<template>
  <div class="task-list-item" :style="{ 'padding-left': level * 20 + 'px' }">
    <span class="toggle-icon" @click="handleToggle">
      <template v-if="task.children && task.children.length > 0">
        {{ task.isExpanded ? '▼' : '▶' }}
      </template>
    </span>
    <span class="task-text">{{ task.text }}</span>
  </div>
</template>

<style scoped>
.task-list-item {
  display: flex;
  align-items: center;
  height: 32px; /* 与TaskRow高度一致 */
  padding: 0 8px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toggle-icon {
  width: 20px;
  cursor: pointer;
  user-select: none;
  color: #63656e;
}

.task-text {
  font-size: 13px;
}
</style>
