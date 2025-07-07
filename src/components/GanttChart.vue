<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, watchEffect, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { useVirtualizer } from '@tanstack/vue-virtual';
import Timeline from './Timeline.vue';
import TaskRow from './TaskRow.vue';
import DependencyLines from './DependencyLines.vue';
import Tooltip from './Tooltip.vue';
import ColorLegend from './ColorLegend.vue';
import type { GanttTask } from '@/types';
import { fetchGanttData } from '@/services/mockData';
import TaskDetailsModal from './TaskDetailsModal.vue';

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


const tasks = ref<GanttTask[]>([]);

// 筛选相关状态
const filters = ref({
  department: '',
  project: '',
  type: '',
  search: '',
  startDate: '',
  endDate: ''
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

// 打开API文档
const openApiDocs = () => {
  // 在新窗口中打开API文档页面
  window.open('/docs/API.html', '_blank', 'noopener,noreferrer');
};

// 智能分析相关状态
const isAnalysisModalVisible = ref(false);
const selectedVersionForAnalysis = ref('');
const analysisResult = ref<any>(null);
const isAnalyzing = ref(false);

// 打开智能分析
const openSmartAnalysis = () => {
  isAnalysisModalVisible.value = true;
  // 设置默认选择第一个版本
  if (filteredTasks.value.length > 0) {
    selectedVersionForAnalysis.value = filteredTasks.value[0].id;
  }
};

// 执行智能分析
const performAnalysis = async () => {
  if (!selectedVersionForAnalysis.value) return;
  
  isAnalyzing.value = true;
  
  try {
    // 找到选中的版本/迭代
    const selectedVersion = allTasksForScale.value.find(task => task.id === selectedVersionForAnalysis.value);
    if (!selectedVersion) return;
    
    // 收集该版本下的所有工作项
    const collectChildren = (task: GanttTask): GanttTask[] => {
      let items = [task];
      if (task.children) {
        task.children.forEach(child => {
          items = items.concat(collectChildren(child));
        });
      }
      return items;
    };
    
    const allItems = collectChildren(selectedVersion);
    
    // 执行分析
    const analysis = analyzeVersionProgress(allItems, selectedVersion);
    analysisResult.value = analysis;
    
  } catch (error) {
    console.error('分析失败:', error);
  } finally {
    isAnalyzing.value = false;
  }
};

// 智能分析核心逻辑
const analyzeVersionProgress = (items: GanttTask[], version: GanttTask) => {
  const now = new Date();
  const startDate = new Date(version.start_date);
  const endDate = new Date(version.end_date);
  
  // 基础统计
  const totalItems = items.length - 1; // 排除版本本身
  const completedItems = items.filter(item => item !== version && item.status === '已完成').length;
  const inProgressItems = items.filter(item => item !== version && item.status === '进行中').length;
  const notStartedItems = items.filter(item => item !== version && !['已完成', '进行中'].includes(item.status)).length;
  
  // 进度计算
  const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  // 时间进度
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = now.getTime() - startDate.getTime();
  const timeProgress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
  
  // 是否延期
  const isOverdue = now > endDate && completionRate < 100;
  const isAtRisk = timeProgress > completionRate + 15; // 时间进度超过完成进度15%认为有风险
  
  // 人员分析
  const creatorStats = new Map<string, { total: number; completed: number }>();
  items.forEach(item => {
    if (item !== version && item.creator) {
      if (!creatorStats.has(item.creator)) {
        creatorStats.set(item.creator, { total: 0, completed: 0 });
      }
      const stats = creatorStats.get(item.creator)!;
      stats.total++;
      if (item.status === '已完成') {
        stats.completed++;
      }
    }
  });
  
  // 类型分析
  const typeStats = new Map<string, { total: number; completed: number }>();
  items.forEach(item => {
    if (item !== version && item.type) {
      if (!typeStats.has(item.type)) {
        typeStats.set(item.type, { total: 0, completed: 0 });
      }
      const stats = typeStats.get(item.type)!;
      stats.total++;
      if (item.status === '已完成') {
        stats.completed++;
      }
    }
  });
  
  // 生成建议
  const suggestions = [];
  
  if (isOverdue) {
    suggestions.push('⚠️ 项目已延期，建议重新评估剩余工作量和交付时间');
  }
  
  if (isAtRisk) {
    suggestions.push('🚨 项目进度滞后，时间进度超过完成进度，需要加快推进');
  }
  
  if (completionRate < 30 && timeProgress > 50) {
    suggestions.push('📈 建议增加人力投入或调整需求优先级');
  }
  
  // 找出效率较低的人员
  const lowEfficiencyCreators = Array.from(creatorStats.entries())
    .filter(([_, stats]) => stats.total >= 3 && (stats.completed / stats.total) < 0.5)
    .map(([creator, _]) => creator);
    
  if (lowEfficiencyCreators.length > 0) {
    suggestions.push(`👥 以下人员完成率较低，建议关注: ${lowEfficiencyCreators.join(', ')}`);
  }
  
  // 找出问题较多的类型
  const problematicTypes = Array.from(typeStats.entries())
    .filter(([_, stats]) => stats.total >= 2 && (stats.completed / stats.total) < 0.4)
    .map(([type, _]) => type);
    
  if (problematicTypes.length > 0) {
    suggestions.push(`🔧 以下类型完成率较低，可能需要额外关注: ${problematicTypes.join(', ')}`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push('✅ 项目进展良好，继续保持当前节奏');
  }
  
  return {
    version: version.text,
    summary: {
      totalItems,
      completedItems,
      inProgressItems,
      notStartedItems,
      completionRate: Math.round(completionRate * 100) / 100,
      timeProgress: Math.round(timeProgress * 100) / 100,
      isOverdue,
      isAtRisk
    },
    creatorStats: Array.from(creatorStats.entries()).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      rate: Math.round((stats.completed / stats.total) * 10000) / 100
    })),
    typeStats: Array.from(typeStats.entries()).map(([name, stats]) => ({
      name,
      total: stats.total,
      completed: stats.completed,
      rate: Math.round((stats.completed / stats.total) * 10000) / 100
    })),
    suggestions
  };
};

