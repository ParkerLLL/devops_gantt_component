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
  isCritical: boolean;
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
  if (props.task.type === 'milestone') return '#ff9900';
  return props.task.type === 'version' ? '#5292f7' : '#87ceeb';
});

const progressColor = computed(() => {
  if (props.task.type === 'milestone') return '#ff9900';
  return props.task.type === 'version' ? '#2a6ec4' : '#5f9ea0';
});

const isMilestone = computed(() => {
  return props.task.type === 'milestone';
});

const milestonePoints = computed(() => {
  if (!isMilestone.value) return '';
  
  const x = props.xScale(new Date(props.task.start_date));
  const y = props.height / 2;
  const size = props.height - 8;
  
  return `${x},${y - size/2} ${x + size/2},${y} ${x},${y + size/2} ${x - size/2},${y}`;
});

// ID for the clipping path
const clipPathId = computed(() => `task-clip-path-${props.task.id}`);

// Dynamically show creator based on available width
const showCreator = computed(() => {
  // Milestones always show creator as text is outside the shape
  if (isMilestone.value) return true;
  // Estimate required width: 50px for title + 80px for creator + padding
  const requiredWidth = 150; 
  return bar.value.width > requiredWidth;
});

// Position for labels
const labelPosition = computed(() => {
  // Increased horizontal padding for text to make it less crowded
  const baseX = isMilestone.value ? bar.value.x + 20 : bar.value.x + 12;
  const baseY = props.height / 2;

  return {
    taskLabel: {
      x: baseX,
      // If creator is hidden, center the task label vertically. Otherwise, move it up.
      y: showCreator.value ? baseY - 7 : baseY
    },
    creatorLabel: {
      x: baseX,
      y: baseY + 9
    }
  };
});

</script>

<template>
  <g
    class="task-row-group"
    :class="{ 'is-milestone': isMilestone }"
    @click="$emit('click', task, $event)"
    @dblclick="$emit('dblclick', task)"
  >
    <!-- Define a clipping path to keep text within the bar -->
    <defs>
      <clipPath :id="clipPathId">
        <!-- For regular tasks, the clip path is the rounded rectangle of the task bar -->
        <rect
          v-if="!isMilestone"
          :x="bar.x"
          :y="4"
          :width="bar.width"
          :height="height - 8"
          rx="3"
          ry="3"
        />
        <!-- For milestones, text is outside, so we use a large un-clipping area -->
        <rect
          v-else
          :x="bar.x - 10"
          :y="0"
          :width="500"
          :height="height"
        />
      </clipPath>
    </defs>

    <!-- Task Visualization (Bar or Milestone) -->
    <template v-if="isMilestone">
      <polygon
        :points="milestonePoints"
        :fill="barColor"
        :stroke="isCritical ? '#d93026' : 'none'"
        :stroke-width="isCritical ? 2 : 0"
        class="milestone"
        :class="{ 'task-overdue': task.stats.is_overdue }"
      />
    </template>
    <template v-else>
      <rect
        :x="bar.x"
        :y="4"
        :width="bar.width"
        :height="height - 8"
        :fill="barColor"
        :stroke="isCritical ? '#d93026' : 'none'"
        :stroke-width="isCritical ? 2 : 0"
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
    </template>
    
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
  opacity: 0.7;
  stroke: #333;
  stroke-width: 0.5;
  transition: all 0.2s ease-in-out;
}
.task-bar:hover {
  opacity: 1;
}
.task-bar.task-overdue {
  fill: #de350b; /* Atlassian Red for overdue tasks */
  stroke: #bf2600;
}
.task-progress {
  opacity: 1;
  transition: width 0.3s ease;
}
.milestone {
  opacity: 0.9;
  transition: all 0.2s ease-in-out;
}
.milestone:hover {
  opacity: 1;
  transform: scale(1.1);
  transform-origin: center;
}
.milestone.task-overdue {
  fill: #de350b;
  stroke: #bf2600;
}
.task-label {
  fill: #172b4d; /* Atlassian Dark Text */
  font-size: 13px;
  font-weight: 500;
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none; /* Allow clicks to pass through to the bar */
}
.task-creator {
  fill: #42526e; /* Atlassian Subtle Text */
  font-size: 11px;
  font-weight: 400;
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none;
  opacity: 0.95;
}

/* Override text colors for milestones to ensure visual hierarchy */
.task-row-group.is-milestone .task-creator {
  fill: #42526e; /* Atlassian Subtle Text */
}

</style>
