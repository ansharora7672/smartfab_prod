// this page is for the staff management
"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Check, X, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function StaffManagementPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string; tempPass: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", role: "STAFF" });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);

  // Feedback banner state (success/error messages shown inline on the page)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Confirmation dialog state (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Auto-dismiss feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/`, {
        credentials: "include",
      });
      if (!res.ok) {
        setFeedback({ type: "error", message: "Failed to load users. Please refresh." });
        return;
      }
      const data = await res.json();
      setUsers(data.users);
      setTotalUsers(data.total);
    } catch {
      setFeedback({ type: "error", message: "Network error. Could not reach the server." });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          role: formData.role,
        }),
      });
      if (!response.ok) {
        let errorMessage = "Failed to create user. Please try again.";
        try {
          const err = await response.json();
          if (typeof err.detail === "string") {
            errorMessage = err.detail;
          } else if (Array.isArray(err.detail)) {
            // FastAPI validation errors are arrays
            errorMessage = err.detail[0]?.msg || errorMessage;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.detail && typeof err.detail === "object") {
             errorMessage = JSON.stringify(err.detail);
          }
        } catch (e) {
          // If response isn't JSON, keep the default errorMessage
        }
        setCreateError(errorMessage);
        return;
      }
      const data = await response.json();
      setSuccessData({ email: data.email, tempPass: data.temporary_password });
      fetchUsers();
    } catch {
      setCreateError("Network error. Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.role === newRole) return;

    setConfirmDialog({
      open: true,
      title: `Change ${user.full_name}'s role?`,
      description: `This will change their role from ${user.role} to ${newRole}. This affects their system permissions.`,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/role`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ role: newRole }),
            }
          );
          if (!res.ok) {
            const err = await res.json();
            setFeedback({ type: "error", message: err.detail || "Failed to update role" });
            fetchUsers();
            return;
          }
          setFeedback({ type: "success", message: `${user.full_name}'s role updated to ${newRole}` });
          fetchUsers();
        } catch {
          setFeedback({ type: "error", message: "Something went wrong. Please try again." });
          fetchUsers();
        }
      },
    });
  };

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const action = currentStatus ? "deactivate" : "activate";

    setConfirmDialog({
      open: true,
      title: `${currentStatus ? "Deactivate" : "Activate"} ${user.full_name}?`,
      description: currentStatus
        ? "This user will no longer be able to log in or access the system."
        : "This user will regain access to the system.",
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/status`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ is_active: !currentStatus }),
            }
          );
          if (!res.ok) {
            const err = await res.json();
            setFeedback({ type: "error", message: err.detail || "Failed to update status" });
            return;
          }
          setFeedback({ type: "success", message: `${user.full_name} ${action}d successfully` });
          fetchUsers();
        } catch {
          setFeedback({ type: "error", message: "Something went wrong. Please try again." });
        }
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setConfirmDialog({
      open: true,
      title: `Permanently delete ${user.full_name}?`,
      description: `This will remove ${user.full_name} (${user.email}) from the system entirely. This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );
          if (!res.ok) {
            const err = await res.json();
            setFeedback({ type: "error", message: err.detail || "Failed to delete user." });
            return;
          }
          setFeedback({ type: "success", message: `${user.full_name} has been permanently deleted.` });
          fetchUsers();
        } catch {
          setFeedback({ type: "error", message: "Something went wrong. Please try again." });
        }
      },
    });
  };

  const copyToClipboard = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.tempPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">
            Staff Management
          </h1>
          <p className="text-muted text-sm max-w-xl leading-relaxed">
            Manage organizational users, permissions, and active workload.
          </p>
        </div>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSuccessData(null);
              setCreateError(null);
              setFormData({ fullName: "", email: "", role: "STAFF" });
            }
          }}
        >
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 bg-primary-900 hover:bg-primary-900/90 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-500 ease-out shadow-[0_4px_20px_rgba(0,0,0,0.03)] w-full sm:w-auto justify-center">
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md bg-white border border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-primary-900 font-heading">
                Add Organization Member
              </DialogTitle>
              <DialogDescription className="text-muted text-sm">
                A secure temporary password will be generated automatically.
              </DialogDescription>
            </DialogHeader>

            {successData ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 bg-success-bg rounded-full flex items-center justify-center">
                  <Check className="w-7 h-7 text-success" />
                </div>
                <p className="text-center font-semibold text-primary-900">User created successfully!</p>
                <p className="text-xs text-muted text-center">
                  Share this temporary password with <span className="font-medium text-text-secondary">{successData.email}</span>
                </p>
                <div className="flex w-full items-center justify-between p-4 bg-section-bg border border-border rounded-xl">
                  <code className="text-base font-mono font-bold text-primary-900 tracking-wider">
                    {successData.tempPass}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-muted hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-100"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                {createError && (
                  <div className="px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-sm font-medium text-[#DC2626] flex items-center justify-between">
                    <span>{createError}</span>
                    <button type="button" onClick={() => setCreateError(null)} className="text-current opacity-60 hover:opacity-100 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Full Name</label>
                  <input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 bg-white text-primary-900"
                    placeholder="e.g. Marcus Thorne"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 bg-white text-primary-900"
                    placeholder="firstname.lastname@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Operational Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 bg-white text-primary-900"
                  >
                    <option value="STAFF">Staff (Operational)</option>
                    <option value="ADMIN">Admin (Console Access)</option>
                  </select>
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full mt-2 bg-primary-600 hover:bg-primary-900 text-white py-2.5 rounded-xl text-sm font-medium transition-colors duration-500 ease-out"
                >
                  {loading ? "Generating User..." : "Create User Securely"}
                </button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-border p-4 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted mb-1 md:mb-2">Total Personnel</p>
          <p className="text-2xl md:text-3xl font-bold text-primary-900">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted mb-1 md:mb-2">Active Users</p>
          <p className="text-2xl md:text-3xl font-bold text-primary-900">
            {users.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] col-span-2 lg:col-span-1">
          <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted mb-1 md:mb-2">Admins</p>
          <p className="text-2xl md:text-3xl font-bold text-primary-900">
            {users.filter((u) => u.role === "ADMIN").length}
          </p>
        </div>
      </div>

      {/* Feedback Banner — fixed position, doesn't push content */}
{feedback && (
  <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 shadow-lg transition-all duration-500 ease-out
    ${feedback.type === "success"
      ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]"
      : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"
    }`}
  >
    <span>{feedback.message}</span>
    <button onClick={() => setFeedback(null)} className="text-current opacity-60 hover:opacity-100">
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
)}


      {/* DESKTOP TABLE — hidden on mobile */}
      <div className="hidden md:block bg-white rounded-2xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest">Updated</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-muted uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-b-0 hover:bg-section-bg/40 transition-colors duration-300">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-white uppercase">
                          {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <span className="font-semibold text-sm text-text-primary">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-section-bg text-text-secondary border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-600/20 transition-colors duration-300 appearance-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusChange(u.id, u.is_active)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-500 ease-out cursor-pointer
                        ${u.is_active
                          ? "bg-[#DCFCE7] text-[#16A34A] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                          : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#DCFCE7] hover:text-[#16A34A]"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} />
                      {u.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">{formatDateTime(u.created_at)}</td>
                  <td className="px-6 py-4 text-xs text-muted">{formatDateTime(u.updated_at)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition-all duration-300"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-section-bg/30">
          <span className="text-xs text-muted font-medium">
            Showing {users.length} of {totalUsers} personnel
          </span>
        </div>
      </div>

      {/* MOBILE CARDS — visible only on small screens */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-border p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            {/* Top row: avatar + name + status badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-white uppercase">
                    {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-text-primary">{u.full_name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleStatusChange(u.id, u.is_active)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-500 ease-out cursor-pointer
                  ${u.is_active
                    ? "bg-[#DCFCE7] text-[#16A34A] hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                    : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#DCFCE7] hover:text-[#16A34A]"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} />
                {u.is_active ? "Active" : "Inactive"}
              </button>
            </div>

            {/* Bottom row: role + date + delete */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-section-bg text-text-secondary border border-border cursor-pointer focus:outline-none appearance-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="STAFF">Staff</option>
              </select>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted">Joined {formatDate(u.created_at)}</span>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition-all duration-300"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center py-2">
          <span className="text-xs text-muted font-medium">
            Showing {users.length} of {totalUsers} personnel
          </span>
        </div>
      </div>

      {/* Confirmation AlertDialog — replaces window.confirm() */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="bg-white border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-primary-900 font-heading">
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border text-text-secondary hover:bg-section-bg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog.onConfirm}
              className="rounded-xl bg-primary-600 hover:bg-primary-900 text-white transition-colors duration-500"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
