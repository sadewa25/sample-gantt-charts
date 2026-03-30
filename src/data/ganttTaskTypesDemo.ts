/**
 * Mirrors SVAR `demos/data.js` — `taskTypes` + `getTypedData()` for GanttTaskTypes demo.
 * @see https://github.com/svar-widgets/react-gantt/blob/main/demos/data.js
 */
import type { ILink, ITask } from "@svar-ui/react-gantt";
import { baseTasks, demoLinks, demoScales } from "./ganttTaskTypesDemo.data";

export const taskTypes = [
  { id: "task", label: "Task" },
  { id: "summary", label: "Summary task" },
  { id: "milestone", label: "Milestone" },
  { id: "urgent", label: "Urgent" },
  { id: "narrow", label: "Narrow" },
  { id: "progress", label: "Progress" },
  { id: "round", label: "Rounded" },
];

export function getTypedData() {
  const t = baseTasks.map((task, i) => {
    const res: ITask = { ...task };
    if (res.type == "task" && i % 3) {
      res.type = taskTypes[(i % 5) + 2].id as ITask["type"];
    }
    return res;
  });

  return { tasks: t, links: demoLinks, scales: demoScales };
}

/** Deep clone for React state / API reset (dates as ISO from JSON round-trip). */
export function getFreshTypedDataset(): {
  tasks: ITask[];
  links: ILink[];
  scales: typeof demoScales;
} {
  const { tasks, links, scales } = getTypedData();
  return {
    tasks: JSON.parse(JSON.stringify(tasks)) as ITask[],
    links: JSON.parse(JSON.stringify(links)) as ILink[],
    scales,
  };
}
