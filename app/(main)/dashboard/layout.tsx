import { FeedSidebar } from '@/components/feed-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100vh] min-h-[100dvh] bg-background w-full">
      <div className="w-full mx-auto px-1 sm:px-2 lg:px-3">
        <div className="flex gap-2 lg:gap-3 w-full">
          {/* Left Sidebar - Fixed position with minimal padding */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <FeedSidebar />
          </aside>

          {/* Main Content - Full width feed */}
          <main className="flex-1 min-w-0 pb-20 md:pb-8 w-full">
            <div className="w-full">
              {children}
            </div>
          </main>

          {/* Right Sidebar - For future features (ads, suggestions, etc.) */}
          <aside className="hidden xl:block w-80 2xl:w-96 shrink-0"></aside>
        </div>
      </div>
    </div>
  );
}
