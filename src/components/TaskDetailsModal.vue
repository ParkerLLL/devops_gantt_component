<script setup lang="ts">
import { watch, computed } from 'vue';
import type { GanttTask } from '@/types';

const props = defineProps<{
  task: GanttTask | null;
  visible: boolean;
}>();

const emit = defineEmits(['close']);

// 移除调试代码
// watch(() => props.visible, (newVal) => { ... }); // 已移除
// watch(() => props.task, (newVal) => { ... }); // 已移除

const closeModal = () => {
  emit('close');
};

// 获取任务类型的显示名称
const getTaskTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    'version': '版本',
    'sprint': '迭代',
    'requirement': '需求',
    'task': '任务', 
    'defect': '缺陷'
  };
  return typeMap[type] || type;
};

// 获取任务状态的颜色
const getStatusColor = (status: string) => {
  if (status.includes('完成') || status.includes('已修复')) return 'var(--success)';
  if (status.includes('进行中') || status.includes('开发中') || status.includes('测试中')) return 'var(--primary-blue)';
  if (status.includes('延期') || status.includes('过期')) return 'var(--error)';
  if (status.includes('规划') || status.includes('分析') || status.includes('设计')) return 'var(--warning)';
  return 'var(--text-secondary)';
};

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 格式化统计数字，确保显示正确
const formatStatNumber = (num: any) => {
  // 处理可能的字符串和数字转换问题
  const parsed = typeof num === 'string' ? parseInt(num, 10) : num;
  return isNaN(parsed) ? 0 : parsed;
};

// 格式化统计显示
const formatStatDisplay = (closed: any, total: any) => {
  const closedNum = formatStatNumber(closed);
  const totalNum = formatStatNumber(total);
  return `${closedNum}/${totalNum}`;
};

// 安全的进度百分比计算
const safeProgressPercent = computed(() => {
  if (!props.task) return 0;
  const progress = props.task.progress;
  // 如果进度已经是百分比格式（>1），直接使用
  if (progress > 1) {
    return Math.round(progress);
  }
  // 如果是小数格式（0-1），转换为百分比
  return Math.round(progress * 100);
});

// 打开任务链接
const openTaskUrl = () => {
  if (props.task?.url) {
    window.open(props.task.url, '_blank', 'noopener,noreferrer');
  }
};
</script>

<template>
  <Transition name="modal">
    <div v-if="visible && task" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <!-- iOS风格的顶部导航栏 -->
        <div class="modal-nav">
          <button @click="closeModal" class="nav-btn nav-btn-left">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            返回
          </button>
          <h1 class="nav-title">详情</h1>
          <button v-if="task.url" @click="openTaskUrl" class="nav-btn nav-btn-right">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7 9L12 4M12 4H8M12 4V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13 9V13C13 13.5304 12.7893 14.0391 12.4142 14.4142C12.0391 14.7893 11.5304 15 11 15H3C2.46957 15 1.96086 14.7893 1.58579 14.4142C1.21071 14.0391 1 13.5304 1 13V5C1 4.46957 1.21071 3.96086 1.58579 3.58579C1.96086 3.21071 2.46957 3 3 3H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            查看
          </button>
          <div v-else class="nav-btn-placeholder"></div>
        </div>

        <!-- 主要内容区域 -->
        <div class="modal-body">
          <!-- 头部信息卡片 -->
          <div class="info-card header-card">
            <div class="task-icon" :class="`task-icon-${task.type}`">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <polyline points="9,11 12,14 22,4" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="task-header-info">
              <h2 class="task-title">{{ task.text }}</h2>
              <div class="task-meta">
                <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
                <span class="task-progress">{{ safeProgressPercent }}% 完成</span>
              </div>
            </div>
            <div class="task-status" :style="{ color: getStatusColor(task.status) }">
              {{ task.status }}
            </div>
          </div>


          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">完成进度</span>
              <span class="progress-value">{{ safeProgressPercent }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: safeProgressPercent + '%' }"></div>
            </div>
          </div>

          <!-- 详细信息列表 -->
          <div class="info-sections">
            <!-- 基本信息 -->
            <div class="info-section">
              <h3 class="section-title">基本信息</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">创建人</span>
                  <span class="info-value">{{ task.creator || '未设置' }}</span>
                  <!-- 调试信息：{{ JSON.stringify({ creator: task.creator, hasCreator: !!task.creator }) }} -->
                </div>
                <div class="info-item">
                  <span class="info-label">所属项目</span>
                  <span class="info-value">{{ task.project_name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">所属部门</span>
                  <span class="info-value">{{ task.department_name }}</span>
                </div>
              </div>
            </div>

            <!-- 时间信息 -->
            <div class="info-section">
              <h3 class="section-title">时间安排</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">开始日期</span>
                  <span class="info-value">{{ formatDate(task.start_date) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">结束日期</span>
                  <span class="info-value">{{ formatDate(task.end_date) }}</span>
                </div>
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="info-section" style="grid-column: 1 / -1;">
              <h3 class="section-title">工作项统计</h3>
              <div class="stats-inline">
                <span class="stat-item">
                  <strong>需求:</strong> {{ formatStatDisplay(task.stats.closed_requirements, task.stats.total_requirements) }}
                </span>
                <span class="stat-item">
                  <strong>任务:</strong> {{ formatStatDisplay(task.stats.closed_tasks, task.stats.total_tasks) }}
                </span>
                <span class="stat-item">
                  <strong>缺陷:</strong> {{ formatStatDisplay(task.stats.closed_defects, task.stats.total_defects) }}
                </span>
              </div>
            </div>

            <!-- 依赖关系 -->
            <div v-if="task.dependencies && task.dependencies.length > 0" class="info-section">
              <h3 class="section-title">依赖关系</h3>
              <div class="dependency-list">
                <div v-for="dep in task.dependencies" :key="dep" class="dependency-item">
                  <div class="dependency-icon">→</div>
                  <span class="dependency-text">{{ dep }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 动画效果 */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(20px);
}

/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

/* 主容器 */
.modal-content {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
}

/* 现代导航栏 */
.modal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.6);
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 90px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Helvetica, Arial, sans-serif;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(148, 163, 184, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.15);
}

.nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.nav-btn:hover::before {
  left: 100%;
}

.nav-btn-left {
  justify-content: flex-start;
}

.nav-btn-right {
  justify-content: flex-end;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.25);
}

.nav-btn-right:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(59, 130, 246, 0.4);
}

