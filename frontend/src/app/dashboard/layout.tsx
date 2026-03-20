"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import Image from "next/image";


function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when navigating to a new page
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== "/dashboard/login") {
      router.push("/dashboard/login");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-section-bg">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  if (!user) return null;

  // Shared sidebar content — used in both mobile overlay and desktop fixed sidebar
  const sidebarContent = (
    <>
      {/* Branding */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
<Image
  src="/smartfab_white_logo.png"
  alt="SmartFab Lathe"
  width={40}
  height={40}
  className="object-contain flex-shrink-0 rounded-xl"
/>


          <div className="flex flex-col">
            <span className="font-heading font-bold text-sm tracking-wider text-white">
              SMARTFAB LATHE
            </span>
            <span className="text-[10px] text-white/40 font-medium tracking-wider">
              {user.role === "ADMIN" ? "Admin Console" : "Staff Console"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <a
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname === "/dashboard"
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Dashboard
        </a>

        {user.role === "ADMIN" && (
          <a
            href="/dashboard/staff"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
              pathname === "/dashboard/staff"
                ? "text-white bg-white/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Staff Management
          </a>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-sm font-medium text-white">{user.email}</p>
          <p className="text-xs text-white/40">{user.role}</p>
        </div>
        <button
  onClick={logout}
  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-[#DC2626] bg-white/5 border border-white/10 hover:bg-[#DC2626] hover:text-white hover:border-transparent transition-all duration-500 ease-out"
>
  Sign Out
</button>

      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-section-bg flex">

      {/* MOBILE OVERLAY — dark backdrop that closes the sidebar when clicked */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR — slides in from the left */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button inside mobile sidebar */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-5 right-4 text-white/50 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* DESKTOP SIDEBAR — always visible, fixed */}
      <aside className="hidden lg:flex w-64 bg-primary-900 text-white flex-col fixed h-screen">
        {sidebarContent}
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* MOBILE TOP BAR — only visible on small screens */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-border sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          <span className="font-heading font-bold text-sm tracking-wider text-primary-900">
            SMARTFAB LATHE
          </span>
          <div className="w-5" /> {/* Spacer to center the title */}
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
