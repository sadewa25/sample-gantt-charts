/* all.css: includes Grid/Editor/Toolbar/menu widgets (SVAR Next.js guide; confirm via svar-mcp Search). */
import "@svar-ui/react-gantt/all.css";
import "@/styles/GanttTaskTypes.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