.nav-btn-placeholder {
  min-width: 80px;
}

.nav-title {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-align: center;
  letter-spacing: -0.02em;
}

/* 主体内容 */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  display: block;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
}

/* 信息卡片 */
.info-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  margin: 0 0 20px 0;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 25px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.5);
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
}

.header-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.task-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.2);
}

.task-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), transparent);
}

.task-icon-version { background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-light)); color: white; }
.task-icon-sprint { background: linear-gradient(135deg, var(--accent-blue), var(--tech-blue)); color: white; }
.task-icon-requirement { background: linear-gradient(135deg, var(--tech-blue), var(--primary-blue-light)); color: white; }
.task-icon-task { background: linear-gradient(135deg, var(--primary-blue-light), var(--accent-blue)); color: white; }
.task-icon-defect { background: linear-gradient(135deg, var(--error), #ff6b6b); color: white; }

.task-header-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.task-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-type {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px -2px rgba(59, 130, 246, 0.3);
}

.task-progress {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.task-status {
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

/* 版本简述部分 */
.summary-section {
  margin: 0;
  padding: 24px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  grid-column: 1 / -1;
  margin-bottom: 24px;
}

.summary-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
}

.summary-placeholder {
  padding: 20px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 2px dashed var(--border-secondary);
}

.summary-placeholder p {
  margin: 0;
  color: var(--text-secondary);
  font-style: italic;
}

/* 进度条部分 */
.progress-section {
  margin: 0 0 20px 0;
  padding: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 25px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.5);
  position: relative;
  overflow: hidden;
}

.progress-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.3), transparent);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-weight: 600;
  color: var(--text-primary);
}

.progress-value {
  font-weight: 700;
  color: var(--primary-blue);
  font-size: 16px;
}

.progress-bar {
  height: 10px;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%);
  border-radius: 12px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 信息部分 */
.info-sections {
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-section {
  margin-bottom: 0;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 25px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.5);
  height: fit-content;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.info-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 35px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5);
}

.info-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
  padding: 0;
  letter-spacing: -0.01em;
}

.info-list {
  background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  overflow: hidden;
  margin-top: 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.4);
  transition: background-color 0.2s ease;
}

.info-item:hover {
  background: rgba(255, 255, 255, 0.5);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #64748b;
  min-width: 90px;
  font-size: 14px;
}

.info-value {
  font-weight: 700;
  color: #1e293b;
  text-align: right;
  font-size: 14px;
}


/* 统计信息行内显示 */
.stats-inline {
  display: flex;
  gap: 24px;
  background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.stat-item {
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
}

.stat-item strong {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-right: 6px;
  font-weight: 700;
}

/* 依赖关系 */
.dependency-list {
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-top: 12px;
}

.dependency-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

.dependency-item:last-child {
  border-bottom: none;
}

.dependency-icon {
  color: var(--primary-blue);
  font-weight: 600;
  margin-right: 12px;
}

.dependency-text {
  color: var(--text-primary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    margin: 20px;
  }
  
  .modal-body {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-value {
    text-align: left;
  }
  
  .header-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>