// 清除所有筛选条件
const clearFilters = () => {
  filters.value.department = '';
  filters.value.project = '';
  filters.value.type = '';
  filters.value.search = '';
  filters.value.startDate = '';
  filters.value.endDate = '';
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

  // 部门筛选
  if (filters.value.department) {
    filtered = filtered.filter(task => task.department_name === filters.value.department);
  }

  // 项目筛选
  if (filters.value.project) {
    filtered = filtered.filter(task => task.project_name === filters.value.project);
  }

  // 类型筛选
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

  // 搜索筛选
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase();
    filtered = filtered.filter(task => {
      // 搜索任务名称、创建人、项目名称
      const searchFields = [
        task.text,
        task.creator,
        task.project_name,
        task.status
      ].join(' ').toLowerCase();
      
      return searchFields.includes(searchTerm);
    });
  }

  // 日期筛选 (基于创建时间 - 这里用start_date作为创建时间)
  if (filters.value.startDate) {
    filtered = filtered.filter(task => task.start_date >= filters.value.startDate);
  }

  if (filters.value.endDate) {
    filtered = filtered.filter(task => task.start_date <= filters.value.endDate);
  }

  return filtered;
});

// 将树状任务列表拍平，只显示版本和迭代层级
const flattenTasks = (tasks: GanttTask[], depth = 0): (GanttTask & { depth: number })[] => {
  let result: (GanttTask & { depth: number })[] = [];
  for (const task of tasks) {
    // 只显示版本(version)和迭代(sprint)类型的任务
    if (task.type === 'version' || task.type === 'sprint') {
      result.push({ ...task, depth });
      // 不再递归显示子级工作项，只显示版本和迭代本身
      // 具体的工作项（需求/缺陷/任务）将在弹窗中显示
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

// 筛选后的所有任务（包括子任务）用于统计
const filteredTasksForStats = computed(() => {
    const all: GanttTask[] = [];
    const traverse = (task: GanttTask) => {
        all.push(task);
        if (task.children) {
            task.children.forEach(traverse);
        }
    };
    filteredTasks.value.forEach(traverse);
    return all;
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

// 获取状态样式类名
const getStatusClass = (status: string): string => {
  if (status.includes('完成') || status.includes('已完成')) return 'completed';
  if (status.includes('进行中') || status.includes('开发中') || status.includes('测试中')) return 'in-progress';
  if (status.includes('规划中') || status.includes('未开始') || status.includes('需求分析') || status.includes('设计中')) return 'not-started';
  if (status.includes('已修复')) return 'completed';
  return 'default';
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
      // 显示更宽的时间范围，前后各扩展6个月
      domainStartDate = d3.timeMonth.offset(minDate, -6);
      domainEndDate = d3.timeMonth.offset(maxDate, 6);
      break;
    case 'month':
      // 显示更宽的时间范围，前后各扩展2年
      domainStartDate = d3.timeYear.offset(minDate, -2);
      domainEndDate = d3.timeYear.offset(maxDate, 2);
      break;
    default: // 'day'
      // 显示更宽的时间范围，前后各扩展3个月
      domainStartDate = d3.timeMonth.offset(minDate, -3);
      domainEndDate = d3.timeMonth.offset(maxDate, 3);
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

// 计算工作项统计数据 - 基于筛选后的任务
const workItemStats = computed(() => {
  if (filteredTasksForStats.value.length === 0) {
    return {
      requirements: { total: 0, closed: 0 },
      tasks: { total: 0, closed: 0 },
      defects: { total: 0, closed: 0 }
    };
  }

  return filteredTasksForStats.value.reduce((stats, task) => {
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
        <!-- 主控制栏 -->
        <div class="main-controls">
          <!-- 搜索区域 -->
          <div class="search-section">
            <div class="search-box">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M7 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M12 12l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input 
                v-model="filters.search" 
                type="text" 
                placeholder="搜索版本、项目或创建人..." 
                class="search-input"
              />
              <button 
                v-if="filters.search" 
                @click="filters.search = ''" 
                class="search-clear"
                title="清除搜索"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- 筛选器区域 -->
          <div class="filters-section">
            <div class="filter-group">
              <select v-model="filters.department" class="filter-select">
                <option value="">全部部门</option>
                <option v-for="department in filterOptions.departments" :key="department" :value="department">{{ department }}</option>
              </select>
              <select v-model="filters.project" class="filter-select">
                <option value="">全部项目</option>
                <option v-for="project in filterOptions.projects" :key="project" :value="project">{{ project }}</option>
              </select>
              <select v-model="filters.type" class="filter-select">
                <option value="">全部类型</option>
                <option v-for="type in filterOptions.types" :key="type" :value="type">{{ type }}</option>
              </select>
            </div>
            
            <!-- 日期筛选 -->
            <div class="date-filter-group">
              <input 
                v-model="filters.startDate" 
                type="date" 
                class="date-input"
                title="开始日期"
              />
              <span class="date-separator">至</span>
              <input 
                v-model="filters.endDate" 
                type="date" 
                class="date-input"
                title="结束日期"
              />
            </div>
          </div>

          <!-- 操作按钮区域 -->
          <div class="actions-section">
            <button 
              v-if="filters.department || filters.project || filters.type || filters.search || filters.startDate || filters.endDate" 
              @click="clearFilters" 
              class="clear-filters-btn"
              title="清除所有筛选条件"
            >
              ✕ 清除
            </button>
            <button @click="openApiDocs" class="api-docs-btn" title="查看API文档">📄 API</button>
            <button @click="openSmartAnalysis" class="smart-analysis-btn" title="智能分析版本进度">🧠 智能分析</button>
          </div>
        </div>

        <!-- 工具栏和统计 -->
        <div class="controls-bar">
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
          
          <!-- 统计信息 -->
          <div class="stats-info">
            <div class="filter-summary">
              <span class="filter-summary-text">
                显示 <strong>{{ filteredTasks.length }}</strong> 个版本/迭代，
                共 <strong>{{ filteredTasksForStats.length }}</strong> 个工作项
              </span>
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
          
          <!-- 颜色图例 -->
          <div class="legend-section">
            <ColorLegend />
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
                  :class="['task-list-item', { 'task-selected': row.task.id === selectedTaskId }]"
                  :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${row.size}px`, transform: `translateY(${row.start}px)` }"
                  @click.stop="handleTaskClick(row.task, $event)"
                  @dblclick="handleDoubleClick(row.task)"
                >
                  <div class="task-content" :style="{ paddingLeft: `${row.task.depth * 20}px` }">
                    <button v-if="row.task.children && row.task.children.length > 0" @click.stop="handleDoubleClick(row.task)" class="details-btn" title="查看工作项详情">
                      📋
                    </button>
                    <div class="task-info">
                      <span class="task-type-badge" :class="`type-${row.task.type}`">
                        {{ row.task.type === 'version' ? '版本' : '迭代' }}
                      </span>
                      <span class="task-name">{{ row.task.text }}</span>
                      <span class="task-status-badge" :class="`status-${getStatusClass(row.task.status)}`">
                        {{ row.task.status }}
                      </span>
                    </div>
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
      
      <!-- 智能分析模态框 -->
      <div v-if="isAnalysisModalVisible" class="modal-overlay" @click.self="isAnalysisModalVisible = false">
        <div class="smart-analysis-modal">
          <div class="modal-header">
            <h2>🧠 智能分析</h2>
            <button @click="isAnalysisModalVisible = false" class="close-btn">✕</button>
          </div>
          
          <div class="modal-content">
            <!-- 版本选择 -->
            <div class="version-selector">
              <label>选择版本/迭代:</label>
              <select v-model="selectedVersionForAnalysis" class="version-select">
                <option value="">请选择版本</option>
                <option v-for="task in filteredTasks" :key="task.id" :value="task.id">{{ task.text }}</option>
              </select>
              <button 
                @click="performAnalysis" 
                :disabled="!selectedVersionForAnalysis || isAnalyzing"
                class="analyze-btn"
              >
                {{ isAnalyzing ? '分析中...' : '开始分析' }}
              </button>
            </div>
            
            <!-- 分析结果 -->
            <div v-if="analysisResult" class="analysis-results">
              <h3>{{ analysisResult.version }} - 分析报告</h3>
              
              <!-- 总体概况 -->
              <div class="summary-section">
                <h4>📊 总体概况</h4>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">总工作项</span>
                    <span class="summary-value">{{ analysisResult.summary.totalItems }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">已完成</span>
                    <span class="summary-value completed">{{ analysisResult.summary.completedItems }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">进行中</span>
                    <span class="summary-value in-progress">{{ analysisResult.summary.inProgressItems }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">未开始</span>
                    <span class="summary-value not-started">{{ analysisResult.summary.notStartedItems }}</span>
                  </div>
                </div>
                
                <div class="progress-comparison">
                  <div class="progress-item">
                    <span>完成进度: {{ analysisResult.summary.completionRate }}%</span>
                    <div class="progress-bar">
                      <div class="progress-fill completion" :style="{ width: analysisResult.summary.completionRate + '%' }"></div>
                    </div>
                  </div>
                  <div class="progress-item">
                    <span>时间进度: {{ analysisResult.summary.timeProgress }}%</span>
                    <div class="progress-bar">
                      <div class="progress-fill time" :style="{ width: analysisResult.summary.timeProgress + '%' }"></div>
                    </div>
                  </div>
                </div>
                
                <div class="status-badges">
                  <span v-if="analysisResult.summary.isOverdue" class="status-badge overdue">延期</span>
                  <span v-if="analysisResult.summary.isAtRisk" class="status-badge at-risk">风险</span>
                  <span v-if="!analysisResult.summary.isOverdue && !analysisResult.summary.isAtRisk" class="status-badge normal">正常</span>
                </div>
              </div>
              
              <!-- 人员分析 -->
              <div class="creator-section">
                <h4>👥 人员完成率分析</h4>
                <div class="stats-grid">
                  <div v-for="creator in analysisResult.creatorStats" :key="creator.name" class="stats-item">
                    <div class="stats-name">{{ creator.name }}</div>
                    <div class="stats-numbers">{{ creator.completed }}/{{ creator.total }}</div>
                    <div class="stats-rate" :class="{ 'low-rate': creator.rate < 50 }">{{ creator.rate }}%</div>
                  </div>
                </div>
              </div>
              
              <!-- 类型分析 -->
              <div class="type-section">
                <h4>🔧 类型完成率分析</h4>
                <div class="stats-grid">
                  <div v-for="type in analysisResult.typeStats" :key="type.name" class="stats-item">
                    <div class="stats-name">{{ type.name }}</div>
                    <div class="stats-numbers">{{ type.completed }}/{{ type.total }}</div>
                    <div class="stats-rate" :class="{ 'low-rate': type.rate < 50 }">{{ type.rate }}%</div>
                  </div>
                </div>
              </div>
              
              <!-- 建议 -->
              <div class="suggestions-section">
                <h4>💡 优化建议</h4>
                <ul class="suggestions-list">
                  <li v-for="(suggestion, index) in analysisResult.suggestions" :key="index" class="suggestion-item">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gantt-container-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  overflow: hidden;
}
.gantt-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  overflow: hidden;
}

/* 主控制栏 */
.main-controls {
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  min-height: 56px;
}

/* 搜索区域 */
.search-section {
  flex: 1;
  min-width: 300px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-medium);
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.search-icon {
  color: var(--text-secondary);
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-clear {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.search-clear:hover {
  color: var(--error);
  background: rgba(255, 59, 48, 0.1);
}

/* 筛选器区域 */
.filters-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-small);
  background: var(--bg-secondary);
  min-width: 120px;
  font-size: 13px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
}

.date-filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-small);
  border: 1px solid var(--border-primary);
}

.date-input {
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  outline: none;
}

.date-separator {
  color: var(--text-secondary);
  font-size: 12px;
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.clear-filters-btn {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-small);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.clear-filters-btn:hover {
  background: var(--error);
  border-color: var(--error);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-light);
}

.api-docs-btn {
  padding: 8px 12px;
  background: var(--secondary);
  border: 1px solid var(--secondary);
  border-radius: var(--radius-small);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.api-docs-btn:hover {
  background: #4B44C7;
  border-color: #4B44C7;
  transform: translateY(-1px);
  box-shadow: var(--shadow-medium);
}

/* 工具栏和统计 */
.controls-bar {
  padding: 12px 20px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  min-height: 48px;
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-summary-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.filter-summary-text strong {
  color: var(--primary);
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px 20px;
  }
  
  .search-section {
    min-width: auto;
  }
  
  .filters-section {
    justify-content: center;
  }
  
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .stats-info {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .filter-group {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-select {
    min-width: auto;
  }
  
  .date-filter-group {
    flex-direction: column;
    gap: 4px;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 8px;
  }
}
/* 旧的toolbar样式已被新的controls-bar替代 */
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

.api-docs-btn {
  margin-left: 12px;
  background: var(--secondary) !important;
  border: 1px solid var(--secondary) !important;
  color: #ffffff !important;
  font-weight: 500;
  font-size: 13px;
  box-shadow: var(--shadow-light);
  display: flex;
  align-items: center;
  gap: 4px;
}

.api-docs-btn:hover {
  background: #4B44C7 !important;
  border-color: #4B44C7 !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-medium);
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
  height: calc(100vh - 200px); /* 减去header、main-controls、controls-bar的高度 */
}


.gantt-task-list-header,
.gantt-timeline-header {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-secondary);
  border-right: 1px solid var(--border-secondary);
  padding: 0 24px;
  font-weight: 600;
  height: 80px; /* 增加高度为滚动条留出空间 */
  display: flex;
  align-items: flex-start; /* 改为顶部对齐 */
  justify-content: space-between;
  grid-row: 1;
  color: var(--text-primary);
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  position: relative;
  padding-bottom: 20px; /* 为滚动条留出底部空间 */
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
  scrollbar-width: thin; /* 使用较细的滚动条 */
  scrollbar-color: var(--border-primary) transparent;
}

.gantt-timeline-header::-webkit-scrollbar {
  height: 8px; /* 减少滚动条高度 */
}

.gantt-timeline-header::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

.gantt-timeline-header::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
}

.gantt-timeline-header::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
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

.details-btn {
  background: rgba(0, 122, 255, 0.1);
  border: 1px solid rgba(0, 122, 255, 0.2);
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 12px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-light);
}

.details-btn:hover {
  background: rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.3);
  transform: scale(1.05);
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


@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 智能分析按钮样式 */
.smart-analysis-btn {
  background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-small);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.smart-analysis-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.smart-analysis-btn:active {
  transform: translateY(0);
}

/* 智能分析模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.smart-analysis-modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-heavy);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-secondary);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-large) var(--radius-large) 0 0;
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-quaternary);
  color: var(--text-primary);
}

.modal-content {
  padding: 24px;
}

/* 版本选择区域 */
.version-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-secondary);
}

.version-selector label {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.version-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-small);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
}

.analyze-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-small);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.analyze-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 分析结果样式 */
.analysis-results {
  margin-top: 20px;
}

.analysis-results h3 {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--primary);
}

.analysis-results h4 {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 12px 0;
}

/* 总体概况样式 */
.summary-section {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-small);
  border: 1px solid var(--border-secondary);
}

.summary-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-value.completed { color: var(--success); }
.summary-value.in-progress { color: var(--primary); }
.summary-value.not-started { color: var(--text-secondary); }

/* 进度条样式 */
.progress-comparison {
  margin: 20px 0;
}

.progress-item {
  margin-bottom: 12px;
}

.progress-item span {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-quaternary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.completion { background: var(--success); }
.progress-fill.time { background: var(--primary); }

/* 状态徽章 */
.status-badges {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.status-badge.overdue { background: var(--error); }
.status-badge.at-risk { background: var(--warning); }
.status-badge.normal { background: var(--success); }

/* 统计网格样式 */
.creator-section, .type-section {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.stats-item {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-small);
  border: 1px solid var(--border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-name {
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.stats-numbers {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 8px;
}

.stats-rate {
  font-weight: 600;
  color: var(--success);
  min-width: 50px;
  text-align: right;
}

.stats-rate.low-rate {
  color: var(--error);
}

/* 建议样式 */
.suggestions-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-secondary);
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-small);
  border-left: 4px solid var(--primary);
  color: var(--text-primary);
  line-height: 1.5;
}

.suggestion-item:last-child {
  margin-bottom: 0;
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

/* 颜色图例区域 */
.legend-section {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

/* 任务信息布局 */
.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

/* 类型标签 */
.task-type-badge {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(0, 122, 255, 0.2);
  text-align: center;
  min-width: 32px;
  flex-shrink: 0;
}

.task-type-badge.type-version {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border-color: rgba(0, 122, 255, 0.2);
}

.task-type-badge.type-sprint {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
  border-color: rgba(52, 199, 89, 0.2);
}

/* 任务名称 */
.task-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 状态标签 */
.task-status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  text-align: center;
  flex-shrink: 0;
  border: 1px solid;
}

.task-status-badge.status-completed {
  background: rgba(52, 199, 89, 0.1);
  color: #1d8348;
  border-color: rgba(52, 199, 89, 0.3);
}

.task-status-badge.status-in-progress {
  background: rgba(255, 149, 0, 0.1);
  color: #d68910;
  border-color: rgba(255, 149, 0, 0.3);
}

.task-status-badge.status-not-started {
  background: rgba(142, 142, 147, 0.1);
  color: #8e8e93;
  border-color: rgba(142, 142, 147, 0.3);
}

.task-status-badge.status-default {
  background: rgba(142, 142, 147, 0.1);
  color: #8e8e93;
  border-color: rgba(142, 142, 147, 0.3);
}
</style>
