"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("New password must contain at least one letter and one number.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to change password. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("done");
    } catch {
      setError("Network error. Could not reach the server.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4 bg-black/50">
      <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-8">
        {status === "done" ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-primary-900 font-heading">Password Updated</h2>
            <p className="text-sm text-muted leading-relaxed">
              Your password has been changed successfully.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-primary-600 hover:bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium transition-colors duration-300"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-primary-900 font-heading">Change Password</h2>
              <button onClick={onClose} className="text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, include letters and numbers"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary-600 hover:bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {status === "loading" ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const sidebarContent = (
    <>
      {/* Branding */}
      <div className="p-6 border-b border-border bg-section-bg shadow-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/images/smartfab_white_logo.png"
            alt="SmartFab Lathe"
            width={48}
            height={48}
            className="shrink-0 object-contain drop-shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-[15px] font-extrabold tracking-wider text-primary-900 font-heading uppercase">
              SMARTFAB LATHE
            </span>
            <span className="text-[10px] text-muted font-bold tracking-wider">
              {user.role === "ADMIN" ? "Admin Console" : "Staff Console"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname === "/dashboard"
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/tickets/pending"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/tickets/pending")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Pending Consultations
        </Link>
        <Link
          href="/dashboard/transition"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/transition")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Quote Preparation
        </Link>
        <Link
          href="/dashboard/vendors"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/vendors")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Vendors
        </Link>

        <Link
          href="/dashboard/availability"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/availability")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          My Availability
        </Link>

        <Link
          href="/dashboard/active-orders"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/active-orders")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Active Orders
        </Link>
        <Link
          href="/dashboard/completed"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/completed")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Completed Orders
        </Link>
        <Link
          href="/dashboard/drivers"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
            pathname.startsWith("/dashboard/drivers")
              ? "text-white bg-white/10"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          Drivers
        </Link>

        {/* Admin Only */}
        {user.role === "ADMIN" && (
          <Link
            href="/dashboard/staff"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ${
              pathname === "/dashboard/staff"
                ? "text-white bg-white/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Staff Management
          </Link>
        )}
      </nav>

      {/* User info + settings */}
      <div className="p-4 border-t border-white/10 relative">
        {/* Settings popover */}
        {settingsOpen && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setSettingsOpen(false)}
            />
            <div className="absolute bottom-full left-4 right-4 mb-2 z-20 bg-white rounded-xl border border-border shadow-xl overflow-hidden">
              <button
                onClick={() => { setSettingsOpen(false); setChangePasswordOpen(true); }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-text-primary hover:bg-section-bg transition-colors duration-200"
              >
                Change Password
              </button>
              <div className="h-px bg-border mx-4" />
              <button
                onClick={() => { setSettingsOpen(false); logout(); }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </>
        )}

        {/* User row */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.email}</p>
            <p className="text-xs text-white/40">{user.role}</p>
          </div>
          <button
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="ml-3 shrink-0 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-section-bg">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden print:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute text-white/50 top-5 right-4 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed flex-col hidden h-screen text-white lg:flex w-64 bg-primary-900 print:hidden">
        {sidebarContent}
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-64 print:ml-0 print:min-h-0 bg-section-bg print:bg-white">
        {/* MOBILE TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-white border-b lg:hidden border-border print:hidden shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-1 -ml-1 text-primary-900 hover:bg-section-bg rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <Image
              src="/images/smartfab_white_logo.png"
              alt="SmartFab Logo"
              width={32}
              height={32}
              className="shrink-0 object-contain"
            />
            <span className="text-[15px] font-extrabold tracking-widest font-heading text-primary-900 uppercase">
              SmartFab Lathe
            </span>
          </div>
          
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 print:p-0">{children}</main>
      </div>

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
      )}
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
