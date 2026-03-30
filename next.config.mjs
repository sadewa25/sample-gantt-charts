/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@svar-ui/react-gantt",
    "@svar-ui/gantt-store",
    "@svar-ui/react-grid",
    "@svar-ui/react-editor",
    "@svar-ui/react-toolbar",
    "@svar-ui/react-menu",
    "@svar-ui/react-core",
    "@svar-ui/lib-react",
    "@svar-ui/lib-state",
    "@svar-ui/lib-dom",
  ],
};

export default nextConfig;
