import dynamic from "next/dynamic";
import Link from "next/link";

const GanttTaskTypesView = dynamic(
  () => import("@/components/GanttTaskTypesView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(85vh,720px)] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600">
        Loading Gantt…
      </div>
    ),
  },
);

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900">
      <header className="mx-auto mb-4 max-w-6xl">
        <h1 className="text-lg font-semibold tracking-tight">
          GanttTaskTypes demo (SVAR layout)
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Matches{" "}
          <a
            className="text-blue-600 underline"
            href="https://github.com/svar-widgets/react-gantt/blob/main/demos/cases/GanttTaskTypes.jsx"
            target="_blank"
            rel="noreferrer"
          >
            demos/cases/GanttTaskTypes.jsx
          </a>
          : <code className="text-zinc-800">useMemo(getTypedData)</code>,{" "}
          <code>ContextMenu</code> → <code>Gantt</code> → <code>Editor</code>,
          and <code>taskTypes</code>. Data is ported from{" "}
          <code>demos/data.js</code> (day <code>tasks</code>, <code>links</code>
          , <code>scales</code>).
        </p>
        <p className="mt-2 text-sm">
          <Link className="text-blue-600 underline" href="/crud">
            Open CRUD sample
          </Link>{" "}
          (toolbar, add-task dialog, <code>/api/gantt</code>).
        </p>
      </header>
      <div className="mx-auto max-w-6xl">
        <GanttTaskTypesView />
      </div>
    </div>
  );
}
