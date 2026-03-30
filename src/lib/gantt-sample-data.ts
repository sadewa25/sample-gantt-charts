import type { ILink } from "@svar-ui/react-gantt";

export function plainLinksFromState(
  links: Array<Record<string, unknown>>,
): ILink[] {
  return links.map((l) => ({
    id: l.id as ILink["id"],
    type: l.type as ILink["type"],
    source: l.source as ILink["source"],
    target: l.target as ILink["target"],
    ...(typeof l.lag === "number" ? { lag: l.lag } : {}),
  }));
}
