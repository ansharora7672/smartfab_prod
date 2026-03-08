"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-section-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center leading-none mb-3">
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
                placeholder="admin@smartfab.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-section-bg text-text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors duration-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">
                Password
              </label>
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
    </div>
  );
}
