# 甘特图组件后端API接口文档

## 概述

本文档描述了甘特图组件所需的后端API接口规范，用于获取项目版本迭代的甘特图数据。

## 接口地址

```
GET /api/gantt/tasks
```

## 请求参数

### Query Parameters

| 参数名 | 类型 | 必需 | 默认值 | 描述 |
|--------|------|------|--------|------|
| department | string | 否 | - | 部门名称，用于筛选特定部门的数据 |
| project | string | 否 | - | 项目名称，用于筛选特定项目的数据 |
| type | string | 否 | - | 工作项类型，可选值：version, sprint, task, requirement, defect |
| start_date | string | 否 | - | 查询开始日期 (YYYY-MM-DD) |
| end_date | string | 否 | - | 查询结束日期 (YYYY-MM-DD) |

### 请求示例

```bash
# 获取所有数据
GET /api/gantt/tasks

# 获取特定部门的数据
GET /api/gantt/tasks?department=TEG

# 获取特定项目的版本数据
GET /api/gantt/tasks?project=蓝鲸持续集成平台&type=version

# 获取特定时间范围的数据
GET /api/gantt/tasks?start_date=2025-01-01&end_date=2025-12-31
```

## 响应数据结构

### 成功响应

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
      "dependencies": [],
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
      "actual_start": "2025-01-01",
      "actual_end": null,
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
          "dependencies": [],
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
  ]
}
```

### 错误响应

```json
{
  "code": 1001,
  "message": "参数错误",
  "data": null
}
```

## 数据字段说明

### 主要任务对象 (GanttTask)

| 字段名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| id | string | 是 | 任务唯一标识符 |
| text | string | 是 | 任务名称/标题 |
| start_date | string | 是 | 计划开始日期 (YYYY-MM-DD) |
| end_date | string | 是 | 计划结束日期 (YYYY-MM-DD) |
| progress | number | 是 | 完成进度 (0-1之间的小数) |
| type | string | 是 | 工作项类型：version/sprint/task/requirement/defect |
| creator | string | 是 | 创建人/负责人 |
| status | string | 是 | 当前状态 |
| project_name | string | 是 | 所属项目名称 |
| department_name | string | 是 | 所属部门名称 |
| isExpanded | boolean | 否 | 是否展开子任务 (默认true) |
| url | string | 否 | **跳转链接URL** - 点击详情时跳转的完整链接 |
| dependencies | string[] | 否 | 依赖的任务ID列表 |
| actual_start | string | 否 | 实际开始日期 (YYYY-MM-DD) |
| actual_end | string | 否 | 实际结束日期 (YYYY-MM-DD) |
| children | GanttTask[] | 否 | 子任务列表 |
| stats | StatsObject | 是 | 统计信息对象 |

### 统计信息对象 (StatsObject)

| 字段名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| total_issues | number | 是 | 总工作项数量 |
| closed_issues | number | 是 | 已关闭工作项数量 |
| is_overdue | boolean | 是 | 是否延期 |
| overdue_days | number | 是 | 延期天数 |
| total_requirements | number | 是 | 总需求数量 |
| closed_requirements | number | 是 | 已完成需求数量 |
| total_tasks | number | 是 | 总任务数量 |
| closed_tasks | number | 是 | 已完成任务数量 |
| total_defects | number | 是 | 总缺陷数量 |
| closed_defects | number | 是 | 已修复缺陷数量 |

## 工作项类型说明

| 类型值 | 显示名称 | 描述 |
|--------|----------|------|
| version | 版本 | 产品版本，包含多个迭代 |
| sprint | 迭代 | 开发迭代，包含多个需求和任务 |
| requirement | 需求 | 业务需求 |
| task | 任务 | 开发任务 |
| defect | 缺陷 | Bug或缺陷 |

## 状态值说明

| 状态值 | 颜色表示 | 描述 |
|--------|----------|------|
| 进行中 | 蓝色 | 正在进行的工作项 |
| 已完成 | 绿色 | 已完成的工作项 |
| 已修复 | 绿色 | 已修复的缺陷 |
| 延期 | 红色 | 延期的工作项 |
| 规划中 | 橙色 | 正在规划的工作项 |
| 分析中 | 橙色 | 正在分析的需求 |
| 设计中 | 橙色 | 正在设计的任务 |

## URL字段使用说明

**重要**：`url` 字段应该包含完整的跳转链接，前端会直接使用 `window.open(url, '_blank')` 来打开。

### URL拼接示例

```javascript
// 版本详情页面
"url": "https://devops.tencent.com/ms/bkci/versions/3.0"

// 需求详情页面  
"url": "https://devops.tencent.com/ms/bkci/requirements/001"

// 任务详情页面
"url": "https://devops.tencent.com/ms/bkci/tasks/task-ci-001"

// 缺陷详情页面
"url": "https://devops.tencent.com/ms/bkci/defects/def-001"
```

### URL字段注意事项

1. **完整URL**：必须包含协议头 (https://)
2. **有效性**：确保URL可访问，无需额外认证
3. **可选性**：如果某个工作项没有对应的详情页面，可以不提供url字段
4. **安全性**：建议使用内部系统链接，避免外部不可控链接

## 数据层级结构

甘特图支持树状数据结构：

```
版本 (version)
├── 迭代 (sprint)
│   ├── 需求 (requirement)
│   ├── 任务 (task)
│   └── 缺陷 (defect)
└── 迭代 (sprint)
    ├── 需求 (requirement)
    └── 任务 (task)
```

## 性能建议

1. **数据量限制**：单次请求建议返回不超过1000个工作项
2. **分页支持**：对于大数据集，建议实现分页机制
3. **缓存策略**：对于不经常变化的数据，建议实现适当的缓存
4. **增量更新**：支持基于时间戳的增量数据更新

## 错误码说明

| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 数据不存在 |
| 1003 | 权限不足 |
| 1004 | 服务内部错误 |
| 1005 | 数据格式错误 |

## 调试建议

1. **数据验证**：确保返回的日期格式为 YYYY-MM-DD
2. **进度值检查**：progress字段应在0-1之间
3. **URL测试**：验证返回的URL链接可正常访问
4. **层级关系**：确保父子任务的时间范围合理
5. **统计数据一致性**：验证stats中的各项统计数据准确性

## 联调时机

建议在以下时机进行前后端联调：

1. **数据结构确认**：首先确认返回的JSON结构符合规范
2. **筛选功能测试**：测试各种查询参数的筛选效果
3. **URL跳转测试**：验证详情页面跳转功能
4. **性能测试**：测试大数据量下的响应时间
5. **边界情况测试**：测试空数据、异常数据等边界情况