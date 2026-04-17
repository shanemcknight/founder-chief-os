import { Outlet } from "react-router-dom";
import { CrmProvider, useCrm } from "@/contexts/CrmContext";
import ContactDetailPanel from "@/components/sales/ContactDetailPanel";

function SalesShell() {
  const { selectedContactId, setSelectedContactId } = useCrm();
  return (
    <div className="relative h-full">
      <Outlet />
      {selectedContactId && (
        <ContactDetailPanel contactId={selectedContactId} onClose={() => setSelectedContactId(null)} />
      )}
    </div>
  );
}

export default function SalesLayout() {
  return (
    <CrmProvider>
      <SalesShell />
    </CrmProvider>
  );
}
