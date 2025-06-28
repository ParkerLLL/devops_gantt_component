import type { GanttTask } from '@/types';

const initialTasks: GanttTask[] = [
  {
    id: 'version-1.0',
    text: '版本 1.0',
    start_date: '2025-06-25',
    end_date: '2025-08-15',
    progress: 0.4,
    type: 'version',
    isExpanded: true,
    creator: '张三',
    status: '进行中',
    project_name: '蓝鲸 DevOps',
    department_name: 'TEG',
    stats: { total_issues: 10, closed_issues: 4, is_overdue: false, overdue_days: 0, total_requirements: 5, closed_requirements: 2, total_tasks: 3, closed_tasks: 1, total_defects: 2, closed_defects: 1 },
    children: [
       {
        id: 'work-item-101',
        text: '登录模块后端重构',
        start_date: '2025-07-01',
        end_date: '2025-07-15',
        progress: 1,
        type: 'task',
        creator: '李四',
        status: '已完成',
        project_name: '蓝鲸 DevOps',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 1, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'work-item-102',
        text: '个人中心页面设计',
        start_date: '2025-07-16',
        end_date: '2025-07-30',
        progress: 0.5,
        dependencies: ['work-item-101'],
        type: 'requirement',
        creator: '王五',
        status: '设计中',
        project_name: '蓝鲸 DevOps',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'milestone-1',
        text: '1.0版本发布',
        start_date: '2025-08-15',
        end_date: '2025-08-15',
        progress: 0,
        type: 'milestone',
        creator: '张三',
        status: '未开始',
        project_name: '蓝鲸 DevOps',
        department_name: 'TEG',
        stats: { total_issues: 0, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      }
    ]
  },
  {
    id: 'sprint-1.1',
    text: '迭代 1.1',
    start_date: '2025-07-01',
    end_date: '2025-07-30',
    progress: 0.6,
    type: 'sprint',
    isExpanded: true,
    creator: '赵六',
    status: '已延期',
    project_name: '蓝鲸 DevOps',
    department_name: 'TEG',
    stats: { total_issues: 8, closed_issues: 5, is_overdue: true, overdue_days: 2, total_requirements: 4, closed_requirements: 3, total_tasks: 2, closed_tasks: 1, total_defects: 2, closed_defects: 1 }
  }
];

export const fetchGanttData = (): Promise<GanttTask[]> => {
  return new Promise(resolve => {
    // Simulate network delay
    setTimeout(() => {
      const tasks = JSON.parse(JSON.stringify(initialTasks));
      // Generate a large number of tasks for performance testing
      const additionalTasks: GanttTask[] = [];
      for (let i = 0; i < 500; i++) {
        const startDate = new Date(2025, 6, 1 + i % 30);
        const endDate = new Date(startDate.getTime() + (5 + Math.random() * 10) * 24 * 60 * 60 * 1000);
        additionalTasks.push({
          id: `perf-task-${i}`,
          text: `性能测试任务 ${i + 1}`,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          progress: Math.random(),
          type: 'task',
          creator: `测试员 ${i % 5 + 1}`,
          status: i % 4 === 0 ? '待处理' : '进行中',
          project_name: '性能测试',
          department_name: '测试部',
          stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 1, total_defects: 0, closed_defects: 0 },
        });
      }
      tasks.push(...additionalTasks);
      resolve(tasks);
    }, 500);
  });
};
