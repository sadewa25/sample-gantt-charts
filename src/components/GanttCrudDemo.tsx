import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IApi, ILink, ITask } from "@svar-ui/react-gantt";
import {
  ContextMenu,
  Editor,
  Gantt,
  Toolbar,
  Willow,
} from "@svar-ui/react-gantt";
import { getFreshTypedDataset, taskTypes } from "@/data/ganttTaskTypesDemo";
import { plainLinksFromState } from "@/lib/gantt-sample-data";
import GanttZoomBar from "@/components/GanttZoomBar";

const taskTypesForCreate = taskTypes.filter((t) => t.id !== "summary");

/** Inclusive calendar-day length for bar display (start and end days both count). */
function inclusiveDayDuration(start: Date, end: Date): number {
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = (e.getTime() - s.getTime()) / 86400000;
  return Math.max(1, diffDays + 1);
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

const ADD_TASK_INTERCEPT_TAG = "add-task-dialog";

/** Payload for `add-task` (matches gantt-store action shape). */
type AddTaskPayload = {
  id?: ITask["id"];
  task: Partial<ITask>;
  target?: ITask["id"];
  mode?: "before" | "after" | "child";
  show?: boolean | "x" | "y" | "xy";
  select?: boolean;
  eventSource?: string;
};

function cloneTasksForProps(tasks: ITask[]): ITask[] {
  return JSON.parse(JSON.stringify(tasks)) as ITask[];
}

/**
 * SVAR Toolbar measures `container.children[i].clientWidth` in a ResizeObserver.
 * If that runs before every toolbar item has a DOM node, `children[i]` is undefined
 * and throws. Mount after two animation frames so layout + children exist.
 */
function DeferredToolbar({ api }: { api: IApi | null }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api) {
      setReady(false);
      return;
    }
    let cancelled = false;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!cancelled) setReady(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      setReady(false);
    };
  }, [api]);

  if (!api || !ready) return null;

  return (
    <div className="min-h-11 min-w-0 w-full shrink-0 rounded-lg border border-zinc-200 bg-white px-1 py-1">
      <Toolbar api={api} />
    </div>
  );
}

