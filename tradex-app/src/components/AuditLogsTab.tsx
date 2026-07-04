import { useState } from "react";
import AdminAuditLogsRegistry from "./AdminAuditLogsRegistry";
import { useAdminAuditLogs } from "../hooks/useAdmin";

export default function AuditLogsTab() {
  const [auditPage, setAuditPage] = useState(0);

  const { data: auditData, isLoading: auditLoading } = useAdminAuditLogs(
    auditPage,
    true
  );

  return (
    <AdminAuditLogsRegistry
      logs={auditData?.content || []}
      loading={auditLoading}
      page={auditPage}
      totalPages={auditData?.totalPages || 0}
      onPageChange={setAuditPage}
    />
  );
}
