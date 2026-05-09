"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [forgotError, setForgotError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotStatus("loading");
    setForgotError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setForgotError(data.detail || "Something went wrong. Please try again.");
        setForgotStatus("error");
        return;
      }

      setForgotStatus("done");
    } catch {
      setForgotError("Network error. Could not reach the server.");
      setForgotStatus("error");
    }
  }

  function closeForgotModal() {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotStatus("idle");
    setForgotError("");
  }

  return (
    <div className="min-h-screen bg-section-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center leading-none mb-3">
            <Image src="/SmartFab_FinalLogo.png" alt="SmartFab Logo" width={72} height={72} className="object-contain mb-3" />
            <span className="font-heading font-bold text-2xl tracking-[0.2em] text-primary-900">
              SMARTFAB
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="block w-6 h-px bg-primary-600" />
              <span className="font-heading font-semibold text-xs tracking-[0.3em] text-primary-600">
                LATHE
              </span>
              <span className="block w-6 h-px bg-primary-600" />
            </div>
          </div>
          <p className="text-sm text-muted">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-primary-600 hover:text-primary-900 font-medium transition-colors duration-300"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium text-sm transition-all duration-500 ease-out hover:bg-primary-900 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          SmartFab Lathe Internal Portal
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-sm p-8">
            {forgotStatus === "done" ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-primary-900 font-heading">Check your email</h2>
                <p className="text-sm text-muted leading-relaxed">
                  If <span className="font-medium text-text-primary">{forgotEmail}</span> is registered, a temporary password has been sent to it. Use it to sign in and then change your password from the dashboard.
                </p>
                <button
                  onClick={closeForgotModal}
                  className="w-full bg-primary-600 hover:bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium transition-colors duration-300"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-primary-900 font-heading mb-1">Reset Password</h2>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  Enter your email address and we will send you a temporary password.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  {forgotError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                      {forgotError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotStatus === "loading"}
                    className="w-full bg-primary-600 hover:bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotStatus === "loading" ? "Sending..." : "Send Temporary Password"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full text-sm text-muted hover:text-text-primary transition-colors duration-300 py-1"
                  >
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
