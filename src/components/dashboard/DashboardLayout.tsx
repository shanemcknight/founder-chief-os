import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ChiefPanel from "@/components/dashboard/ChiefPanel";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardTopbar />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <ChiefPanel />
      </div>
    </div>
  );
}
