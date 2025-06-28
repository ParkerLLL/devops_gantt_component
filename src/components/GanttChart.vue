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
const rowHeight = ref(40); // 增加默认行高
const displayMode = ref<'compact' | 'comfortable'>('comfortable'); // 显示模式

// 拖拽调整列宽相关
const taskListWidth = ref(320); // 任务列表宽度
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartWidth = ref(0);

// 缩放相关
const zoomLevel = ref(1);
const minZoom = 0.5;
const maxZoom = 3;
const viewMode = ref<'day' | 'week' | 'month'>('day');
const isLoading = ref(true);
const selectedTaskId = ref<string | null>(null);
const isModalVisible = ref(false);
const taskForModal = ref<GanttTask | null>(null);

const criticalPathIds = ref(new Set<string>());

const tasks = ref<GanttTask[]>([]);

// 筛选相关状态
const filters = ref({
  department: '',
  project: '',
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
      types: [],
      departments: []
    };
  }

  const projects = new Set<string>();
  const creators = new Set<string>();
  const types = new Set<string>();
  const departments = new Set<string>();

  allTasksForScale.value.forEach(task => {
    if (task.project_name) projects.add(task.project_name);
    if (task.creator) creators.add(task.creator);
    if (task.type) types.add(task.type);
    if (task.department_name) departments.add(task.department_name);
  });

  return {
    projects: Array.from(projects),
    creators: Array.from(creators),
    types: Array.from(types),
    departments: Array.from(departments)
  };
});

// 根据筛选条件过滤任务
const filteredTasks = computed(() => {
  let filtered = [...tasks.value];

  if (filters.value.department) {
    filtered = filtered.filter(task => task.department_name === filters.value.department);
  }

  if (filters.value.project) {
    filtered = filtered.filter(task => task.project_name === filters.value.project);
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
    return d3.scaleTime().domain([new Date(), new Date()]).range([0, ganttWidth * zoomLevel.value]);
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
    .range([0, ganttWidth * zoomLevel.value]);
});

// --- Virtualization Setup ---
const rightPaneRef = ref<HTMLElement | null>(null);

// Standard pattern: Initialize virtualizer at the top level.
// It's reactive and will update automatically when the scroll element ref is populated.
// 根据显示模式动态计算行高
const dynamicRowHeight = computed(() => {
  return displayMode.value === 'compact' ? 32 : 48;
});

// 更新行高响应式
watch(displayMode, (newMode) => {
  rowHeight.value = newMode === 'compact' ? 32 : 48;
});

const rowVirtualizerOptions = computed(() => ({
  count: visibleTasks.value.length,
  getScrollElement: () => rightPaneRef.value,
  estimateSize: () => rowHeight.value,
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
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  
  // 阻止焦点变化
  const target = event.target as HTMLElement;
  if (target && target.blur) {
    target.blur();
  }
  
  selectedTaskId.value = task.id;

  if (tooltipState.value.visible && tooltipState.value.task?.id === task.id) {
    tooltipState.value.visible = false;
    return;
  }

  const currentTarget = event.currentTarget as HTMLElement;
  const rect = currentTarget.getBoundingClientRect();
  tooltipState.value = {
    visible: true,
    task,
    position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
  };
  
  // 智能滚动到任务时间位置
  nextTick(() => {
    if (rightPaneRef.value) {
      const taskStartDate = new Date(task.start_date);
      const taskX = xScale.value(taskStartDate);
      const containerWidth = rightPaneRef.value.clientWidth || 0;
      const optimalScrollLeft = Math.max(0, taskX - containerWidth / 3);
      
      rightPaneRef.value.scrollTo({
        left: optimalScrollLeft,
        behavior: 'smooth'
      });
    }
  });
};

const handleGanttContainerClick = () => {
  tooltipState.value.visible = false;
  selectedTaskId.value = null; // Deselect when clicking outside
};


// --- Scroll Synchronization ---
const leftPaneRef = ref<HTMLElement | null>(null);
const timelineHeaderRef = ref<HTMLElement | null>(null);

// 防止循环滚动的标志
let isVerticalSyncing = false;
let isHorizontalSyncing = false;

// 垂直滚动同步（任务列表和甘特图行）
watch([leftPaneRef, rightPaneRef], ([leftEl, rightEl]) => {
  if (!leftEl || !rightEl) return;

  const syncVerticalScroll = (from: HTMLElement, to: HTMLElement) => {
    const handleScroll = () => {
      if (isVerticalSyncing) return;
      isVerticalSyncing = true;
      
      requestAnimationFrame(() => {
        to.scrollTop = from.scrollTop;
        isVerticalSyncing = false;
      });
    };
    
    from.addEventListener('scroll', handleScroll, { passive: true });
    
    // 清理函数
    return () => from.removeEventListener('scroll', handleScroll);
  };

  const cleanup1 = syncVerticalScroll(leftEl, rightEl);
  const cleanup2 = syncVerticalScroll(rightEl, leftEl);

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup1?.();
    cleanup2?.();
  });
}, { flush: 'post' });

// 水平滚动同步（时间轴头部和甘特图行）
watch([timelineHeaderRef, rightPaneRef], ([headerEl, rightEl]) => {
  if (!headerEl || !rightEl) return;

  const syncHorizontalScroll = (from: HTMLElement, to: HTMLElement) => {
    const handleScroll = () => {
      if (isHorizontalSyncing) return;
      isHorizontalSyncing = true;
      
      requestAnimationFrame(() => {
        to.scrollLeft = from.scrollLeft;
        isHorizontalSyncing = false;
      });
    };
    
    from.addEventListener('scroll', handleScroll, { passive: true });
    
    // 清理函数
    return () => from.removeEventListener('scroll', handleScroll);
  };

  const cleanup1 = syncHorizontalScroll(headerEl, rightEl);
  const cleanup2 = syncHorizontalScroll(rightEl, headerEl);

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup1?.();
    cleanup2?.();
  });
}, { flush: 'post' });

