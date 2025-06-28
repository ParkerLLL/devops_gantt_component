<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, watchEffect, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { useVirtualizer } from '@tanstack/vue-virtual';
import Timeline from './Timeline.vue';
import TaskRow from './TaskRow.vue';
import DependencyLines from './DependencyLines.vue';
import Tooltip from './Tooltip.vue';
import type { GanttTask } from '@/types';
import { fetchGanttData } from '@/services/mockData';
import TaskDetailsModal from './TaskDetailsModal.vue';
import CriticalPathWorker from '@/workers/criticalPath.worker?worker';

const ganttWidth = 1200;
const ganttBodyHeight = 600; 
const rowHeight = 32;
const viewMode = ref<'day' | 'week' | 'month'>('day');
const isLoading = ref(true);
const selectedTaskId = ref<string | null>(null);
const isModalVisible = ref(false);
const taskForModal = ref<GanttTask | null>(null);

const criticalPathIds = ref(new Set<string>());

const tasks = ref<GanttTask[]>([]);

// 筛选相关状态
const filters = ref({
  project: '',
  creator: '',
  type: ''
});

// 添加回到今天的方法
const scrollToToday = () => {
  if (rightPaneRef.value) {
    const today = new Date();
    const todayX = xScale.value(today);
    
    // 计算需要滚动的位置，使今天居中
    const containerWidth = rightPaneRef.value.clientWidth || 0;
    const scrollLeft = Math.max(0, todayX - containerWidth / 2);
    
    rightPaneRef.value.scrollLeft = scrollLeft;
  }
};

onMounted(async () => {
  isLoading.value = true;
  try {
    tasks.value = await fetchGanttData();
  } catch (error) {
    console.error('Failed to fetch Gantt data:', error);
    // Optionally, set an error state to show a message to the user
  } finally {
    isLoading.value = false;
  }
});

// 获取所有可选的筛选选项
const filterOptions = computed(() => {
  if (allTasksForScale.value.length === 0) {
    return {
      projects: [],
      creators: [],
      types: []
    };
  }

  const projects = new Set<string>();
  const creators = new Set<string>();
  const types = new Set<string>();

  allTasksForScale.value.forEach(task => {
    if (task.project_name) projects.add(task.project_name);
    if (task.creator) creators.add(task.creator);
    if (task.type) types.add(task.type);
  });

  return {
    projects: Array.from(projects),
    creators: Array.from(creators),
    types: Array.from(types)
  };
});

// 根据筛选条件过滤任务
const filteredTasks = computed(() => {
  let filtered = [...tasks.value];

  if (filters.value.project) {
    filtered = filtered.filter(task => task.project_name === filters.value.project);
  }

  if (filters.value.creator) {
    filtered = filtered.filter(task => {
      // 检查任务本身或其子任务是否匹配创建者
      if (task.creator === filters.value.creator) return true;
      if (task.children) {
        return task.children.some(child => child.creator === filters.value.creator);
      }
      return false;
    });
  }

  if (filters.value.type) {
    filtered = filtered.filter(task => {
      // 检查任务本身或其子任务是否匹配类型
      if (task.type === filters.value.type) return true;
      if (task.children) {
        return task.children.some(child => child.type === filters.value.type);
      }
      return false;
    });
  }

  return filtered;
});

// 将树状任务列表拍平，用于渲染
const flattenTasks = (tasks: GanttTask[], depth = 0): (GanttTask & { depth: number })[] => {
  let result: (GanttTask & { depth: number })[] = [];
  for (const task of tasks) {
    result.push({ ...task, depth });
    if (task.isExpanded && task.children) {
      result = result.concat(flattenTasks(task.children, depth + 1));
    }
  }
  return result;
};

// 使用过滤后的任务
const visibleTasks = computed(() => flattenTasks(filteredTasks.value));

const allTasksForScale = computed(() => {
    const all: GanttTask[] = [];
    const traverse = (task: GanttTask) => {
        all.push(task);
        if (task.children) {
            task.children.forEach(traverse);
        }
    };
    tasks.value.forEach(traverse);
    return all;
});

