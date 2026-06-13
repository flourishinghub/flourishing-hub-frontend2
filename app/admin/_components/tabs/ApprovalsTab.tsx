'use client';

import PendingApprovalsTab from '@/components/PendingApprovalsTab';
import { apiCall } from '@/lib/api';

interface ApprovalsTabProps {
  pendingUsers: any[];
  setPendingUsers: (users: any[]) => void;
}

export default function ApprovalsTab({ pendingUsers, setPendingUsers }: ApprovalsTabProps) {
  return (
    <div id="approvals">
      <PendingApprovalsTab
        pendingUsers={pendingUsers}
        onUpdate={async () => {
          // Refresh pending users list
          try {
            const pendingResponse = await apiCall('/admin/pending-approvals');
            setPendingUsers(pendingResponse.data || []);
          } catch (error) {
            console.error("Failed to refresh pending users:", error);
          }
        }}
      />
    </div>
  );
}
