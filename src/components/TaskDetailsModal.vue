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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
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