// --- Critical Path Calculation ---
const worker = new CriticalPathWorker();

worker.onmessage = (event: MessageEvent<string[]>) => {
  criticalPathIds.value = new Set(event.data);
};

watch(allTasksForScale, (all) => {
  if (all && all.length > 0) {
    // Use a deep copy to avoid passing proxies to the worker
    worker.postMessage(JSON.parse(JSON.stringify(all)));
  }
}, { immediate: true });

onUnmounted(() => {
  worker.terminate();
});

const handleToggleTask = (taskId: string) => {
  const findAndToggle = (tasksToSearch: GanttTask[]): boolean => {
    for (const task of tasksToSearch) {
      if (task.id === taskId) {
        task.isExpanded = !task.isExpanded;
        return true; // Found and toggled
      }
      if (task.children) {
        if (findAndToggle(task.children)) {
          return true; // Found in children
        }
      }
    }
    return false; // Not found in this branch
  };

  findAndToggle(tasks.value);
};

const xScale = computed(() => {
  if (allTasksForScale.value.length === 0) {
    return d3.scaleTime().domain([new Date(), new Date()]).range([0, ganttWidth]);
  }
  const startDates = allTasksForScale.value.map(t => new Date(t.start_date));
  const endDates = allTasksForScale.value.map(t => new Date(t.end_date));
  const minDate = d3.min(startDates) as Date;
  const maxDate = d3.max(endDates) as Date;

  let domainStartDate: Date, domainEndDate: Date;

  switch (viewMode.value) {
    case 'week':
      domainStartDate = d3.timeMonth.offset(minDate, -2);
      domainEndDate = d3.timeMonth.offset(maxDate, 2);
      break;
    case 'month':
      domainStartDate = d3.timeYear.floor(minDate);
      domainEndDate = d3.timeYear.ceil(maxDate);
      break;
    default: // 'day'
      domainStartDate = d3.timeDay.offset(minDate, -3);
      domainEndDate = d3.timeDay.offset(maxDate, 3);
      break;
  }

  return d3.scaleTime()
    .domain([domainStartDate, domainEndDate])
    .range([0, ganttWidth]);
});

// --- Virtualization Setup ---
const rightPaneRef = ref<HTMLElement | null>(null);

// Standard pattern: Initialize virtualizer at the top level.
// It's reactive and will update automatically when the scroll element ref is populated.
const rowVirtualizerOptions = computed(() => ({
  count: visibleTasks.value.length,
  getScrollElement: () => rightPaneRef.value,
  estimateSize: () => rowHeight,
  overscan: 5,
}));

const rowVirtualizer = useVirtualizer(rowVirtualizerOptions);

// useVirtualizer returns a ComputedRef, so we access its .value to get the instance
const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

const visibleVirtualRows = computed(() => {
  return virtualItems.value
    .map(virtualRow => {
      const task = visibleTasks.value[virtualRow.index];
      return {
        ...virtualRow,
        task,
      };
    })
    .filter(row => row.task); // Filter out rows where task is undefined
});

const taskPositions = computed(() => {
  const positions = new Map<string, number>();
  visibleVirtualRows.value.forEach(row => {
    positions.set(row.task.id, row.start);
  });
  return positions;
});



// --- Scroll Synchronization ---
// --- Tooltip State ---
const tooltipState = ref({
  visible: false,
  task: null as GanttTask | null,
  position: { top: 0, left: 0 },
});

const handleDoubleClick = (task: GanttTask) => {
  taskForModal.value = task;
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
  taskForModal.value = null;
};

const handleTaskClick = (task: GanttTask, event: MouseEvent) => {
  selectedTaskId.value = task.id;

  if (tooltipState.value.visible && tooltipState.value.task?.id === task.id) {
    tooltipState.value.visible = false;
    return;
  }

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tooltipState.value = {
    visible: true,
    task,
    position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
  };
};