// 拖拽调整列宽功能
const handleResizeStart = (event: MouseEvent) => {
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartWidth.value = taskListWidth.value;
  
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
  event.preventDefault();
};

const handleResizeMove = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  const deltaX = event.clientX - dragStartX.value;
  const newWidth = Math.max(200, Math.min(600, dragStartWidth.value + deltaX));
  taskListWidth.value = newWidth;
};

const handleResizeEnd = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
};

// 缩放功能
const handleZoomIn = () => {
  const newZoom = Math.min(maxZoom, zoomLevel.value * 1.2);
  zoomLevel.value = newZoom;
};

const handleZoomOut = () => {
  const newZoom = Math.max(minZoom, zoomLevel.value / 1.2);
  zoomLevel.value = newZoom;
};

const handleZoomReset = () => {
  zoomLevel.value = 1;
};

// 滚轮缩放功能
const handleWheel = (event: WheelEvent) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * delta));
    zoomLevel.value = newZoom;
  }
};

// 智能滚动到任务
const scrollToTask = (taskId: string) => {
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement && rightPaneRef.value) {
    const taskRect = taskElement.getBoundingClientRect();
    const containerRect = rightPaneRef.value.getBoundingClientRect();
    
    // 计算需要滚动的距离
    const scrollTop = rightPaneRef.value.scrollTop + taskRect.top - containerRect.top - containerRect.height / 2;
    
    rightPaneRef.value.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth'
    });
  }
};

// 计算甘特图网格样式
const ganttGridStyle = computed(() => ({
  gridTemplateColumns: `${taskListWidth.value}px 1fr`,
}));

