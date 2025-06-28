<script setup lang="ts">
import TaskListItem from './TaskListItem.vue';
import type { GanttTask } from '@/types';

// Props定义将根据技术方案进行完善
defineProps<{
  tasks: GanttTask[];
}>();

const emit = defineEmits<{ (e: 'toggle', id: string): void }>();

const handleToggle = (id: string) => {
  emit('toggle', id);
};
</script>

<template>
  <div class="task-list-container">
    <TaskListItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :level="0"
      @toggle="handleToggle"
    />
  </div>
</template>

<style scoped>
.task-list-container {
  width: 300px; /* 示例宽度 */
  border-right: 1px solid #dfe1e6;
  padding-top: 1px; /* 微调对齐 */
}
</style>
