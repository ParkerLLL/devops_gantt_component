<script setup lang="ts">
import GanttChart from './components/GanttChart.vue'
</script>

<template>
  <header>
    <h1>蓝鲸研发管理甘特图</h1>
  </header>

  <main>
    <GanttChart />
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f4f5f7;
}

header {
  padding: 1rem 2rem;
  background-color: #fff;
  border-bottom: 1px solid #dfe1e6;
}

main {
  padding: 2rem;
}
</style>