const handleGanttContainerClick = () => {
  tooltipState.value.visible = false;
  selectedTaskId.value = null; // Deselect when clicking outside
};


// --- Scroll Synchronization ---
const leftPaneRef = ref<HTMLElement | null>(null);

watch([leftPaneRef, rightPaneRef], ([leftEl, rightEl]) => {
  if (!leftEl || !rightEl) return;

  const syncScroll = (from: HTMLElement, to: HTMLElement) => {
    let ticking = false;
    from.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          to.scrollTop = from.scrollTop;
          ticking = false;
        });
        ticking = true;
      }
    });
  };

  syncScroll(leftEl, rightEl);
  syncScroll(rightEl, leftEl);
}, { flush: 'post' });

// 计算工作项统计数据
const workItemStats = computed(() => {
  if (allTasksForScale.value.length === 0) {
    return {
      requirements: { total: 0, closed: 0 },
      tasks: { total: 0, closed: 0 },
      defects: { total: 0, closed: 0 }
    };
  }

  return allTasksForScale.value.reduce((stats, task) => {
    stats.requirements.total += task.stats.total_requirements || 0;
    stats.requirements.closed += task.stats.closed_requirements || 0;
    stats.tasks.total += task.stats.total_tasks || 0;
    stats.tasks.closed += task.stats.closed_tasks || 0;
    stats.defects.total += task.stats.total_defects || 0;
    stats.defects.closed += task.stats.closed_defects || 0;
    return stats;
  }, {
    requirements: { total: 0, closed: 0 },
    tasks: { total: 0, closed: 0 },
    defects: { total: 0, closed: 0 }
  });
});

</script>

