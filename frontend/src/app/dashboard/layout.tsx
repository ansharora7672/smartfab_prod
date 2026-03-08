"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  // Login page gets no sidebar
  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-section-bg flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-primary-900 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col leading-none">
            <span className="font-heading font-bold text-base tracking-[0.2em]">
              SMARTFAB
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="block w-4 h-px bg-white/30" />
              <span className="font-heading font-semibold text-[10px] tracking-[0.3em] text-white/70">
                LATHE
              </span>
              <span className="block w-4 h-px bg-white/30" />
            </div>
          </div>
          <p className="text-xs text-white/40 mt-2">
            {user.role === "ADMIN" ? "Admin Panel" : "Staff Panel"}
          </p>
        </div>

        <nav className="flex-1 p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-300"
          >
            Dashboard
          </a>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-3">
            <p className="text-sm font-medium text-white">{user.email}</p>
            <p className="text-xs text-white/40">{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-300"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
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
