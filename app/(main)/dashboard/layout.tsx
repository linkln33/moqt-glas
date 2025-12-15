import { FeedSidebar } from '@/components/feed-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex gap-3 lg:gap-4 xl:gap-6">
          {/* Left Sidebar - Fixed position with minimal padding */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FeedSidebar />
          </aside>

          {/* Main Content - Wider feed without max constraint */}
          <main className="flex-1 min-w-0 pb-20 md:pb-8 max-w-[1400px]">
            <div className="w-full max-w-none">
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
