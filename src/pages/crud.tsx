import dynamic from "next/dynamic";

const GanttCrudDemo = dynamic(() => import("@/components/GanttCrudDemo"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-600">
      Loading Gantt…
    </div>
  ),
});

export default function CrudPage() {
  return <GanttCrudDemo />;
}
