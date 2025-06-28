import type { GanttTask } from '@/types';

const initialTasks: GanttTask[] = [
  // 蓝鲸持续集成平台的版本
  {
    id: 'version-bkci-3.0',
    text: '蓝鲸CI V3.0版本',
    start_date: '2025-01-01',
    end_date: '2025-06-30',
    progress: 0.75,
    type: 'version',
    isExpanded: true,
    creator: '张三',
    status: '进行中',
    project_name: '蓝鲸持续集成平台',
    department_name: 'TEG',
    url: 'https://devops.tencent.com/ms/bkci/versions/3.0', // 示例URL
    stats: { 
      total_issues: 89, 
      closed_issues: 67, 
      is_overdue: false, 
      overdue_days: 0, 
      total_requirements: 25, 
      closed_requirements: 20, 
      total_tasks: 45, 
      closed_tasks: 35, 
      total_defects: 19, 
      closed_defects: 12 
    },
    children: [
      {
        id: 'req-ci-001',
        text: '流水线性能优化需求',
        start_date: '2025-01-01',
        end_date: '2025-01-20',
        progress: 1.0,
        type: 'requirement',
        creator: '王五',
        status: '已完成',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 1, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'task-ci-001',
        text: '流水线缓存机制优化',
        start_date: '2025-01-05',
        end_date: '2025-01-25',
        progress: 1.0,
        type: 'task',
        dependencies: ['req-ci-001'],
        creator: '赵六',
        status: '已完成',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 1, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'task-ci-002',
        text: '构建历史查询优化',
        start_date: '2025-01-10',
        end_date: '2025-02-05',
        progress: 1.0,
        type: 'task',
        creator: '孙七',
        status: '已完成',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 1, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'defect-ci-001',
        text: '流水线超时问题修复',
        start_date: '2025-01-15',
        end_date: '2025-02-10',
        progress: 1.0,
        type: 'defect',
        creator: '周八',
        status: '已修复',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 1, closed_defects: 1 }
      },
      {
        id: 'req-ci-002',
        text: '插件市场设计需求',
        start_date: '2025-02-16',
        end_date: '2025-03-15',
        progress: 1.0,
        type: 'requirement',
        creator: '郑十',
        status: '已完成',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 1, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'task-ci-003',
        text: '插件SDK开发',
        start_date: '2025-03-01',
        end_date: '2025-04-15',
        progress: 0.9,
        type: 'task',
        dependencies: ['req-ci-002'],
        creator: '钱十一',
        status: '开发中',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      }
    ]
  },
  {
    id: 'version-bkci-4.0',
    text: '蓝鲸CI V4.0版本',
    start_date: '2025-07-01',
    end_date: '2025-12-31',
    progress: 0.15,
    type: 'version',
    isExpanded: true,
    creator: '黄十四',
    status: '规划中',
    project_name: '蓝鲸持续集成平台',
    department_name: 'TEG',
    stats: { 
      total_issues: 67, 
      closed_issues: 10, 
      is_overdue: false, 
      overdue_days: 0, 
      total_requirements: 20, 
      closed_requirements: 5, 
      total_tasks: 33, 
      closed_tasks: 5, 
      total_defects: 14, 
      closed_defects: 0 
    },
    children: [
      {
        id: 'req-ci-003',
        text: '容器化架构设计',
        start_date: '2025-07-01',
        end_date: '2025-08-15',
        progress: 0.3,
        type: 'requirement',
        creator: '何十五',
        status: '需求分析',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'req-ci-004',
        text: '微服务架构重构',
        start_date: '2025-10-01',
        end_date: '2025-11-30',
        progress: 0.05,
        type: 'requirement',
        creator: '罗十六',
        status: '未开始',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      }
    ]
  },
  // 蓝鲸持续集成平台的迭代
  {
    id: 'sprint-bkci-2025-01',
    text: '2025年1月迭代 - 流水线优化',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    progress: 1.0,
    type: 'sprint',
    isExpanded: true,
    creator: '李四',
    status: '已完成',
    project_name: '蓝鲸持续集成平台',
    department_name: 'TEG',
    stats: { 
      total_issues: 18, 
      closed_issues: 18, 
      is_overdue: false, 
      overdue_days: 0, 
      total_requirements: 5, 
      closed_requirements: 5, 
      total_tasks: 10, 
      closed_tasks: 10, 
      total_defects: 3, 
      closed_defects: 3 
    },
    children: [
      {
        id: 'task-sprint-001',
        text: '流水线执行优化',
        start_date: '2025-01-02',
        end_date: '2025-01-15',
        progress: 1.0,
        type: 'task',
        creator: '陈十二',
        status: '已完成',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 1, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'defect-sprint-001',
        text: '流水线并发问题修复',
        start_date: '2025-01-10',
        end_date: '2025-01-25',
        progress: 1.0,
        type: 'defect',
        creator: '林十三',
        status: '已修复',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 1, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 1, closed_defects: 1 }
      }
    ]
  },
  {
    id: 'sprint-bkci-2025-02',
    text: '2025年2月迭代 - 插件生态',
    start_date: '2025-02-01',
    end_date: '2025-02-28',
    progress: 0.8,
    type: 'sprint',
    isExpanded: true,
    creator: '吴九',
    status: '进行中',
    project_name: '蓝鲸持续集成平台',
    department_name: 'TEG',
    stats: { 
      total_issues: 22, 
      closed_issues: 18, 
      is_overdue: false, 
      overdue_days: 0, 
      total_requirements: 6, 
      closed_requirements: 5, 
      total_tasks: 12, 
      closed_tasks: 10, 
      total_defects: 4, 
      closed_defects: 3 
    },
    children: [
      {
        id: 'task-sprint-002',
        text: '插件商店开发',
        start_date: '2025-02-05',
        end_date: '2025-02-20',
        progress: 0.9,
        type: 'task',
        creator: '徐十七',
        status: '开发中',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'task-sprint-003',
        text: '插件审核机制',
        start_date: '2025-02-10',
        end_date: '2025-02-25',
        progress: 0.6,
        type: 'task',
        creator: '韩十八',
        status: '开发中',
        project_name: '蓝鲸持续集成平台',
        department_name: 'TEG',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 0, closed_requirements: 0, total_tasks: 1, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      }
    ]
  },
  // 蓝鲸支付平台的版本
  {
    id: 'version-bkpay-1.0',
    text: '蓝鲸支付 V1.0版本',
    start_date: '2025-03-01',
    end_date: '2025-08-31',
    progress: 0.25,
    type: 'version',
    isExpanded: true,
    creator: '邓十九',
    status: '进行中',
    project_name: '蓝鲸支付平台',
    department_name: 'FinTech',
    stats: { 
      total_issues: 52, 
      closed_issues: 18, 
      is_overdue: true, 
      overdue_days: 5, 
      total_requirements: 18, 
      closed_requirements: 7, 
      total_tasks: 24, 
      closed_tasks: 9, 
      total_defects: 10, 
      closed_defects: 2 
    },
    children: [
      {
        id: 'req-pay-001',
        text: '支付核心架构设计',
        start_date: '2025-03-01',
        end_date: '2025-04-15',
        progress: 0.8,
        type: 'requirement',
        creator: '许二十',
        status: '设计中',
        project_name: '蓝鲸支付平台',
        department_name: 'FinTech',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      },
      {
        id: 'req-pay-002',
        text: '风控系统设计',
        start_date: '2025-05-01',
        end_date: '2025-06-30',
        progress: 0.3,
        type: 'requirement',
        creator: '曾二十一',
        status: '需求分析',
        project_name: '蓝鲸支付平台',
        department_name: 'FinTech',
        stats: { total_issues: 1, closed_issues: 0, is_overdue: false, overdue_days: 0, total_requirements: 1, closed_requirements: 0, total_tasks: 0, closed_tasks: 0, total_defects: 0, closed_defects: 0 }
      }
    ]
  },
  // 蓝鲸支付平台的迭代
  {
    id: 'sprint-bkpay-2025-03',
    text: '2025年3月迭代 - 支付核心',
    start_date: '2025-03-01',
    end_date: '2025-03-31',
    progress: 0.85,
    type: 'sprint',
    isExpanded: false,
    creator: '肖二十二',
    status: '测试中',
    project_name: '蓝鲸支付平台',
    department_name: 'FinTech',
    stats: { 
      total_issues: 16, 
      closed_issues: 14, 
      is_overdue: true, 
      overdue_days: 2, 
      total_requirements: 4, 
      closed_requirements: 4, 
      total_tasks: 8, 
      closed_tasks: 7, 
      total_defects: 4, 
      closed_defects: 3 
    }
  },
  {
    id: 'sprint-bkpay-2025-04',
    text: '2025年4月迭代 - 账户体系',
    start_date: '2025-04-01',
    end_date: '2025-04-30',
    progress: 0.4,
    type: 'sprint',
    isExpanded: false,
    creator: '金二十三',
    status: '开发中',
    project_name: '蓝鲸支付平台',
    department_name: 'FinTech',
    stats: { 
      total_issues: 20, 
      closed_issues: 8, 
      is_overdue: false, 
      overdue_days: 0, 
      total_requirements: 6, 
      closed_requirements: 3, 
      total_tasks: 10, 
      closed_tasks: 4, 
      total_defects: 4, 
      closed_defects: 1 
    }
  }
];

export const fetchGanttData = (): Promise<GanttTask[]> => {
  return new Promise(resolve => {
    // Simulate network delay
    setTimeout(() => {
      const tasks = JSON.parse(JSON.stringify(initialTasks));
      resolve(tasks);
    }, 800);
  });
};