"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { AdminUserListItem } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (roleFilter !== "ALL") {
        params.set("role", roleFilter);
      }
      if (search.trim()) {
        params.set("q", search.trim());
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data);
        setTotalPages(json.meta.totalPages || 1);
        setTotal(json.meta.total || 0);
      } else {
        toastError(json.message || "Failed to retrieve users");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleRole = async (targetUser: AdminUserListItem) => {
    if (targetUser.id === currentAdmin?.id) {
      toastError("You cannot modify your own administrator role.");
      return;
    }

    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    const confirmMsg =
      newRole === "ADMIN"
        ? `Are you sure you want to promote @${targetUser.username} to ADMINISTRATOR? They will have full access to manage users and articles.`
        : `Are you sure you want to demote @${targetUser.username} to a regular USER?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(targetUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetUser.id, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        success(`User @${targetUser.username} role updated to ${newRole}`);
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to update role");
      }
    } catch {
      toastError("Error updating role");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleVerification = async (targetUser: AdminUserListItem) => {
    const newStatus = !targetUser.isEmailVerified;
    const confirmMsg = newStatus
      ? `Manually verify email for @${targetUser.username}? (Bypasses OTP verification)`
      : `Revoke email verification for @${targetUser.username}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoadingId(targetUser.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetUser.id, isEmailVerified: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, isEmailVerified: newStatus } : u
          )
        );
        success(newStatus ? `Verified email for @${targetUser.username}` : `Revoked verification for @${targetUser.username}`);
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to update verification status");
      }
    } catch {
      toastError("Error updating verification status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUserListItem) => {
    if (targetUser.id === currentAdmin?.id) {
      toastError("You cannot delete your own account.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete user @${targetUser.username}? All their published content will also be removed.`
      )
    ) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users?id=${targetUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        setTotal((prev) => Math.max(0, prev - 1));
        success(`User @${targetUser.username} has been deleted.`);
      } else {
        const json = await res.json();
        toastError(json.message || "Failed to delete user");
      }
    } catch {
      toastError("Error deleting user");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            User Community
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage writer permissions, administrator roles, and verification overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-accent transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]">
        {/* Role Filters */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.05] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRoleFilter("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === "ALL"
                ? "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            All Members ({total})
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleFilter("ADMIN");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === "ADMIN"
                ? "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Admins
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleFilter("USER");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === "USER"
                ? "bg-white dark:bg-[#16171d] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Writers
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username, email, or display name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.01] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-4 sm:px-6">Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Articles</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-accent mb-2" />
                    Loading community members…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    No members found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentAdmin?.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition"
                    >
                      {/* Member Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(u.name || u.username || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {u.name || u.username}
                              </p>
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {u.role === "ADMIN" ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 inline-flex items-center gap-1">
                            <Shield size={10} /> ADMIN
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full uppercase bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                            WRITER
                          </span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <XCircle size={13} /> Unverified
                          </span>
                        )}
                      </td>

                      {/* Article Count */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
                          <FileText size={12} className="text-gray-400" />
                          {u._count?.blogs || 0}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-gray-400">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Promote / Demote */}
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            disabled={isCurrent || actionLoadingId === u.id}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.role === "ADMIN"
                                ? "border-amber-300 dark:border-amber-900/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                : "border-purple-300 dark:border-purple-900/40 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                            }`}
                            title={
                              isCurrent
                                ? "Cannot demote yourself"
                                : u.role === "ADMIN"
                                ? "Demote to Writer"
                                : "Promote to Admin"
                            }
                          >
                            {u.role === "ADMIN" ? "Demote" : "Make Admin"}
                          </button>

                          {/* Toggle Verification */}
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(u)}
                            disabled={actionLoadingId === u.id}
                            className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-accent hover:text-accent transition cursor-pointer"
                            title={
                              u.isEmailVerified
                                ? "Revoke email verification"
                                : "Manually verify email"
                            }
                          >
                            {u.isEmailVerified ? "Unverify" : "Verify"}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent || actionLoadingId === u.id}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isCurrent
                                ? "Cannot delete your own account"
                                : "Delete user account"
                            }
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
