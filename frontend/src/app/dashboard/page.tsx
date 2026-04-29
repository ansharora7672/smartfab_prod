"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending_tickets_count: 0, active_orders_count: 0, quotes_sent_count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
          credentials: "include",
        });
        if (res.ok) setStats(await res.json());
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Pending Tickets", value: stats.pending_tickets_count },
    { label: "Active Orders", value: stats.active_orders_count },
    { label: "Quotes Sent", value: stats.quotes_sent_count },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 font-heading">
          Welcome back, {user?.full_name || user?.email?.split("@")[0]}
        </h1>
        <p className="text-muted text-sm mt-1">
          {user?.role === "ADMIN" ? "You have full admin access to all features." : "Here is your staff dashboard."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">{card.label}</p>
            <p className="text-3xl font-bold text-primary-900">
              {statsLoading ? <span className="text-border animate-pulse">—</span> : card.value}
            </p>
          </div>
        ))}
      </div>

      {user?.role === "ADMIN" && (
        <div className="mt-8 bg-primary-100 rounded-2xl border border-primary-600/20 p-6">
          <p className="text-sm font-semibold text-primary-900 mb-1">Admin Controls</p>
          <p className="text-sm text-muted">
            Staff management, vendor management, and system settings are accessible from the sidebar.
          </p>
        </div>
      )}
    </div>
  );
}
