import { useState, useEffect } from "react";
import { UserPlus, Trash2, LogOut, Users, Shield, User } from "lucide-react";
import { authService } from "../services/authService";
import type { StaffAccount } from "../types/auth";

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    role: "staff" | "admin";
  }>({
    username: "",
    password: "",
    role: "staff",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadStaffAccounts();
  }, []);

  const loadStaffAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await authService.getAllStaffAccounts();
      setStaffAccounts(accounts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load staff accounts"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      await authService.createStaffAccount(
        formData.username,
        formData.password,
        formData.role
      );
      setFormData({ username: "", password: "", role: "staff" });
      setShowCreateForm(false);
      await loadStaffAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await authService.deleteStaffAccount(id);
      await loadStaffAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  const handleToggleActive = async (account: StaffAccount) => {
    try {
      await authService.updateStaffAccount(account.id, {
        is_active: !account.is_active,
      });
      await loadStaffAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account");
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      onLogout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-slate-400">
                Manage staff accounts and permissions
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Staff Accounts ({staffAccounts.length})
                </h2>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
            </div>

            {showCreateForm && (
              <form
                onSubmit={handleCreateAccount}
                className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "staff" | "admin",
                      })
                    }
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
                  >
                    {creating ? "Creating..." : "Create Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Loading staff accounts...</p>
              </div>
            ) : staffAccounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No staff accounts yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {staffAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-slate-600 p-2 rounded-lg">
                        {account.role === "admin" ? (
                          <Shield className="w-4 h-4 text-purple-400" />
                        ) : (
                          <User className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {account.email}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {account.role === "admin" ? "Administrator" : "Staff"}{" "}
                          • {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(account)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          account.is_active
                            ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        }`}
                      >
                        {account.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
