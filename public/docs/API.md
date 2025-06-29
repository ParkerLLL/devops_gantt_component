# 甘特图组件后端API接口文档

本文档定义了甘特图组件所需的后端接口规范，包含了所有必要的数据结构和接口定义。

## 目录
- [数据结构定义](#数据结构定义)
- [API接口列表](#api接口列表)
- [接口详细说明](#接口详细说明)
- [错误码说明](#错误码说明)
- [示例代码](#示例代码)

## 数据结构定义

### GanttTask 任务对象

```typescript
interface GanttTask {
  id: string;                    // 任务唯一标识
  text: string;                  // 任务名称
  start_date: string;            // 开始日期 (YYYY-MM-DD)
  end_date: string;              // 结束日期 (YYYY-MM-DD)
  progress: number;              // 进度 (0.0-1.0)
  type: 'version' | 'sprint' | 'task' | 'requirement' | 'defect'; // 任务类型
  isExpanded?: boolean;          // 是否展开 (前端状态，可选)
  children?: GanttTask[];        // 子任务数组
  dependencies?: string[];       // 依赖任务ID数组
  
  // 业务展示字段
  status: string;                // 任务状态
  creator: string;               // 创建人
  project_name: string;          // 项目名称
  department_name: string;       // 部门名称
  
  // 统计信息
  stats: {
    total_issues: number;        // 总工作项数
    closed_issues: number;       // 已关闭工作项数
    is_overdue: boolean;         // 是否逾期
    overdue_days: number;        // 逾期天数
    total_requirements: number;   // 总需求数
    closed_requirements: number;  // 已关闭需求数
    total_tasks: number;         // 总任务数
    closed_tasks: number;        // 已完成任务数
    total_defects: number;       // 总缺陷数
    closed_defects: number;      // 已修复缺陷数
  };
  
  // 可选字段
  actual_start?: string;         // 实际开始日期
  actual_end?: string;           // 实际结束日期
  url?: string;                  // 任务详情链接
}
```

### ApiResponse 通用响应格式

```typescript
interface ApiResponse<T> {
  code: number;                  // 状态码 (0表示成功)
  message: string;               // 响应消息
  data: T;                       // 响应数据
  timestamp: number;             // 时间戳
}
```

### FilterOptions 筛选选项

```typescript
interface FilterOptions {
  departments: string[];         // 可选部门列表
  projects: string[];           // 可选项目列表
  types: string[];              // 可选类型列表
  creators: string[];           // 可选创建人列表
}
```

## API接口列表

| 接口名称 | 方法 | 路径 | 描述 |
|---------|------|------|------|
| 获取甘特图数据 | GET | `/api/gantt/tasks` | 获取所有任务数据 |
| 获取筛选选项 | GET | `/api/gantt/filters` | 获取筛选器可选项 |
| 更新任务进度 | PUT | `/api/gantt/tasks/{id}/progress` | 更新任务进度 |
| 更新任务时间 | PUT | `/api/gantt/tasks/{id}/schedule` | 更新任务时间安排 |
| 获取任务详情 | GET | `/api/gantt/tasks/{id}` | 获取单个任务详情 |
| 创建任务 | POST | `/api/gantt/tasks` | 创建新任务 |
| 删除任务 | DELETE | `/api/gantt/tasks/{id}` | 删除任务 |

## 接口详细说明

### 1. 获取甘特图数据

**请求**
```http
GET /api/gantt/tasks?department={department}&project={project}&type={type}&creator={creator}
```

**查询参数**
- `department` (可选): 部门筛选
- `project` (可选): 项目筛选  
- `type` (可选): 类型筛选
- `creator` (可选): 创建人筛选

**响应**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "version-bkci-3.0",
      "text": "蓝鲸CI V3.0版本",
      "start_date": "2025-01-01",
      "end_date": "2025-06-30",
      "progress": 0.75,
      "type": "version",
      "isExpanded": true,
      "creator": "张三",
      "status": "进行中",
      "project_name": "蓝鲸持续集成平台",
      "department_name": "TEG",
      "url": "https://devops.tencent.com/ms/bkci/versions/3.0",
      "stats": {
        "total_issues": 89,
        "closed_issues": 67,
        "is_overdue": false,
        "overdue_days": 0,
        "total_requirements": 25,
        "closed_requirements": 20,
        "total_tasks": 45,
        "closed_tasks": 35,
        "total_defects": 19,
        "closed_defects": 12
      },
      "children": [
        {
          "id": "req-ci-001",
          "text": "流水线性能优化需求",
          "start_date": "2025-01-01",
          "end_date": "2025-01-20",
          "progress": 1.0,
          "type": "requirement",
          "creator": "王五",
          "status": "已完成",
          "project_name": "蓝鲸持续集成平台",
          "department_name": "TEG",
          "url": "https://devops.tencent.com/ms/bkci/requirements/001",
          "stats": {
            "total_issues": 1,
            "closed_issues": 1,
            "is_overdue": false,
            "overdue_days": 0,
            "total_requirements": 1,
            "closed_requirements": 1,
            "total_tasks": 0,
            "closed_tasks": 0,
            "total_defects": 0,
            "closed_defects": 0
          }
        }
      ]
    }
  ],
  "timestamp": 1640995200000
}
```

### 2. 获取筛选选项

**请求**
```http
GET /api/gantt/filters
```

**响应**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "departments": ["TEG", "PCG", "CSIG", "CDG"],
    "projects": ["蓝鲸持续集成平台", "蓝鲸配置平台", "蓝鲸监控平台"],
    "types": ["version", "sprint", "requirement", "task", "defect"],
    "creators": ["张三", "李四", "王五", "赵六"]
  },
  "timestamp": 1640995200000
}
```

### 3. 更新任务进度

**请求**
```http
PUT /api/gantt/tasks/{id}/progress
Content-Type: application/json

{
  "progress": 0.8
}
```

**响应**
```json
{
  "code": 0,
  "message": "任务进度更新成功",
  "data": {
    "id": "task-ci-001",
    "progress": 0.8,
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "timestamp": 1640995200000
}
```

### 4. 更新任务时间安排

**请求**
```http
PUT /api/gantt/tasks/{id}/schedule
Content-Type: application/json

{
  "start_date": "2025-01-10",
  "end_date": "2025-02-10"
}
```

**响应**
```json
{
  "code": 0,
  "message": "任务时间安排更新成功",
  "data": {
    "id": "task-ci-001",
    "start_date": "2025-01-10",
    "end_date": "2025-02-10",
    "updated_at": "2025-01-15T10:30:00Z"
  },
  "timestamp": 1640995200000
}
```

### 5. 获取任务详情

**请求**
```http
GET /api/gantt/tasks/{id}
```

**响应**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "task-ci-001",
    "text": "流水线缓存机制优化",
    "start_date": "2025-01-05",
    "end_date": "2025-01-25",
    "progress": 1.0,
    "type": "task",
    "dependencies": ["req-ci-001"],
    "creator": "赵六",
    "status": "已完成",
    "project_name": "蓝鲸持续集成平台",
    "department_name": "TEG",
    "url": "https://devops.tencent.com/ms/bkci/tasks/001",
    "actual_start": "2025-01-06",
    "actual_end": "2025-01-24",
    "stats": {
      "total_issues": 1,
      "closed_issues": 1,
      "is_overdue": false,
      "overdue_days": 0,
      "total_requirements": 0,
      "closed_requirements": 0,
      "total_tasks": 1,
      "closed_tasks": 1,
      "total_defects": 0,
      "closed_defects": 0
    }
  },
  "timestamp": 1640995200000
}
```

### 6. 创建任务

**请求**
```http
POST /api/gantt/tasks
Content-Type: application/json

