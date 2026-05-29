import { Outlet } from "react-router-dom";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "Portal — HOPE2-LIBERIA" }] }),
  component: () => <Outlet />,
});