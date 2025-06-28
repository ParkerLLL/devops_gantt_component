// src/workers/criticalPath.worker.ts

// Simplified task structure for calculation
interface CalcTask {
  id: string;
  start_date: string;
  end_date: string;
  dependencies: string[];
  // Calculated fields
  duration: number;
  es: number; // Earliest Start
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  slack: number; // Float
}

// Helper to calculate duration in days
const getDuration = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  // Add 1 to make it inclusive
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
};

self.onmessage = (event: MessageEvent<any[]>) => {
  const tasks: any[] = event.data;
  if (!tasks || tasks.length === 0) {
    self.postMessage([]);
    return;
  }

  const taskMap = new Map<string, CalcTask>();
  tasks.forEach(task => {
    taskMap.set(task.id, {
      ...task,
      duration: getDuration(task.start_date, task.end_date),
      es: 0,
      ef: 0,
      ls: Infinity,
      lf: Infinity,
      slack: 0,
    });
  });

  // Forward pass: Calculate Earliest Start (ES) and Earliest Finish (EF)
  const sortedTasks = [...taskMap.values()].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  for (const task of sortedTasks) {
    let maxEfOfDeps = 0;
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          maxEfOfDeps = Math.max(maxEfOfDeps, depTask.ef);
        }
      }
    }
    task.es = maxEfOfDeps;
    task.ef = task.es + task.duration;
    taskMap.set(task.id, task); // Update map with calculated values
  }

  // Backward pass: Calculate Latest Start (LS) and Latest Finish (LF)
  const projectEndDate = Math.max(...Array.from(taskMap.values()).map(t => t.ef));
  const reversedTasks = sortedTasks.reverse();

  for (const task of reversedTasks) {
    if (task.ef === projectEndDate) {
      task.lf = projectEndDate;
    } else {
      let minLsOfSuccessors = Infinity;
      for (const successor of taskMap.values()) {
        if (successor.dependencies && successor.dependencies.includes(task.id)) {
          minLsOfSuccessors = Math.min(minLsOfSuccessors, successor.ls);
        }
      }
      task.lf = minLsOfSuccessors === Infinity ? projectEndDate : minLsOfSuccessors;
    }
    task.ls = task.lf - task.duration;
    task.slack = task.ls - task.es;
    taskMap.set(task.id, task); // Update map
  }

  // Identify critical path
  const criticalPathIds = Array.from(taskMap.values())
    .filter(task => task.slack <= 0) // Using <= 0 to be safe with float precision
    .map(task => task.id);

  self.postMessage(criticalPathIds);
};