{
  "text": "新功能开发",
  "start_date": "2025-02-01",
  "end_date": "2025-02-28",
  "type": "task",
  "creator": "张三",
  "project_name": "蓝鲸持续集成平台",
  "department_name": "TEG",
  "parent_id": "version-bkci-3.0"
}
```

**响应**
```json
{
  "code": 0,
  "message": "任务创建成功",
  "data": {
    "id": "task-ci-new-001",
    "text": "新功能开发",
    "start_date": "2025-02-01",
    "end_date": "2025-02-28",
    "progress": 0.0,
    "type": "task",
    "creator": "张三",
    "status": "未开始",
    "project_name": "蓝鲸持续集成平台",
    "department_name": "TEG",
    "created_at": "2025-01-15T10:30:00Z",
    "stats": {
      "total_issues": 0,
      "closed_issues": 0,
      "is_overdue": false,
      "overdue_days": 0,
      "total_requirements": 0,
      "closed_requirements": 0,
      "total_tasks": 0,
      "closed_tasks": 0,
      "total_defects": 0,
      "closed_defects": 0
    }
  },
  "timestamp": 1640995200000
}
```

### 7. 删除任务

**请求**
```http
DELETE /api/gantt/tasks/{id}
```

**响应**
```json
{
  "code": 0,
  "message": "任务删除成功",
  "data": {
    "id": "task-ci-001",
    "deleted_at": "2025-01-15T10:30:00Z"
  },
  "timestamp": 1640995200000
}
```

## 错误码说明

| 错误码 | 描述 | 说明 |
|-------|------|------|
| 0 | 成功 | 请求处理成功 |
| 1001 | 参数错误 | 请求参数格式错误或缺失必要参数 |
| 1002 | 权限不足 | 用户没有权限访问该资源 |
| 1003 | 资源不存在 | 请求的任务或资源不存在 |
| 1004 | 数据冲突 | 数据更新时发生冲突 (如并发修改) |
| 1005 | 依赖冲突 | 任务依赖关系存在冲突 |
| 2001 | 服务器内部错误 | 服务器处理请求时发生错误 |
| 2002 | 数据库错误 | 数据库操作失败 |
| 2003 | 外部服务错误 | 调用外部服务失败 |

**错误响应格式**
```json
{
  "code": 1003,
  "message": "任务不存在",
  "data": null,
  "timestamp": 1640995200000
}
```

## 示例代码

### JavaScript/TypeScript 客户端封装

```typescript
class GanttAPI {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  // 获取甘特图数据
  async getTasks(filters?: {
    department?: string;
    project?: string;
    type?: string;
    creator?: string;
  }): Promise<GanttTask[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const response = await fetch(`${this.baseURL}/api/gantt/tasks?${params}`);
    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data;
  }
  