export default function GanttCrudDemo() {
  const seedRef = useRef(getFreshTypedDataset());
  const [tasks, setTasks] = useState<ITask[]>(() => seedRef.current.tasks);
  const [links, setLinks] = useState<ILink[]>(() => seedRef.current.links);
  const scales = seedRef.current.scales;
  const [api, setApi] = useState<IApi | null>(null);
  const apiRef = useRef<IApi | null>(null);
  const bypassAddTaskRef = useRef(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pendingAddTask, setPendingAddTask] = useState<AddTaskPayload | null>(
    null,
  );
  const [newTaskTitle, setNewTaskTitle] = useState("New task");
  const [newTaskType, setNewTaskType] = useState<string>("task");
  const [newTaskStart, setNewTaskStart] = useState("");
  const [newTaskEnd, setNewTaskEnd] = useState("");
  const [addFormError, setAddFormError] = useState<string | null>(null);

  const syncFromApi = useCallback((ganttApi: IApi) => {
    queueMicrotask(() => {
      setTasks(cloneTasksForProps(ganttApi.serialize()));
      const raw = ganttApi.getState().links ?? [];
      setLinks(
        plainLinksFromState(raw as unknown as Array<Record<string, unknown>>),
      );
    });
  }, []);

  const scheduleSync = useCallback(() => {
    const a = apiRef.current;
    if (a) syncFromApi(a);
  }, [syncFromApi]);

  const persistToServer = useCallback(async () => {
    const ganttApi = apiRef.current;
    if (!ganttApi) return;
    setApiMessage(null);
    try {
      const body = {
        tasks: ganttApi.serialize(),
        links: plainLinksFromState(
          (ganttApi.getState().links ?? []) as unknown as Array<
            Record<string, unknown>
          >,
        ),
      };
      const res = await fetch("/api/gantt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setApiMessage("Saved to server (in-memory for this process).");
    } catch (e) {
      setApiMessage(e instanceof Error ? e.message : "Save failed");
    }
  }, []);

  const loadFromServer = useCallback(async () => {
    setApiMessage(null);
    try {
      const res = await fetch("/api/gantt");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { tasks: ITask[]; links: ILink[] };
      const fallback = getFreshTypedDataset();
      setTasks(data.tasks?.length ? data.tasks : fallback.tasks);
      setLinks(data.links?.length ? data.links : fallback.links);
      setApiMessage("Loaded from server.");
    } catch (e) {
      setApiMessage(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  const resetLocal = useCallback(() => {
    const next = getFreshTypedDataset();
    setTasks(next.tasks);
    setLinks(next.links);
    setApiMessage("Reset to sample data (props will re-init the chart).");
  }, []);

  useEffect(() => {
    if (!api) return;
    const tag = ADD_TASK_INTERCEPT_TAG;
    api.intercept(
      "add-task",
      (data: AddTaskPayload) => {
        if (bypassAddTaskRef.current) {
          bypassAddTaskRef.current = false;
          return;
        }
        setPendingAddTask(data);
        setNewTaskTitle(
          typeof data.task?.text === "string" && data.task.text.trim()
            ? data.task.text
            : "New task",
        );
        const today = new Date();
        const start =
          data.task?.start instanceof Date ? data.task.start : today;
        const end =
          data.task?.end instanceof Date
            ? data.task.end
            : new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate() + 1,
              );
        setNewTaskStart(toDateInputValue(start));
        setNewTaskEnd(toDateInputValue(end));
        setNewTaskType(
          typeof data.task?.type === "string" ? data.task.type : "task",
        );
        setAddFormError(null);
        setAddDialogOpen(true);
        return false;
      },
      { tag },
    );
    return () => api.detach(tag);
  }, [api]);

  const closeAddDialog = useCallback(() => {
    setAddDialogOpen(false);
    setPendingAddTask(null);
    setAddFormError(null);
  }, []);

  const confirmAddTask = useCallback(() => {
    if (!pendingAddTask) return;
    const start = parseDateInput(newTaskStart);
    const end = parseDateInput(newTaskEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setAddFormError("Please pick valid start and end dates.");
      return;
    }
    if (end < start) {
      setAddFormError("End date must be on or after the start date.");
      return;
    }
    const ganttApi = apiRef.current;
    if (!ganttApi) return;
    const duration = inclusiveDayDuration(start, end);
    bypassAddTaskRef.current = true;
    void ganttApi
      .exec("add-task", {
        ...pendingAddTask,
        task: {
          ...pendingAddTask.task,
          text: newTaskTitle.trim() || "New task",
          type: newTaskType,
          start,
          end,
          duration,
        },
      })
      .then(() => scheduleSync());
    closeAddDialog();
  }, [
    pendingAddTask,
    newTaskTitle,
    newTaskType,
    newTaskStart,
    newTaskEnd,
    closeAddDialog,
    scheduleSync,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">
          SVAR React Gantt — CRUD sample
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Interactive chart from{" "}
          <a
            className="text-blue-600 underline"
            href="https://svar.dev/react/gantt/"
            target="_blank"
            rel="noreferrer"
          >
            SVAR React Gantt
          </a>
          .           Same dataset and <code className="text-zinc-800">taskTypes</code> as
          the SVAR{" "}
          <a
            className="text-blue-600 underline"
            href="https://github.com/svar-widgets/react-gantt/blob/main/demos/cases/GanttTaskTypes.jsx"
            target="_blank"
            rel="noreferrer"
          >
            GanttTaskTypes
          </a>{" "}
          demo, plus toolbar, add-task dialog, and <code>/api/gantt</code>.{" "}
          <Link className="text-blue-600 underline" href="/">
            Home
          </Link>{" "}
          shows the minimal demo only.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
            onClick={persistToServer}
            disabled={!api}
          >
            PUT /api/gantt (save)
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            onClick={loadFromServer}
          >
            GET /api/gantt (load)
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            onClick={resetLocal}
          >
            Reset sample data
          </button>
        </div>
        {apiMessage ? (
          <p className="mt-2 text-sm text-zinc-700">{apiMessage}</p>
        ) : null}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4">
        <Willow>
          <div className="flex min-w-0 flex-wrap items-stretch gap-2">
            <div className="min-w-0 flex-1">
              <DeferredToolbar api={api} />
            </div>
            <GanttZoomBar api={api} className="shrink-0 self-start" />
          </div>
          <div
            className="wx-I1glfWSB demo mt-2 min-h-0 min-w-0 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            style={{ height: "min(70vh, 640px)" }}
          >
            <ContextMenu api={api ?? undefined}>
              <Gantt
                init={(instance) => {
                  apiRef.current = instance;
                  setApi(instance);
                }}
                tasks={tasks}
                links={links}
                scales={scales}
                taskTypes={taskTypes}
                zoom
                onAddTask={scheduleSync}
                onUpdateTask={scheduleSync}
                onDeleteTask={scheduleSync}
                onAddLink={scheduleSync}
                onUpdateLink={scheduleSync}
                onDeleteLink={scheduleSync}
                onMoveTask={scheduleSync}
                onCopyTask={scheduleSync}
                onDragTask={(ev) => {
                  if (!ev.inProgress) scheduleSync();
                }}
                onIndentTask={scheduleSync}
              />
            </ContextMenu>
          </div>
          {api ? <Editor api={api} /> : null}
        </Willow>

        <details className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 text-sm">
          <summary className="cursor-pointer font-medium text-zinc-800">
            React state (tasks / links JSON)
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-xs">
            {JSON.stringify({ tasks, links }, null, 2)}
          </pre>
        </details>
      </div>

      {addDialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddDialog();
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
            role="dialog"
            aria-labelledby="add-task-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="add-task-title"
              className="text-base font-semibold text-zinc-900"
            >
              New task
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Choose type, title, and start/end dates (types match the SVAR task
              type demo).
            </p>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                confirmAddTask();
              }}
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Type</span>
                <select
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                >
                  {taskTypesForCreate.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Title</span>
                <input
                  className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Start</span>
                <input
                  type="date"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={newTaskStart}
                  onChange={(e) => setNewTaskStart(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">End</span>
                <input
                  type="date"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  value={newTaskEnd}
                  onChange={(e) => setNewTaskEnd(e.target.value)}
                  required
                />
              </label>
              {addFormError ? (
                <p className="text-sm text-red-600">{addFormError}</p>
              ) : null}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  onClick={closeAddDialog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Add to chart
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
