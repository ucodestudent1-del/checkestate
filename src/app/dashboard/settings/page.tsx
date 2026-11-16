"use client";

import { useState, useEffect } from "react";
import {
  User,
  Building2,
  Shield,
  CreditCard,
  Bell,
  LogOut,
  Download,
  Trash2,
  ShieldCheck,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Cookie preferences state
  const [cookiePrefs, setCookiePrefs] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const json = await r.json();
      setUser(json?.user || json);
      setLoading(false);
    });

    // Load cookie preferences
    const stored = localStorage.getItem("checkestate_cookie_preferences");
    if (stored) {
      try {
        setCookiePrefs(JSON.parse(stored));
      } catch {
        // use defaults
      }
    }
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Account deleted successfully");
        localStorage.clear();
        window.location.href = "/auth/login";
      } else {
        toast.error(json.error || "Failed to delete account");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/user/export", {
        method: "GET",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `checkestate-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Data exported successfully");
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to export data");
      }
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
      setShowExportConfirm(false);
    }
  };

  const toggleCookiePref = (category: string) => {
    setCookiePrefs((prev) => ({ ...prev, [category]: !prev[category] }));
    localStorage.setItem(
      "checkestate_cookie_preferences",
      JSON.stringify({ ...cookiePrefs, [category]: !cookiePrefs[category] })
    );
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Manage your account and organization settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowExportConfirm(true)}>
            <Download className="mr-2 h-4 w-4" /> Export My Data
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input defaultValue={user?.firstName || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input defaultValue={user?.lastName || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input defaultValue={user?.email || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input defaultValue={user?.phone || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization</h2>
        <p className="text-sm text-slate-600 mb-4">{user?.organizationName || "CheckEstate Organization"}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded border border-slate-200">
            <span className="text-sm text-slate-600">Plan</span>
            <span className="text-sm font-medium text-blue-600">Starter</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded border border-slate-200">
            <span className="text-sm text-slate-600">Units</span>
            <span className="text-sm font-medium text-slate-900">Limit: 10</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Cookie & Privacy Settings</h2>
        <p className="text-sm text-slate-600 mb-6">
          Manage your cookie preferences and data preferences below. You can update these preferences at any time.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Essential Cookies</p>
                <p className="text-xs text-slate-500">Required for site functionality</p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.essential}
                disabled
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Analytics Cookies</p>
                <p className="text-xs text-slate-600">Help us understand how you use our site</p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.analytics}
                onChange={() => toggleCookiePref("analytics")}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Marketing Cookies</p>
                <p className="text-xs text-slate-600">Used for personalized offers and communications</p>
              </div>
              <input
                type="checkbox"
                checked={cookiePrefs.marketing}
                onChange={() => toggleCookiePref("marketing")}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data & Privacy</h2>
        <p className="text-sm text-slate-600 mb-6">Manage your data and privacy settings.</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Export My Data</p>
                <p className="text-xs text-slate-600">Download all your data as JSON</p>
              </div>
              <button
                onClick={() => setShowExportConfirm(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Export
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Delete Account</p>
                <p className="text-xs text-slate-600">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center ${showDeleteConfirm ? "flex" : "hidden"}`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
        <div className="relative w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Delete Account</h2>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-slate-500 hover:text-slate-900"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to delete your account? This action cannot be undone. All your data including
            properties, maintenance requests, work orders, and expenses will be permanently deleted.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>

      {/* Export Confirmation Modal */}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center ${showExportConfirm ? "flex" : "hidden"}`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportConfirm(false)} />
        <div className="relative w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Export Data</h2>
            <button
              onClick={() => setShowExportConfirm(false)}
              className="text-slate-500 hover:text-slate-900"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            This will export all your data including properties, maintenance requests, work orders, contractors,
            and expenses as a JSON file.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowExportConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Download Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}