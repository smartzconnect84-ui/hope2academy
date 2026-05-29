import { Outlet } from "react-router-dom";

,
  component: () => <Outlet />,
});

function PortalLayout() {
  return <Outlet />;
}

export default PortalLayout;
