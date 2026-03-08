"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Welcome back, {user?.email?.split("@")[0]}
        </h1>
        <p className="text-muted text-sm mt-1">
          {user?.role === "ADMIN"
            ? "You have full admin access to all features."
            : "Here is your staff dashboard."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Pending Tickets</p>
          <p className="text-3xl font-bold text-primary-900">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Active Orders</p>
          <p className="text-3xl font-bold text-primary-900">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Quotes Sent</p>
          <p className="text-3xl font-bold text-primary-900">0</p>
        </div>
      </div>

      {user?.role === "ADMIN" && (
        <div className="mt-8 bg-primary-100 rounded-2xl border border-primary-600/20 p-6">
          <p className="text-sm font-semibold text-primary-900 mb-1">Admin Controls</p>
          <p className="text-sm text-muted">
            Staff management, vendor management, and system settings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