<template>
  <div class="gantt-container-wrapper">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">正在加载数据...</div>
    </div>
    <template v-else>
      <div class="gantt-container" @click="handleGanttContainerClick">
        <div class="toolbar">
          <div class="view-controls">
            <button @click="viewMode = 'day'" :class="{ active: viewMode === 'day' }">日</button>
            <button @click="viewMode = 'week'" :class="{ active: viewMode === 'week' }">周</button>
            <button @click="viewMode = 'month'" :class="{ active: viewMode === 'month' }">月</button>
            <button @click="scrollToToday" class="today-btn">回到今天</button>
          </div>
          <div class="stats-container">
            <div class="stat-item">
              <span class="stat-label">需求</span>
              <span class="stat-value">{{ workItemStats.requirements.closed }}/{{ workItemStats.requirements.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">任务</span>
              <span class="stat-value">{{ workItemStats.tasks.closed }}/{{ workItemStats.tasks.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">缺陷</span>
              <span class="stat-value">{{ workItemStats.defects.closed }}/{{ workItemStats.defects.total }}</span>
            </div>
          </div>
        </div>
        
        <div class="filter-container">
          <div class="filter-item">
            <label>项目:</label>
            <select v-model="filters.project">
              <option value="">全部</option>
              <option v-for="project in filterOptions.projects" :key="project" :value="project">{{ project }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>负责人:</label>
            <select v-model="filters.creator">
              <option value="">全部</option>
              <option v-for="creator in filterOptions.creators" :key="creator" :value="creator">{{ creator }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>类型:</label>
            <select v-model="filters.type">
              <option value="">全部</option>
              <option v-for="type in filterOptions.types" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
        </div>
        
        <div class="gantt-grid">
          <div class="gantt-task-list-header">任务名称</div>
          <div class="gantt-timeline-header">
            <Timeline :x-scale="xScale" :view-mode="viewMode" :width="ganttWidth" />
          </div>
          <!-- Left side: Task List -->
          <div class="gantt-task-list-body" ref="leftPaneRef">
            <div :style="{ height: `${totalSize}px`, position: 'relative' }">
              <template v-for="row in visibleVirtualRows" :key="row.task.id">
                <div
                  :class="['task-list-item', { 'task-selected': row.task.id === selectedTaskId, 'task-critical': criticalPathIds.has(row.task.id) }]"
                  :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${row.size}px`, transform: `translateY(${row.start}px)` }"
                  @click.stop="handleTaskClick(row.task, $event)"
                  @dblclick="handleDoubleClick(row.task)"
                >
                  <span :style="{ paddingLeft: `${row.task.depth * 20}px` }">
                    <button v-if="row.task.children && row.task.children.length > 0" @click.stop="handleToggleTask(row.task.id)" class="toggle-btn">
                      {{ row.task.isExpanded ? '▼' : '▶' }}
                    </button>
                    {{ row.task.text }}
                  </span>
                </div>
              </template>
            </div>
          </div>

          <!-- Right side: Chart -->
          <div class="gantt-rows-container" ref="rightPaneRef">
            <div :style="{ height: `${totalSize}px`, position: 'relative' }">
                <svg class="gantt-rows" :width="ganttWidth" :height="totalSize">
                    <template v-for="row in visibleVirtualRows" :key="row.task.id">
                        <g
                            class="gantt-row"
                            :style="{ transform: `translateY(${row.start}px)` }"
                        >
                            <TaskRow 
                                :task="row.task" 
                                :x-scale="xScale" 
                                :y="0" 
                                :height="rowHeight" 
                                :is-selected="row.task.id === selectedTaskId" 
                                :is-critical="criticalPathIds.has(row.task.id)" 
                                @click.stop="handleTaskClick" 
                                @dblclick="handleDoubleClick" 
                            />
                        </g>
                    </template>
                    <DependencyLines :tasks="visibleTasks" :x-scale="xScale" :row-height="rowHeight" :task-positions="taskPositions" :visible-items="visibleVirtualRows" />
                </svg>
            </div>
          </div>
        </div>
      </div>
      <Tooltip :visible="tooltipState.visible" :task="tooltipState.task" :position="tooltipState.position" />
      <TaskDetailsModal :visible="isModalVisible" :task="taskForModal" @close="closeModal()" />
    </template>
  </div>
</template>

<style scoped>
.gantt-container-wrapper {
  position: relative;
  width: 100%;
  height: 90vh;
}
.gantt-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: 1px solid #dfe1e6;
}
.toolbar {
  padding: 8px;
  border-bottom: 1px solid #dfe1e6;
  background-color: #fafbfc;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.view-controls {
  display: flex;
}
.toolbar button {
  margin-right: 8px;
  padding: 4px 12px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  border-radius: 3px;
}
.toolbar button.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}
.today-btn {
  margin-left: 8px;
  background-color: #f5f7fa !important;
}
.stats-container {
  display: flex;
  gap: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-label {
  font-weight: 500;
}
.stat-value {
  background-color: #f0f5ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.gantt-grid {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  height: calc(100% - 50px); /* Adjust based on toolbar height */
}


.gantt-task-list-header,
.gantt-timeline-header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdee5;
  border-right: 1px solid #dcdee5;
  padding: 0 8px;
  font-weight: bold;
  height: 65px; 
  display: flex;
  align-items: center;
  grid-row: 1;
}

.gantt-timeline-header {
  overflow: hidden;
}

.gantt-task-list-body,
.gantt-rows-container {
  position: relative;
  overflow: auto;
  border-right: 1px solid #dcdee5;
  grid-row: 2;
}



.gantt-rows-container {
  flex-grow: 1;
  background-size: 100% 32px; 
  background-image: linear-gradient(to bottom, #f5f7fa 1px, transparent 1px);
}

.task-list-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f1f5;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 20px;
  text-align: center;
  margin-right: 4px;
  color: #63656e;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  font-size: 1.2em;
  color: #333;
}

.task-selected {
  background-color: #e6f7ff !important;
}

.task-list-item.task-critical {
  color: #d93026;
  font-weight: 500;
}

.filter-container {
  display: flex;
  padding: 8px;
  background-color: #fff;
  border-bottom: 1px solid #dfe1e6;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #5e6c84;
}

.filter-item select {
  padding: 4px 8px;
  border: 1px solid #dfe1e6;
  border-radius: 3px;
  background-color: #fff;
  min-width: 120px;
}
</style>