  // 获取筛选选项
  async getFilterOptions(): Promise<FilterOptions> {
    const response = await fetch(`${this.baseURL}/api/gantt/filters`);
    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
    
    return result.data;
  }
  
  // 更新任务进度
  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/gantt/tasks/${taskId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    });
    
    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
  }
  
  // 更新任务时间安排
  async updateTaskSchedule(taskId: string, schedule: {
    start_date: string;
    end_date: string;
  }): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/gantt/tasks/${taskId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedule),
    });
    
    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.message);
    }
  }
}

// 使用示例
const ganttAPI = new GanttAPI('https://your-api-domain.com');

// 获取所有任务
const tasks = await ganttAPI.getTasks();

// 获取TEG部门的任务
const tegTasks = await ganttAPI.getTasks({ department: 'TEG' });

// 更新任务进度
await ganttAPI.updateTaskProgress('task-ci-001', 0.8);
```

### Python 后端实现示例 (FastAPI)

```python
from fastapi import FastAPI, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class TaskStats(BaseModel):
    total_issues: int
    closed_issues: int
    is_overdue: bool
    overdue_days: int
    total_requirements: int
    closed_requirements: int
    total_tasks: int
    closed_tasks: int
    total_defects: int
    closed_defects: int

class GanttTask(BaseModel):
    id: str
    text: str
    start_date: str
    end_date: str
    progress: float
    type: str
    isExpanded: Optional[bool] = None
    children: Optional[List['GanttTask']] = None
    dependencies: Optional[List[str]] = None
    status: str
    creator: str
    project_name: str
    department_name: str
    stats: TaskStats
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None
    url: Optional[str] = None

class ApiResponse(BaseModel):
    code: int
    message: str
    data: any
    timestamp: int

@app.get("/api/gantt/tasks")
async def get_tasks(
    department: Optional[str] = None,
    project: Optional[str] = None,
    type: Optional[str] = None,
    creator: Optional[str] = None
) -> ApiResponse:
    # 这里实现数据库查询逻辑
    # tasks = query_tasks_from_database(department, project, type, creator)
    
    return ApiResponse(
        code=0,
        message="success",
        data=[], # tasks
        timestamp=int(datetime.now().timestamp() * 1000)
    )

@app.put("/api/gantt/tasks/{task_id}/progress")
async def update_task_progress(task_id: str, progress_data: dict):
    # 实现更新逻辑
    progress = progress_data.get('progress')
    if progress is None or not (0 <= progress <= 1):
        raise HTTPException(status_code=400, detail="Invalid progress value")
    
    # update_task_progress_in_database(task_id, progress)
    
    return ApiResponse(
        code=0,
        message="任务进度更新成功",
        data={"id": task_id, "progress": progress},
        timestamp=int(datetime.now().timestamp() * 1000)
    )
```

## 部署和集成建议

1. **认证授权**: 建议在所有接口前加上认证中间件，验证用户身份和权限
2. **缓存策略**: 对于筛选选项等相对静态的数据，建议添加缓存
3. **分页处理**: 对于大量数据的接口，建议添加分页参数
4. **实时更新**: 可以考虑使用WebSocket推送任务状态变更
5. **日志记录**: 记录所有数据变更操作的审计日志
6. **数据验证**: 严格验证输入数据，特别是日期格式和依赖关系

---

此文档提供了完整的API规范，您可以根据实际需求调整字段和接口定义。建议在开发过程中保持前后端的数据结构一致性。