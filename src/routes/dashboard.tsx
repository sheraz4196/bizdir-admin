import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminShell } from '@/features/admin/shell';
export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: 'Bizdir Admin' }, { name: 'robots', content: 'noindex, nofollow' }]
  }),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
});
