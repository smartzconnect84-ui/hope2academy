import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portal/")({
  component: PortalRedirect,
});

function PortalRedirect() {
  const { loading, user, primaryRole } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (primaryRole) navigate({ to: `/portal/${primaryRole}` as any });
  }, [loading, user, primaryRole, navigate]);
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}