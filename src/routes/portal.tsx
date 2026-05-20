import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/portal")({
  head: () => ({ meta: [{ title: "Portal — HOPE2-LIBERIA" }] }),
  component: () => <Outlet />,
});