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

// 工作项类型颜色映射
const workItemColors = {
  requirement: 'rgb(0, 65, 109)',
  defect: 'rgb(245, 20, 85)', 
  task: 'rgb(0, 160, 255)',
  other: 'rgb(156, 0, 99)'
};

// 计算工作项类型占比分段
const workItemSegments = computed(() => {
  const stats = props.task.stats;
  const total = stats.total_requirements + stats.total_tasks + stats.total_defects;
  
  if (total === 0) return [];
  
  const segments = [];
  let currentX = 0;
  
  // 需求占比
  if (stats.total_requirements > 0) {
    const width = (stats.total_requirements / total) * bar.value.width;
    segments.push({
      x: currentX,
      width,
      color: workItemColors.requirement,
      type: 'requirement'
    });
    currentX += width;
  }
  
  // 任务占比
  if (stats.total_tasks > 0) {
    const width = (stats.total_tasks / total) * bar.value.width;
    segments.push({
      x: currentX,
      width,
      color: workItemColors.task,
      type: 'task'
    });
    currentX += width;
  }
  
  // 缺陷占比
  if (stats.total_defects > 0) {
    const width = (stats.total_defects / total) * bar.value.width;
    segments.push({
      x: currentX,
      width,
      color: workItemColors.defect,
      type: 'defect'
    });
  }
  
  return segments;
});

const barColor = computed(() => {
  if (props.task.type === 'version') return '#007AFF';        // 蓝色 (版本)
  if (props.task.type === 'sprint') return '#34C759';         // 绿色 (迭代)
  if (props.task.type === 'requirement') return 'rgb(0, 65, 109)';  // 需求
  if (props.task.type === 'defect') return 'rgb(245, 20, 85)';      // 缺陷
  if (props.task.type === 'task') return 'rgb(0, 160, 255)';        // 任务
  // 其他工作项子类的默认颜色
  return 'rgb(156, 0, 99)';
});

// 是否显示工作项占比分段（仅版本和迭代显示）
const showWorkItemSegments = computed(() => {
  return (props.task.type === 'version' || props.task.type === 'sprint') && workItemSegments.value.length > 0;
});


// ID for the clipping path
const clipPathId = computed(() => `task-clip-path-${props.task.id}`);

// Always hide creator in task bars for cleaner look
const showCreator = computed(() => {
  return false;
});

// 进度百分比文本
const progressPercentage = computed(() => {
  return Math.round(props.task.progress * 100);
});

// Position for progress label (右侧显示)
const progressLabelPosition = computed(() => {
  return {
    x: bar.value.x + bar.value.width + 8, // 甘特条右边 + 8px间距
    y: props.height / 2 // 垂直居中
  };
});

// 总是显示进度百分比（放在右侧，不受宽度限制）
const showProgressText = computed(() => {
  return true;
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
    
    <!-- 工作项类型占比分段 (仅版本和迭代显示) -->
    <g v-if="showWorkItemSegments">
      <rect
        v-for="(segment, index) in workItemSegments"
        :key="`segment-${index}`"
        :x="bar.x + segment.x"
        :y="4"
        :width="segment.width"
        :height="height - 8"
        :fill="segment.color"
        class="work-item-segment"
        opacity="0.85"
      />
    </g>
    
    <!-- Progress Percentage (右侧显示，不裁剪) -->
    <text 
      v-if="showProgressText"
      :x="progressLabelPosition.x" 
      :y="progressLabelPosition.y" 
      class="progress-label"
    >
      {{ progressPercentage }}%
    </text>
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
.work-item-segment {
  transition: all 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
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
.progress-label {
  fill: #1d1d1f;
  font-size: 12px;
  font-weight: 600;
  dominant-baseline: middle;
  text-anchor: start;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  opacity: 0.8;
}

</style>
