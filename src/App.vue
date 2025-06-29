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
/* 苹果官网风格色彩系统 */
:root {
  --primary: #007AFF;
  --primary-hover: #005FCC;
  --secondary: #5856D6;
  --accent: #FF9500;
  --success: #34C759;
  --warning: #FF9500;
  --error: #FF3B30;
  
  --bg-primary: #FBFBFD;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #F2F2F7;
  --bg-quaternary: #E5E5EA;
  
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --text-tertiary: #AEAEB2;
  --text-link: #007AFF;
  
  --border-primary: #D2D2D7;
  --border-secondary: #E5E5EA;
  --border-tertiary: #F2F2F7;
  
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-bg-dark: rgba(0, 0, 0, 0.04);
  --glass-border: rgba(0, 0, 0, 0.04);
  
  --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-heavy: 0 8px 24px rgba(0, 0, 0, 0.15);
  
  --radius-small: 8px;
  --radius-medium: 12px;
  --radius-large: 16px;
  --radius-xl: 20px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: 
    radial-gradient(ellipse at top, rgba(0, 122, 255, 0.05) 0%, transparent 50%),
    linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%);
  min-height: 100vh;
  color: var(--text-primary);
  line-height: 1.47059;
  font-size: 17px;
  letter-spacing: -0.022em;
}

header {
  padding: 1rem 2rem 0.5rem;
  text-align: left;
  position: relative;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-secondary);
}

header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.003em;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

header h1::before {
  content: '📊';
  font-size: 20px;
  -webkit-text-fill-color: initial;
}

header::after {
  content: '项目管理甘特图';
  display: block;
  font-size: 13px;
  line-height: 1.3;
  font-weight: 400;
  color: var(--text-secondary);
  margin-top: 2px;
  letter-spacing: 0.011em;
}

main {
  padding: 0;
  max-width: none;
  margin: 0;
  height: calc(100vh - 80px);
}
</style>
