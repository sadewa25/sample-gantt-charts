import type { NextApiRequest, NextApiResponse } from "next";
import type { ILink, ITask } from "@svar-ui/react-gantt";
import { getFreshTypedDataset } from "@/data/ganttTaskTypesDemo";

type Store = { tasks: ITask[]; links: ILink[] };

declare global {
  // eslint-disable-next-line no-var
  var __ganttCrudStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__ganttCrudStore) {
    const seed = getFreshTypedDataset();
    globalThis.__ganttCrudStore = {
      tasks: seed.tasks,
      links: seed.links,
    };
  }
  return globalThis.__ganttCrudStore;
}

function reviveDates(tasks: ITask[]): ITask[] {
  const reviver = (v: unknown): unknown => {
    if (typeof v !== "object" || v === null) return v;
    if (Array.isArray(v)) return v.map(reviver);
    const o = v as Record<string, unknown>;
    const out: Record<string, unknown> = { ...o };
    for (const key of ["start", "end", "base_start", "base_end"] as const) {
      const val = o[key];
      if (typeof val === "string") {
        const d = new Date(val);
        if (!Number.isNaN(d.getTime())) out[key] = d;
      }
    }
    if (Array.isArray(o.data)) {
      out.data = (o.data as ITask[]).map((t) => reviver(t) as ITask);
    }
    return out;
  };
  return tasks.map((t) => reviver(t) as ITask);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const store = getStore();

  if (req.method === "GET") {
    res.status(200).json(store);
    return;
  }

  if (req.method === "PUT") {
    const body = req.body as Store;
    if (!body || !Array.isArray(body.tasks) || !Array.isArray(body.links)) {
      res.status(400).json({ error: "Expected { tasks: [], links: [] }" });
      return;
    }
    store.tasks = reviveDates(body.tasks);
    store.links = body.links;
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  res.status(405).end("Method Not Allowed");
}
