<script setup lang="ts">
import type { GanttTask } from '@/types';

const props = defineProps<{
  task: GanttTask | null;
  visible: boolean;
}>();

const emit = defineEmits(['close']);

const closeModal = () => {
  emit('close');
};
<<<<<<< HEAD
</script>

<template>
  <div v-if="visible && task" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>任务详情: {{ task.text }}</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>ID:</strong> {{ task.id }}</p>
        <p><strong>状态:</strong> {{ task.status }}</p>
        <p><strong>创建人:</strong> {{ task.creator }}</p>
        <p><strong>开始日期:</strong> {{ task.start_date }}</p>
        <p><strong>结束日期:</strong> {{ task.end_date }}</p>
        <p><strong>进度:</strong> {{ (task.progress * 100).toFixed(0) }}%</p>
        <p><strong>所属项目:</strong> {{ task.project_name }}</p>
        <p><strong>所属部门:</strong> {{ task.department_name }}</p>
        <div v-if="task.dependencies && task.dependencies.length > 0">
          <strong>依赖于:</strong>
          <ul>
            <li v-for="dep in task.dependencies" :key="dep">{{ dep }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
=======

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
                <span class="task-progress">{{ (task.progress * 100).toFixed(0) }}% 完成</span>
              </div>
            </div>
            <div class="task-status" :style="{ color: getStatusColor(task.status) }">
              {{ task.status }}
            </div>
          </div>

          <!-- 版本/迭代简述 -->
          <div v-if="task.type === 'version' || task.type === 'sprint'" class="summary-section">
            <h3 class="section-title">
              📋 {{ task.type === 'version' ? '版本' : '迭代' }}简述
            </h3>
            <div class="summary-placeholder">
              <p>{{ task.type === 'version' ? '版本' : '迭代' }}简述信息将在后续数据中提供</p>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">完成进度</span>
              <span class="progress-value">{{ (task.progress * 100).toFixed(0) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (task.progress * 100) + '%' }"></div>
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
                  <span class="info-value">{{ task.creator }}</span>
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
            <div class="info-section">
              <h3 class="section-title">工作项统计</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">{{ task.stats.closed_requirements }}/{{ task.stats.total_requirements }}</div>
                  <div class="stat-label">需求</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ task.stats.closed_tasks }}/{{ task.stats.total_tasks }}</div>
                  <div class="stat-label">任务</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{ task.stats.closed_defects }}/{{ task.stats.total_defects }}</div>
                  <div class="stat-label">缺陷</div>
                </div>
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
>>>>>>> master
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
<<<<<<< HEAD
  background-color: rgba(0, 0, 0, 0.6);
=======
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
>>>>>>> master
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
<<<<<<< HEAD
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #aaa;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #333;
}

.modal-body p {
  margin: 10px 0;
}

.modal-body ul {
  padding-left: 20px;
}
</style>
=======
  padding: 20px;
}

/* 主容器 */
.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-heavy);
  border: 1px solid var(--border-tertiary);
  display: flex;
  flex-direction: column;
}

/* iOS风格导航栏 */
.modal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 8px;
  background: var(--primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-small);
  transition: all 0.2s ease;
  min-width: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-btn-left {
  justify-content: flex-start;
}

.nav-btn-right {
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
}

.nav-btn-right:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.nav-btn-placeholder {
  min-width: 60px;
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-align: center;
}

/* 主体内容 */
.modal-body {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

/* 信息卡片 */
.info-card {
  background: var(--bg-secondary);
  margin: 16px;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-light);
}

.header-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.task-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-type {
  background: var(--primary-blue);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.task-progress {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.task-status {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
}

/* 版本简述部分 */
.summary-section {
  margin: 16px;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-secondary);
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
  margin: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-light);
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
  height: 8px;
  background: var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), var(--tech-blue));
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 信息部分 */
.info-sections {
  padding: 0 16px 20px;
}

.info-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  padding: 0 4px;
}

.info-list {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 80px;
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid var(--border-light);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 依赖关系 */
.dependency-list {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  overflow: hidden;
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
@media (max-width: 480px) {
  .modal-content {
    margin: 0;
    border-radius: 16px 16px 0 0;
    max-height: 95vh;
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
}
</style>
>>>>>>> master
