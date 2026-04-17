import { Outlet } from "react-router-dom";
import { ReportsProvider } from "@/contexts/ReportsContext";

export default function ReportsLayout() {
  return (
    <ReportsProvider>
      <Outlet />
    </ReportsProvider>
  );
}
