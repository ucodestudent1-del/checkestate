"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, FileText, Edit3, Eye } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Request = {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  submittedAt: string;
  property: { name: string };
  unit: { unitNumber: string } | null;
};

export default function TenantRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tenant/requests?search=${encodeURIComponent(search)}`);
    const json = await res.json();
    setRequests(json.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const statusConfig: Record<string, { className: string }> = {
    NEW: { className: "bg-slate-100 text-slate-700" },
    UNDER_REVIEW: { className: "bg-blue-100 text-blue-700" },
    AWAITING_APPROVAL: { className: "bg-amber-100 text-amber-700" },
    APPROVED: { className: "bg-blue-100 text-blue-700" },
    ASSIGNED: { className: "bg-indigo-100 text-indigo-700" },
    SCHEDULED: { className: "bg-purple-100 text-purple-700" },
    IN_PROGRESS: { className: "bg-orange-100 text-orange-700" },
    WAITING_FOR_PARTS: { className: "bg-amber-100 text-amber-700" },
    COMPLETED: { className: "bg-green-100 text-green-700" },
    CLOSED: { className: "bg-slate-100 text-slate-700" },
    CANCELLED: { className: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Maintenance Requests</h1>
          <p className="text-slate-600">Track and manage all your maintenance requests</p>
        </div>
        <Link href="/tenant/requests/new">
          <Button>
            <FileText className="ml-2 h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="ml-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Request #</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Title</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Property</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Category</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Priority</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Status</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Date</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pl-4 text-slate-900 font-medium">{r.requestNumber}</td>
                  <td className="py-3 pl-4 text-slate-600">{r.title}</td>
                  <td className="py-3 pl-4 text-slate-600">{r.property.name}</td>
                  <td className="py-3 pl-4 text-slate-600">{r.category}</td>
                  <td className="py-3 pl-4 text-slate-600">{r.priority}</td>
                  <td className="py-3 pl-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${{
                      NEW: "bg-slate-100 text-slate-700",
                      UNDER_REVIEW: "bg-blue-100 text-blue-700",
                      AWAITING_APPROVAL: "bg-amber-100 text-amber-700",
                      APPROVED: "bg-blue-100 text-blue-700",
                      ASSIGNED: "bg-indigo-100 text-indigo-700",
                      SCHEDULED: "bg-purple-100 text-purple-700",
                      IN_PROGRESS: "bg-orange-100 text-orange-700",
                      WAITING_FOR_PARTS: "bg-amber-100 text-amber-700",
                      COMPLETED: "bg-green-100 text-green-700",
                      CLOSED: "bg-slate-100 text-slate-700",
                      CANCELLED: "bg-red-100 text-red-700",
                    }[r.status]}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-xs">{new Date(r.submittedAt).toLocaleDateString()}</td>
                  <td className="text-right py-3 pr-4">
                    <Link href={`/tenant/requests/${r.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 pt-6 text-center text-slate-500">
                    No maintenance requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}