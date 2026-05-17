"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// =============================================================================
// Quote Response Page — PUBLIC (no login required)
// =============================================================================
// Customers click approve/decline/modify links in the quote email.
// This page reads token + action from the URL, calls the backend, and
// shows a branded confirmation message.
// =============================================================================

function QuoteResponseContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "already_done">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !action) {
      setStatus("error");
      setMessage("Invalid link. Please use the buttons in your email.");
      return;
    }

    const submitResponse = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/quotes/respond?token=${encodeURIComponent(token)}&action=${encodeURIComponent(action)}`
        );

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || "Something went wrong.");
        }

        const data = await res.json();
        
        // If backend says they already responded, show an info state instead
        if (data.already_responded) {
          setStatus("already_done");
          setMessage(data.message);
        } else {
          setStatus("success");
          setMessage(data.message);
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Failed to process your response. Please contact SmartFab Lathe.");
      }
    };

    submitResponse();
  }, [token, action]);

  const actionConfig: Record<string, { icon: React.ReactNode; title: string; color: string; bgColor: string; borderColor: string }> = {
    APPROVED: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-5" />
        </svg>
      ),
      title: "Quote Approved",
      color: "#16A34A",
      bgColor: "#DCFCE7",
      borderColor: "#16A34A",
    },
    REJECTED: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      ),
      title: "Quote Declined",
      color: "#DC2626",
      bgColor: "#FEE2E2",
      borderColor: "#DC2626",
    },
    MODIFICATION_REQUESTED: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      ),
      title: "Changes Requested",
      color: "#92400E",
      bgColor: "#FEF3C7",
      borderColor: "#F59E0B",
    },
  };

  const config = actionConfig[action || ""] || {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
    title: "Unknown Action",
    color: "#64748B",
    bgColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* SmartFab Branding Header */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-black text-[#1E3A8A] tracking-[0.1em] leading-none">
            SMARTFAB
          </h1>
          <div className="flex items-center justify-center my-1">
            <div className="h-[2px] w-10 bg-[#1E3A8A]" />
            <span className="mx-2 text-[#1E3A8A] font-extrabold text-base tracking-[0.3em]">LATHE</span>
            <div className="h-[2px] w-10 bg-[#1E3A8A]" />
          </div>
          <p className="text-[10px] text-[#1E3A8A] tracking-[0.08em] uppercase font-bold mt-1">
            Engineering Accuracy. Crafted in Metal.
          </p>
        </div>

        {/* Response Card */}
        <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-[0_4px_30px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Loading State */}
          {status === "loading" && (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
              <p className="text-sm font-medium text-[#334155]">Processing your response...</p>
              <p className="text-xs text-[#64748B] mt-1">This will only take a moment.</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="p-0">
              {/* Color Banner */}
              <div
                className="py-8 text-center"
                style={{ backgroundColor: config.bgColor }}
              >
                <div className="flex justify-center mb-3">{config.icon}</div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: config.color }}
                >
                  {config.title}
                </h2>
              </div>

              {/* Message */}
              <div className="p-8 text-center">
                <p className="text-sm text-[#334155] leading-relaxed max-w-sm mx-auto">
                  {message}
                </p>

                {/* Extra messaging based on action */}
                {action === "APPROVED" && (
                  <div className="mt-6 p-4 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1]">
                    <p className="text-xs text-[#64748B] font-medium">
                      <strong className="text-[#0F172A]">Next Step:</strong> Our team will send you the Local Purchase Order (LPO) details shortly. Please check your email.
                    </p>
                  </div>
                )}

                {action === "REJECTED" && (
                  <div className="mt-6 p-4 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1]">
                    <p className="text-xs text-[#64748B] font-medium">
                      We appreciate your time. If you change your mind or have any questions, feel free to contact us.
                    </p>
                  </div>
                )}

                {action === "MODIFICATION_REQUESTED" && (
                  <div className="mt-6 p-4 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1]">
                    <p className="text-xs text-[#64748B] font-medium">
                      A team member will reach out to discuss the changes you'd like. Expect a call or email within 24 hours.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Already Responded State */}
          {status === "already_done" && (
            <div className="p-0">
              <div className="py-8 text-center bg-[#DBEAFE]">
                <div className="flex justify-center mb-3">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#2563EB]">
                  Already Responded
                </h2>
              </div>
              <div className="p-8 text-center">
                <p className="text-sm text-[#334155] leading-relaxed max-w-sm mx-auto">
                  {message}
                </p>
                <div className="mt-6 p-4 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1]">
                  <p className="text-xs text-[#64748B] font-medium">
                    If you need to make changes, please contact us at{" "}
                    <a href="mailto:lathe.smartfab@gmail.com" className="text-[#2563EB] font-medium underline">
                      lathe.smartfab@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#DC2626] mb-2">Something Went Wrong</h2>
              <p className="text-sm text-[#334155] leading-relaxed max-w-sm mx-auto">
                {message}
              </p>
              <div className="mt-6 p-4 bg-[#F1F5F9] rounded-xl border border-[#CBD5E1]">
                <p className="text-xs text-[#64748B]">
                  Need help? Contact us at{" "}
                  <a href="mailto:lathe.smartfab@gmail.com" className="text-[#2563EB] font-medium underline">
                    lathe.smartfab@gmail.com
                  </a>{" "}
                  or call <strong>+971 542133637</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#94A3B8] mt-8 leading-relaxed">
          SmartFab Lathe · Industrial 2, Ajman, UAE<br />
          +971 542133637 · lathe.smartfab@gmail.com
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Suspense Wrapper
// =============================================================================
// Next.js requires useSearchParams() to be wrapped in <Suspense>
// because search params are only available on the client side.
// Without this, you get: "useSearchParams() should be wrapped in Suspense"
// =============================================================================
export default function QuoteResponsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <QuoteResponseContent />
    </Suspense>
  );
}
