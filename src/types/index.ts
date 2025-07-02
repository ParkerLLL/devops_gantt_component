/**
 * 甘特图中的核心任务对象，代表一个"版本"或"迭代"
 */
export interface GanttTask {
  id: string;
  text: string;
  start_date: string;
  end_date: string;
  progress: number;
<<<<<<< HEAD
  type: 'version' | 'sprint' | 'task' | 'requirement' | 'defect' | 'milestone';
=======
  type: 'version' | 'sprint' | 'task' | 'requirement' | 'defect';
>>>>>>> master
  isExpanded?: boolean;
  children?: GanttTask[];
  dependencies?: string[];
  
  // --- 业务展示字段 ---
  status: string;
  creator: string;
  project_name: string;
  department_name: string;
  stats: {
    total_issues: number;
    closed_issues: number;
    is_overdue: boolean;
    overdue_days: number;
    total_requirements: number;
    closed_requirements: number;
    total_tasks: number;
    closed_tasks: number;
    total_defects: number;
    closed_defects: number;
  };

  // --- 可选字段 ---
  actual_start?: string;
  actual_end?: string;
  url?: string;
<<<<<<< HEAD
=======
  
  // --- 版本简述信息 ---
  summary?: {
    description?: string;        // 版本描述
    goals?: string[];           // 主要目标
    features?: string[];        // 核心特性
    risks?: string[];           // 风险点
    stakeholders?: string[];    // 相关干系人
    notes?: string;             // 备注信息
  };
>>>>>>> master
}
export interface Dependency {
  id: string;          // 依赖关系的唯一ID
  source: string;      // 来源任务ID (GanttTask.id)
  target: string;      // 目标任务ID (GanttTask.id)
  type: 'FS' | 'SS' | 'FF' | 'SF'; // 依赖类型
}
