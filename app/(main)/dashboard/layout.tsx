import { FeedSidebar } from '@/components/feed-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex gap-8">
          {/* Sidebar */}
          <FeedSidebar />

          {/* Main Content */}
          <div className="flex-1 max-w-4xl mx-auto lg:mx-0 pb-20 md:pb-8">
            {children}
          </div>

          {/* Right Sidebar (empty for now) */}
          <aside className="hidden xl:block w-80 shrink-0"></aside>
        </div>
      </div>
    </div>
  );
}
