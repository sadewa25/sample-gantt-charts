/**
 * Same structure as SVAR `demos/cases/GanttTaskTypes.jsx` (ContextMenu → Gantt → Editor).
 * @see https://github.com/svar-widgets/react-gantt/blob/main/demos/cases/GanttTaskTypes.jsx
 */
import { useMemo, useState } from "react";
import type { IApi } from "@svar-ui/react-gantt";
import { ContextMenu, Editor, Gantt, Willow } from "@svar-ui/react-gantt";
import { getTypedData, taskTypes } from "@/data/ganttTaskTypesDemo";
import GanttZoomBar from "@/components/GanttZoomBar";

export default function GanttTaskTypesView() {
  const data = useMemo(() => getTypedData(), []);
  const [api, setApi] = useState<IApi | null>(null);

  return (
    <Willow>
      <div className="wx-I1glfWSB demo flex h-[min(85vh,720px)] w-full min-w-0 flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
        <GanttZoomBar api={api} className="shrink-0" />
        <div className="min-h-0 min-w-0 flex-1">
          <ContextMenu api={api ?? undefined}>
            <Gantt
              init={setApi}
              tasks={data.tasks}
              links={data.links}
              scales={data.scales}
              taskTypes={taskTypes}
              zoom
            />
          </ContextMenu>
        </div>
        {api ? <Editor api={api} /> : null}
      </div>
    </Willow>
  );
}
