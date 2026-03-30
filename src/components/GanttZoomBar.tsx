import type { IApi } from "@svar-ui/react-gantt";

/** Matches SVAR default when `ratio` is omitted (see zoom-scale action docs). */
const ZOOM_RATIO = 0.15;

type Props = {
  api: IApi | null;
  className?: string;
};

/**
 * Programmatic zoom via {@link https://docs.svar.dev/react/gantt/api/actions/zoom-scale/ zoom-scale}.
 * Wheel zoom uses Ctrl/⌘ + scroll on the chart when {@link https://docs.svar.dev/react/gantt/api/properties/zoom/ zoom} is enabled on Gantt.
 */
export default function GanttZoomBar({ api, className }: Props) {
  if (!api) return null;

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
      }
    >
      <span className="text-zinc-500">Zoom</span>
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-800 hover:bg-zinc-50"
        onClick={() => void api.exec("zoom-scale", { dir: -1, ratio: ZOOM_RATIO })}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-800 hover:bg-zinc-50"
        onClick={() => void api.exec("zoom-scale", { dir: 1, ratio: ZOOM_RATIO })}
        aria-label="Zoom in"
      >
        +
      </button>
      <span className="text-xs text-zinc-500">
        Ctrl/⌘ + scroll on chart
      </span>
    </div>
  );
}
