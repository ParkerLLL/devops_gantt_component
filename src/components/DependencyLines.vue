<script setup lang="ts">
import { computed } from 'vue';
import * as d3 from 'd3';
import type { GanttTask } from '@/types';

import type { VirtualItem } from '@tanstack/vue-virtual';

const props = defineProps<{
  tasks: GanttTask[];
  xScale: d3.ScaleTime<number, number>;
  rowHeight: number;
  taskPositions: Map<string, number>;
  visibleItems: Array<VirtualItem & { task: GanttTask }>;
}>();

const lines = computed(() => {
  if (!props.visibleItems || props.visibleItems.length === 0) return [];

  const visibleTaskIds = new Set(props.visibleItems.map(item => item.task.id));
  const taskMap = new Map(props.tasks.map(task => [task.id, task]));
  const paths: { d: string; id: string }[] = [];

  props.tasks.forEach(task => {
    if (!task.dependencies || !props.taskPositions.has(task.id)) return;

    task.dependencies.forEach(depId => {
      // Optimization: Only render lines where either the source or target is visible
      if (!visibleTaskIds.has(task.id) && !visibleTaskIds.has(depId)) {
        return;
      }

      const sourceTask = taskMap.get(depId);
      const targetTask = task;

      const sourceYPos = props.taskPositions.get(depId);
      const targetYPos = props.taskPositions.get(targetTask.id);

      if (!sourceTask || sourceYPos === undefined || targetYPos === undefined) return;

      const sourceX = props.xScale(new Date(sourceTask.end_date));
      const sourceY = sourceYPos + props.rowHeight / 2;

      const targetX = props.xScale(new Date(targetTask.start_date));
      const targetY = targetYPos + props.rowHeight / 2;

      const controlXOffset = 20;

      const d = `M ${sourceX} ${sourceY} ` +
                `C ${sourceX + controlXOffset} ${sourceY}, ` +
                `${targetX - controlXOffset} ${targetY}, ` +
                `${targetX} ${targetY}`;

      paths.push({ d, id: `${depId}-${task.id}` });
    });
  });

  return paths;
});

</script>

<template>
  <g class="dependency-lines">
    <defs>
      <marker
        id="arrowhead"
        viewBox="-0 -5 10 10"
        refX="8"
        refY="0"
        orient="auto"
        markerWidth="6"
        markerHeight="6"
        xoverflow="visible"
      >
        <path d="M 0,-5 L 10,0 L 0,5" fill="#63656e" stroke="none"></path>
      </marker>
    </defs>
    <path
      v-for="line in lines"
      :key="line.id"
      :d="line.d"
      fill="none"
      stroke="#63656e"
      stroke-width="1.5"
      marker-end="url(#arrowhead)"
    />
  </g>
</template>

<style scoped>
.dependency-lines path {
  opacity: 0.8;
  transition: stroke-width 0.2s ease;
}

.dependency-lines path:hover {
  stroke-width: 2.5;
}
</style>
