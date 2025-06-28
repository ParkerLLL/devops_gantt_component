<script setup lang="ts">
import type { GanttTask } from '@/types';

defineProps<{
  visible: boolean;
  task: GanttTask | null;
  position: { top: number; left: number };
}>();
</script>

<template>
  <div
    v-if="visible && task"
    class="gantt-tooltip"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
  >
    <div class="tooltip-header">{{ task.text }}</div>
    <div class="tooltip-body">
      <p><strong>开始时间:</strong> {{ task.start_date }}</p>
      <p><strong>结束时间:</strong> {{ task.end_date }}</p>
      <div class="tooltip-item"><strong>进度:</strong> {{ Math.round(task.progress * 100) }}%</div>
      <div class="tooltip-item"><strong>当前状态:</strong> {{ task.status }}</div>
      <div class="tooltip-item"><strong>创建人:</strong> {{ task.creator }}</div>
      <div class="tooltip-item"><strong>所属项目:</strong> {{ task.project_name }}</div>
      <div class="tooltip-item"><strong>所属部门:</strong> {{ task.department_name }}</div>
    </div>
  </div>
</template>

<style scoped>
.gantt-tooltip {
  position: fixed;
  z-index: 1000;
  background-color: #fff;
  border: 1px solid #dfe1e6;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 300px;
  pointer-events: none; /* Important to prevent the tooltip from capturing mouse events */
  transition: opacity 0.2s ease-in-out;
  font-size: 13px;
}

.tooltip-header {
  font-weight: bold;
  border-bottom: 1px solid #f0f1f5;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.tooltip-body p {
  margin: 4px 0;
  color: #63656e;
}

.tooltip-body p strong {
  color: #313238;
}
</style>
