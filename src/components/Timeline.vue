<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{
  xScale: d3.ScaleTime<number, number>;
  viewMode: 'day' | 'week' | 'month';
  width: number;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const height = 80; // 时间轴高度，与头部容器一致

const renderTimeline = () => {
  if (!svgRef.value) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove(); // 清空旧内容

  // 1. 直接使用传入的xScale
  const xScale = props.xScale;
  const domain = xScale.domain();

  // 2. 创建简化的单层时间轴，确保文本能正确显示
  let axis;
  let tickFormat;

  switch (props.viewMode) {
    case 'month':
      axis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat((d) => {
          const date = d as Date;
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          return `${year}年${month}月`;
        });
      break;
    case 'week':
      axis = d3.axisBottom(xScale)
        .ticks(d3.timeWeek.every(1))
        .tickFormat((d) => {
          const date = d as Date;
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}/${day}`;
        });
      break;
    default: // day
      const totalDays = d3.timeDay.count(domain[0], domain[1]);
      const dayInterval = Math.max(1, Math.ceil(totalDays / 15));
      
      axis = d3.axisBottom(xScale)
        .ticks(d3.timeDay.every(dayInterval))
        .tickFormat((d) => {
          const date = d as Date;
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}/${day}`;
        });
      break;
  }

  // 3. 绘制背景网格线
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0, ${height})`)
    .call(axis
      .tickSize(-height)
      .tickFormat(() => '')
    );

  // 4. 绘制主轴（确保文本在可见区域内）
  const axisGroup = svg.append('g')
    .attr('class', 'axis axis-main')
    .attr('transform', `translate(0, ${height - 20})`) // 给文本留更多空间
    .call(axis);
    
  // 确保文字样式正确应用
  axisGroup.selectAll('text')
    .style('font-size', '12px')
    .style('font-weight', '500')
    .style('text-anchor', 'middle')
    .style('fill', 'var(--text-primary)')
    .style('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif');

  // 5. 添加视图模式标识
  svg.append('text')
    .attr('class', 'view-mode-label')
    .attr('x', 20)
    .attr('y', 20)
    .style('font-size', '12px')
    .style('font-weight', '500')
    .style('fill', 'var(--primary)')
    .style('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif')
    .text(props.viewMode === 'day' ? '日视图' : props.viewMode === 'week' ? '周视图' : '月视图');

  // 6. 添加今天标记
  const today = new Date();
  if (today >= domain[0] && today <= domain[1]) {
    const todayX = xScale(today);
    svg.append('line')
      .attr('class', 'today-line')
      .attr('x1', todayX)
      .attr('x2', todayX)
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', 'var(--primary)')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '4,4');
    
    svg.append('text')
      .attr('class', 'today-label')
      .attr('x', todayX)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', 'var(--primary)')
      .text('今天');
  }
};

onMounted(renderTimeline);
watch(() => [props.xScale, props.viewMode], renderTimeline);
</script>

<template>
  <div class="timeline-container">
    <svg ref="svgRef" :width="props.width" :height="height"></svg>
  </div>
</template>

<style scoped>
.timeline-container {
  background: transparent;
  border-bottom: none;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  width: 100%;
}

/* 网格线样式 */
.timeline-container :deep(.grid .domain) {
  stroke: none;
}

.timeline-container :deep(.grid .tick line) {
  stroke: var(--border-secondary);
  stroke-width: 1;
  opacity: 0.5;
}

/* 主轴样式 */
.timeline-container :deep(.axis-main .domain) {
  stroke: var(--border-primary);
  stroke-width: 1;
}

.timeline-container :deep(.axis-main .tick line) {
  stroke: var(--border-primary);
  stroke-width: 1;
}

.timeline-container :deep(.axis-main .tick text) {
  fill: var(--text-primary) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif !important;
}

/* 视图模式标识 */
.timeline-container :deep(.view-mode-label) {
  fill: var(--primary);
  font-size: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}

/* 今天标记 */
.timeline-container :deep(.today-line) {
  stroke: var(--primary);
  stroke-width: 2;
  stroke-dasharray: 4,4;
  opacity: 0.8;
}

.timeline-container :deep(.today-label) {
  fill: var(--primary);
  font-size: 11px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif;
}
</style>
