<script setup lang="ts">
import { ref } from 'vue';

// 颜色图例数据
const legendItems = [
  { type: 'version', color: '#007AFF', label: '版本' },
  { type: 'sprint', color: '#34C759', label: '迭代' },
  { type: 'requirement', color: 'rgb(0, 65, 109)', label: '需求' },
  { type: 'defect', color: 'rgb(245, 20, 85)', label: '缺陷' },
  { type: 'task', color: 'rgb(0, 160, 255)', label: '任务' },
  { type: 'other', color: 'rgb(156, 0, 99)', label: '其他子类' }
];

// 控制弹出层显示
const showLegend = ref(false);

const toggleLegend = () => {
  showLegend.value = !showLegend.value;
};

const closeLegend = () => {
  showLegend.value = false;
};
</script>

<template>
  <div class="color-legend-container">
    <!-- 触发按钮 -->
    <button 
      @click="toggleLegend"
      class="legend-trigger-btn"
      title="查看颜色说明"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="8" cy="5" r="1" fill="currentColor"/>
        <path d="M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>颜色说明</span>
    </button>

    <!-- 弹出层背景遮罩 -->
    <div 
      v-if="showLegend" 
      class="legend-overlay"
      @click="closeLegend"
    ></div>

    <!-- 弹出的颜色图例 -->
    <div v-if="showLegend" class="color-legend-popup">
      <div class="legend-header">
        <h3 class="legend-title">工作项类型说明</h3>
        <button @click="closeLegend" class="close-btn">✕</button>
      </div>
      <div class="legend-items">
        <div 
          v-for="item in legendItems" 
          :key="item.type"
          class="legend-item"
        >
          <div 
            class="color-sample"
            :style="{ backgroundColor: item.color }"
          ></div>
          <span class="type-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-legend-container {
  position: relative;
}

/* 触发按钮样式 */
.legend-trigger-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.legend-trigger-btn:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.legend-trigger-btn svg {
  opacity: 0.7;
}

/* 遮罩层 */
.legend-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 999;
  backdrop-filter: blur(2px);
}

/* 弹出的图例面板 */
.color-legend-popup {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 200px;
  z-index: 1000;
  animation: legendFadeIn 0.2s ease-out;
}

@keyframes legendFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.legend-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.color-sample {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.type-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}
</style>