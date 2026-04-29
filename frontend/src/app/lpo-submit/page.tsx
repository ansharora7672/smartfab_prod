"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";

// ============================================================================
// LPO SUBMISSION PAGE
// ============================================================================
// This is a public-facing page where customers land after clicking
// the "Submit Your LPO Number" button in their approval email.
// ============================================================================

function LpoSubmitContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [lpoNumber, setLpoNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Status state: "idle" | "loading" | "success" | "error"
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Check if LPO was already submitted on page load
  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/quotes/lpo-status?token=${token}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail);
        
        if (data.quote_status !== "APPROVED") {
          setStatus("error");
          setMessage("This quote is not approved or is no longer valid for LPO submission.");
          return;
        }

        if (data.already_submitted) {
          setStatus("success");
          setMessage(`We already have your LPO (${data.lpo_number}) on file. Your order is active!`);
        } else {
          setStatus("idle"); // Show the form!
        }
      } catch (err: any) {
        setStatus("error");
        setMessage("Invalid or expired link.");
      }
    };
    
    checkStatus();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setStatus("error");
      setMessage("Missing security token. Please use the link from your email.");
      return;
    }

    if (!lpoNumber.trim()) {
      setStatus("error");
      setMessage("Please enter a valid LPO number.");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/quotes/submit-lpo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lpo_number: lpoNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit LPO");
      }

      setStatus("success");
      setMessage(data.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred. Please contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  // If no token is provided in the URL, show an error immediately
  if (!token && status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Link</h2>
        <p className="text-slate-600">
          This link is missing a security token. Please make sure you clicked the exact link provided in your email.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* LOADING STATE */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">Verifying secure link...</p>
        </div>
      )}

      {/* SUCCESS STATE */}
      {status === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-4 font-jakarta">LPO Submitted Successfully</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            {message}
          </p>
          <Button 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-medium"
            onClick={() => window.location.href = "/"}
          >
            Return to Homepage
          </Button>
        </div>
      )}

      {/* FORM STATE */}
      {status !== "success" && (
        <div className="bg-white border text-center border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 font-jakarta">Submit Your LPO</h2>
          <p className="text-slate-600 mb-8 text-sm">
            Please provide your Local Purchase Order number to finalize your order.
          </p>

          <form onSubmit={handleSubmit} className="text-left space-y-6">
            <div>
              <label htmlFor="lpo" className="block text-sm font-semibold text-slate-700 mb-2">
                Order/LPO Number *
              </label>
              <input
                id="lpo"
                type="text"
                placeholder="e.g. PO-2026-0492"
                value={lpoNumber}
                onChange={(e) => setLpoNumber(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300 text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            {status === "error" && (
              <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 text-sm rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-medium shadow-sm transition-colors"
            >
              {isLoading ? "Submitting..." : "Submit LPO"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function LpoSubmitPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
      {/* Header bar */}
      <header className="w-full bg-white border-b border-slate-200 py-6 px-8 flex justify-center mb-16 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-900 tracking-tight font-jakarta">SmartFab Lathe</h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase mt-1">Manufacturing Hub</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24">
        {/* Suspense handles the async reading of useSearchParams */}
        <Suspense fallback={<div className="text-center text-slate-500 mt-20 animate-pulse">Loading secure form...</div>}>
          <LpoSubmitContent />
        </Suspense>
      </main>
    </div>
  );
}
