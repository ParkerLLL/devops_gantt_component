<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';

const props = defineProps<{
  xScale: d3.ScaleTime<number, number>;
  viewMode: 'day' | 'week' | 'month';
  width: number;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const height = 80; // 匹配甘特图头部高度

const renderTimeline = () => {
  if (!svgRef.value) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove(); // 清空旧内容

  // 1. 直接使用传入的xScale
  const xScale = props.xScale;
  const domain = xScale.domain();
  
  console.log('Timeline rendering with:', {
    viewMode: props.viewMode,
    domain: domain,
    width: props.width,
    xScaleRange: xScale.range()
  });

  // 2. 手动创建刻度而不依赖D3的自动轴生成
  let tickValues: Date[] = [];
  let formatFunction: (d: Date) => string;

  // 根据视图模式和容器宽度生成合适间距的刻度
  const minSpacing = 80; // 最小间距80px
  const maxTicks = Math.floor(props.width / minSpacing);
  
  switch (props.viewMode) {
    case 'month':
      // 按月份生成刻度
      const monthStart = new Date(domain[0].getFullYear(), domain[0].getMonth(), 1);
      const monthEnd = new Date(domain[1].getFullYear(), domain[1].getMonth() + 1, 0);
      const allMonths = d3.timeMonth.range(monthStart, monthEnd);
      // 根据容器宽度动态调整显示的月份数量
      const monthStep = Math.max(1, Math.ceil(allMonths.length / Math.min(maxTicks, 6)));
      tickValues = allMonths.filter((_, i) => i % monthStep === 0);
      formatFunction = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月`;
      break;
    case 'week':
      // 按周生成刻度，显示为日期，每3-4天一个刻度
      const weekStart = new Date(domain[0]);
      const weekEnd = new Date(domain[1]);
      const weekDayInterval = Math.max(2, Math.ceil((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24) / maxTicks));
      tickValues = d3.timeDay.every(weekDayInterval)?.range(weekStart, weekEnd) || [];
      formatFunction = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
      break;
    default: // day
      // 按天生成刻度，根据时间范围动态调整间隔
      const dayStart = new Date(domain[0]);
      const dayEnd = new Date(domain[1]);
      const totalDays = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24);
      const dayInterval = Math.max(1, Math.ceil(totalDays / Math.min(maxTicks, 15))); // 限制最多15个刻度
      const allDayTicks = d3.timeDay.every(dayInterval)?.range(dayStart, dayEnd) || [];
      // 确保日期格式正确，避免跨月显示问题
      tickValues = allDayTicks.filter(d => d >= dayStart && d <= dayEnd);
      formatFunction = (d: Date) => {
        const day = d.getDate();
        const month = d.getMonth() + 1;
        // 如果是月初或者跨月，显示月/日，否则只显示日
        if (day === 1 || (tickValues.length > 0 && d.getMonth() !== tickValues[0].getMonth())) {
          return `${month}/${day}`;
        }
        return `${day}日`;
      };
      break;
  }

  console.log('Generated tick values:', tickValues.map(d => ({ date: d, formatted: formatFunction(d) })));

  // 3. 绘制网格线
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0, ${height})`)
    .selectAll('line')
    .data(tickValues)
    .enter()
    .append('line')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d))
    .attr('y1', 0)
    .attr('y2', -height)
    .style('stroke', '#E5E5EA')
    .style('stroke-width', 1)
    .style('opacity', 0.5);

  // 4. 绘制主轴线
  svg.append('line')
    .attr('class', 'domain')
    .attr('x1', 0)
    .attr('x2', props.width)
    .attr('y1', 30)
    .attr('y2', 30)
    .style('stroke', '#D2D2D7')
    .style('stroke-width', 1);

  // 5. 手动绘制刻度线和文本
  const tickGroup = svg.append('g')
    .attr('class', 'ticks');

  tickValues.forEach(tickValue => {
    const x = xScale(tickValue);
    
    // 绘制刻度线
    tickGroup.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', 30)
      .attr('y2', 36)
      .style('stroke', '#D2D2D7')
      .style('stroke-width', 1);
    
    // 绘制文本标签 - 位置调整到避免被滚动条遮挡
    tickGroup.append('text')
      .attr('x', x)
      .attr('y', 55) // 调整到合适位置，避免滚动条遮挡
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#1D1D1F')
      .style('font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", Helvetica, Arial, sans-serif')
      .text(formatFunction(tickValue));
  });
  
  console.log(`手动渲染了 ${tickValues.length} 个时间刻度`);

  // 5. 添加视图模式标识
  svg.append('text')
    .attr('class', 'view-mode-label')
    .attr('x', 20)
    .attr('y', 20)
    .style('font-size', '12px')
    .style('font-weight', '500')
    .style('fill', '#007AFF')
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
      .style('stroke', '#007AFF')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '4,4');
    
    svg.append('text')
      .attr('class', 'today-label')
      .attr('x', todayX)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#007AFF')
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
  overflow: visible; /* 让时间轴文本完全可见 */
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 10; /* 确保时间轴在上层 */
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
  fill: #1D1D1F !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Helvetica, Arial, sans-serif !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  text-anchor: middle !important;
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
