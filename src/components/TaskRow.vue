<script setup lang="ts">
import { computed } from 'vue';
import * as d3 from 'd3';
import type { GanttTask } from '@/types';

const emit = defineEmits<{
  (e: 'click', task: GanttTask, event: MouseEvent): void;
  (e: 'dblclick', task: GanttTask): void;
}>();

const props = defineProps<{
  isSelected: boolean;
  task: GanttTask;
  xScale: d3.ScaleTime<number, number>;
  y: number;
  height: number;
}>();

// --- COMPUTED PROPERTIES ---

const bar = computed(() => {
  const x = props.xScale(new Date(props.task.start_date));
  const width = props.xScale(new Date(props.task.end_date)) - x;
  return { x, width };
});

const progressWidth = computed(() => {
  return bar.value.width * props.task.progress;
});

const barColor = computed(() => {
  if (props.task.type === 'version') return '#007AFF';
  if (props.task.type === 'requirement') return '#5856D6';
  if (props.task.type === 'defect') return '#FF3B30';
  if (props.task.type === 'sprint') return '#34C759';
  if (props.task.type === 'task') return '#FF9500';
  return '#007AFF';
});

const progressColor = computed(() => {
  if (props.task.type === 'version') return '#005FCC';
  if (props.task.type === 'requirement') return '#4B44C7';
  if (props.task.type === 'defect') return '#D70015';
  if (props.task.type === 'sprint') return '#248A3D';
  if (props.task.type === 'task') return '#CC7A00';
  return '#005FCC';
});


// ID for the clipping path
const clipPathId = computed(() => `task-clip-path-${props.task.id}`);

// Always hide creator in task bars for cleaner look
const showCreator = computed(() => {
  return false;
});

// Position for labels
const labelPosition = computed(() => {
  // Increased horizontal padding for text to make it less crowded
  const baseX = bar.value.x + 10;
  const baseY = props.height / 2;

  return {
    taskLabel: {
      x: baseX,
      // Center the task label vertically since creator is hidden
      y: baseY
    },
    creatorLabel: {
      x: baseX,
      y: baseY + 10
    }
  };
});

</script>

<template>
  <g
    class="task-row-group"
    @click="$emit('click', task, $event)"
    @dblclick="$emit('dblclick', task)"
  >
    <!-- Define a clipping path to keep text within the bar -->
    <defs>
      <clipPath :id="clipPathId">
        <!-- For regular tasks, the clip path is the rounded rectangle of the task bar -->
        <rect
          :x="bar.x"
          :y="4"
          :width="bar.width"
          :height="height - 8"
          rx="3"
          ry="3"
        />
      </clipPath>
    </defs>

    <!-- Task Visualization -->
    <rect
      :x="bar.x"
      :y="4"
      :width="bar.width"
      :height="height - 8"
      :fill="barColor"
      stroke="none"
      stroke-width="0"
      rx="3"
      ry="3"
      class="task-bar"
      :class="{ 'task-overdue': task.stats.is_overdue }"
    />
    <rect
      :x="bar.x"
      y="4"
      :width="progressWidth"
      :height="height - 8"
      :fill="progressColor"
      rx="3"
      ry="3"
      class="task-progress"
    />
    
    <!-- Text Group with Clipping Applied -->
    <g :clip-path="`url(#${clipPathId})`">
      <!-- Task Title -->
      <text 
        :x="labelPosition.taskLabel.x" 
        :y="labelPosition.taskLabel.y" 
        class="task-label"
      >
        {{ task.text }}
      </text>
      
      <!-- Creator Info (conditionally rendered) -->
      <g v-if="showCreator" class="creator-group">
        <text 
          :x="labelPosition.creatorLabel.x" 
          :y="labelPosition.creatorLabel.y" 
          class="task-creator"
        >
          {{ task.creator }}
        </text>
      </g>
    </g>
  </g>
</template>

<style scoped>
.task-bar {
  opacity: 0.9;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 0.5;
  transition: all 0.2s ease;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
}
.task-bar:hover {
  opacity: 1;
  transform: translateY(-1px);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
  stroke: rgba(255, 255, 255, 0.4);
  stroke-width: 1;
}
.task-bar.task-overdue {
  fill: #FF3B30;
  stroke: #D70015;
  animation: overdue-pulse 2s infinite;
}

@keyframes overdue-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}
.task-progress {
  opacity: 1;
  transition: width 0.3s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
}
.task-label {
  fill: #ffffff;
  font-size: 13px;
  font-weight: 600;
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}
.task-creator {
  fill: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 500;
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none;
  opacity: 0.9;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

</style>
