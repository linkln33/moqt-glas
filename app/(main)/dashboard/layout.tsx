import { FeedSidebar } from '@/components/feed-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 lg:gap-8 xl:gap-12">
          {/* Left Sidebar - Fixed position */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FeedSidebar />
          </aside>

          {/* Main Content - Flexible width with max constraint */}
          <main className="flex-1 min-w-0 max-w-4xl pb-20 md:pb-8">
            <div className="w-full">
              {children}
            </div>
          </main>

          {/* Right Sidebar - For future features (ads, suggestions, etc.) */}
          <aside className="hidden xl:block w-80 shrink-0"></aside>
        </div>
      </div>
    </div>
  );
}
