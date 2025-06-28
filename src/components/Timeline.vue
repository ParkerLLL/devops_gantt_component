<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{
  xScale: d3.ScaleTime<number, number>;
  viewMode: 'day' | 'week' | 'month';
  width: number;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const height = 60; // 时间轴高度

const renderTimeline = () => {
  if (!svgRef.value) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove(); // 清空旧内容

  // 1. 直接使用传入的xScale
  const xScale = props.xScale;

  // 2. 创建坐标轴
  let axisTop, axisBottom;

  switch (props.viewMode) {
    case 'month':
      axisTop = d3.axisTop(xScale)
        .ticks(d3.timeYear.every(1))
        .tickFormat((d) => d3.timeFormat('%Y年')(d as Date));
      axisBottom = d3.axisTop(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat((d) => d3.timeFormat('%m月')(d as Date));
      break;
    case 'week':
      axisTop = d3.axisTop(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat((d) => d3.timeFormat('%Y年%m月')(d as Date));
      axisBottom = d3.axisTop(xScale)
        .ticks(d3.timeWeek.every(1))
        .tickFormat((d) => `W${d3.timeFormat('%U')(d as Date)}`); // 第U周
      break;
    default: // day
      axisTop = d3.axisTop(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat((d) => d3.timeFormat('%Y年%m月')(d as Date));
      axisBottom = d3.axisTop(xScale)
        .ticks(d3.timeDay.every(1))
        .tickFormat((d) => d3.timeFormat('%d')(d as Date));
      break;
  }

  // 3. 绘制
  svg.append('g')
    .attr('class', 'axis axis-top')
    .attr('transform', `translate(0, ${height / 2})`)
    .call(axisTop)
    .selectAll('text')
    .attr('y', -5);

  svg.append('g')
    .attr('class', 'axis axis-bottom')
    .attr('transform', `translate(0, ${height})`)
    .call(axisBottom);
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
  background-color: #fafbfc;
  border-bottom: 1px solid #dfe1e6;
  overflow-x: auto;
}

.timeline-container :deep(.axis .domain) {
  stroke: #c1c7d0; /* 更清晰的轴线颜色 */
}

.timeline-container :deep(.axis .tick line) {
  stroke: #c1c7d0; /* 更清晰的刻度线颜色 */
  stroke-dasharray: 2, 2; /* 虚线样式 */
}

.timeline-container :deep(.axis .tick text) {
  fill: #42526e; /* 更深的文字颜色 */
  font-size: 12px;
}

.timeline-container :deep(.axis-top .tick text) {
  font-weight: 600; /* 顶部文字加粗 */
  transform: translateY(2px);
}

.timeline-container :deep(.axis-bottom .tick text) {
  transform: translateY(4px);
}
</style>