// 计算甘特图行容器的样式
const ganttRowsStyle = computed(() => ({
  backgroundSize: `100% ${dynamicRowHeight.value}px`,
}));

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
        <!-- 筛选器栏 -->
        <div class="filter-bar">
          <div class="filter-item">
            <label>部门:</label>
            <select v-model="filters.department">
              <option value="">全部部门</option>
              <option v-for="department in filterOptions.departments" :key="department" :value="department">{{ department }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>项目:</label>
            <select v-model="filters.project">
              <option value="">全部项目</option>
              <option v-for="project in filterOptions.projects" :key="project" :value="project">{{ project }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>类型:</label>
            <select v-model="filters.type">
              <option value="">全部类型</option>
              <option v-for="type in filterOptions.types" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
        </div>

        <div class="toolbar">
          <div class="view-controls">
            <div class="view-mode-group">
              <button @click="viewMode = 'day'" :class="{ active: viewMode === 'day' }">日</button>
              <button @click="viewMode = 'week'" :class="{ active: viewMode === 'week' }">周</button>
              <button @click="viewMode = 'month'" :class="{ active: viewMode === 'month' }">月</button>
            </div>
            <div class="display-mode-group">
              <button @click="displayMode = 'compact'" :class="{ active: displayMode === 'compact' }" title="紧凑模式">紧凑</button>
              <button @click="displayMode = 'comfortable'" :class="{ active: displayMode === 'comfortable' }" title="宽松模式">宽松</button>
            </div>
            <div class="zoom-controls">
              <button @click="handleZoomOut" :disabled="zoomLevel <= minZoom" title="缩小">-</button>
              <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
              <button @click="handleZoomIn" :disabled="zoomLevel >= maxZoom" title="放大">+</button>
              <button @click="handleZoomReset" title="重置缩放">重置</button>
            </div>
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
        
        <div class="gantt-grid" :style="ganttGridStyle">
          <div class="gantt-task-list-header">
            版本/迭代列表
            <div class="resize-handle" @mousedown="handleResizeStart" :class="{ 'dragging': isDragging }"></div>
          </div>
          <div class="gantt-timeline-header" ref="timelineHeaderRef">
            <Timeline :x-scale="xScale" :view-mode="viewMode" :width="ganttWidth * zoomLevel" />
          </div>
          <!-- Left side: Task List -->
          <div class="gantt-task-list-body" ref="leftPaneRef">
            <div class="resize-handle-body" @mousedown="handleResizeStart" :class="{ 'dragging': isDragging }"></div>
            <div :style="{ height: `${totalSize}px`, position: 'relative' }">
              <template v-for="row in visibleVirtualRows" :key="row.task.id">
                <div
                  :class="['task-list-item', { 'task-selected': row.task.id === selectedTaskId, 'task-critical': criticalPathIds.has(row.task.id) }]"
                  :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${row.size}px`, transform: `translateY(${row.start}px)` }"
                  @click.stop="handleTaskClick(row.task, $event)"
                  @dblclick="handleDoubleClick(row.task)"
                >
                  <div class="task-content" :style="{ paddingLeft: `${row.task.depth * 20}px` }">
                    <button v-if="row.task.children && row.task.children.length > 0" @click.stop="handleToggleTask(row.task.id)" class="toggle-btn">
                      {{ row.task.isExpanded ? '▼' : '▶' }}
                    </button>
                    <span class="task-name">{{ row.task.text }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Right side: Chart -->
          <div class="gantt-rows-container" ref="rightPaneRef" :style="ganttRowsStyle" @wheel="handleWheel">
            <div :style="{ height: `${totalSize}px`, position: 'relative' }">
                <svg class="gantt-rows" :width="ganttWidth * zoomLevel" :height="totalSize">
                    <template v-for="row in visibleVirtualRows" :key="row.task.id">
                        <g
                            class="gantt-row"
                            :style="{ transform: `translateY(${row.start}px)` }"
                        >
                            <TaskRow 
                                :task="row.task" 
                                :x-scale="xScale" 
                                :y="0" 
                                :height="dynamicRowHeight" 
                                :is-selected="row.task.id === selectedTaskId" 
                                :is-critical="criticalPathIds.has(row.task.id)" 
                                @click.stop="(task, event) => handleTaskClick(task, event)" 
                                @dblclick="(task) => handleDoubleClick(task)" 
                            />
                        </g>
                    </template>
                    <DependencyLines :tasks="visibleTasks" :x-scale="xScale" :row-height="dynamicRowHeight" :task-positions="taskPositions" :visible-items="visibleVirtualRows" />
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
  height: 80vh;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-heavy);
  border: 1px solid var(--border-tertiary);
}
.gantt-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.filter-bar {
  padding: 16px 24px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.toolbar {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-secondary);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.view-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.view-mode-group,
.display-mode-group,
.zoom-controls {
  display: flex;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-medium);
  overflow: hidden;
  align-items: center;
}

.view-mode-group button,
.display-mode-group button,
.zoom-controls button {
  margin-right: 0 !important;
  border-radius: 0 !important;
  border: none !important;
  border-right: 1px solid var(--border-primary) !important;
}

.view-mode-group button:last-child,
.display-mode-group button:last-child,
.zoom-controls button:last-child {
  border-right: none !important;
}

.zoom-level {
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.zoom-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toolbar button {
  padding: 9px 16px;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-medium);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.toolbar .today-btn {
  margin-left: 0;
}
.toolbar button:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-light);
}
.toolbar button.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
  box-shadow: var(--shadow-medium);
}
.today-btn {
  margin-left: 16px;
  background: var(--primary) !important;
  border: 1px solid var(--primary) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: var(--shadow-light);
}
.stats-container {
  display: flex;
  gap: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-tertiary);
  padding: 12px 16px;
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-secondary);
  transition: all 0.2s ease;
}
.stat-item:hover {
  background: var(--bg-quaternary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-light);
}
.stat-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}
.stat-value {
  background: var(--primary);
  color: #ffffff;
  padding: 4px 10px;
  border-radius: var(--radius-small);
  font-size: 13px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}
.gantt-grid {
  display: grid;
  grid-template-rows: auto 1fr;
  flex: 1;
  min-height: 0;
}


.gantt-task-list-header,
.gantt-timeline-header {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-secondary);
  border-right: 1px solid var(--border-secondary);
  padding: 0 24px;
  font-weight: 600;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  grid-row: 1;
  color: var(--text-primary);
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  position: relative;
}

.gantt-task-list-header {
  border-right: none;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s ease;
}

.resize-handle:hover,
.resize-handle.dragging {
  background: var(--primary);
}

.resize-handle-body {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s ease;
}

.resize-handle-body:hover,
.resize-handle-body.dragging {
  background: var(--primary);
}

.gantt-task-list-body {
  position: relative;
}

.gantt-timeline-header {
  overflow-x: auto;
  overflow-y: visible;
}

.gantt-task-list-body {
  position: relative;
  overflow: auto;
  border-right: 1px solid var(--border-secondary);
  grid-row: 2;
  background: var(--bg-secondary);
}

.gantt-rows-container {
  position: relative;
  overflow: auto;
  border-right: 1px solid var(--border-secondary);
  grid-row: 2;
  flex-grow: 1;
  background-image: linear-gradient(to bottom, var(--border-tertiary) 1px, transparent 1px);
  background-color: var(--bg-secondary);
}

.task-list-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-tertiary);
  padding: 8px 20px;
  white-space: nowrap;
  overflow: visible;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.task-list-item:hover {
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-light);
}

.task-list-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--primary);
  transition: width 0.2s ease;
}

.task-list-item:hover::before {
  width: 3px;
}

.toggle-btn {
  background: var(--primary);
  border: none;
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-light);
}

.toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-medium);
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
  background: rgba(0, 122, 255, 0.08) !important;
  border-left: 3px solid var(--primary) !important;
  padding-left: 21px !important;
  box-shadow: var(--shadow-light) !important;
  font-weight: 600;
  color: var(--primary) !important;
}

.task-selected::before {
  width: 3px !important;
  background: var(--primary) !important;
}

.task-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.task-name {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  line-height: 1.4;
}

.task-list-item.task-critical {
  color: var(--error);
  font-weight: 600;
  position: relative;
}

.task-list-item.task-critical::after {
  content: '⚡';
  position: absolute;
  right: 12px;
  font-size: 12px;
  color: var(--warning);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}


.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  white-space: nowrap;
}

.filter-item select {
  padding: 10px 14px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-medium);
  background: var(--bg-secondary);
  min-width: 150px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  outline: none;
}

.filter-item select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

.filter-item select:hover {
  border-color: var(--border-secondary);
  box-shadow: var(--shadow-light);
}
</style>
