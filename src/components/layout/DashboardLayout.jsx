import Sidebar from './Sidebar';

export default function DashboardLayout({ children, role = 'student' }) {
  return (
    <div className="flex min-h-screen bg-gray-50 pt-16">
      <Sidebar role={role} />
      <main className="flex-1 p-6 lg:p-8 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
