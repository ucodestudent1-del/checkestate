"use client";

import { useState, useEffect } from "react";
import { User, Building2, Shield, CreditCard, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const json = await r.json();
      setUser(json?.user || json);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and organization settings</p>
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Security</h2>
        <div className="space-y-3">
          <Button variant="outline" onClick={() => {}}>
            <User className="mr-2 h-4 w-4" /> Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}
