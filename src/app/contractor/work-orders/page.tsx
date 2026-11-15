"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, FileText, Eye, Calendar, Wrench } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string | null;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  property: { name: string } | null;
  unit: { unitNumber: string } | null;
  maintenanceRequest: {
    title: string;
    description: string;
    category: string;
    priority: string;
    property: { name: string };
    unit: { unitNumber: string } | null;
  };
};

export default function ContractorWorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/contractor/work-orders?${params.toString()}`);
    const json = await res.json();
    setWorkOrders(json.data || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const statusClassMap: Record<string, string> = {
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
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Work Orders</h1>
          <p className="text-slate-600">Manage your assigned work orders</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work orders..."
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Work Order #</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Title</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Property</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Status</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Scheduled</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => (
                <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pl-4 text-slate-900 font-medium">{w.workOrderNumber}</td>
                  <td className="py-3 pl-4 text-slate-600">{w.title}</td>
                  <td className="py-3 pl-4 text-slate-600">{w.property?.name || "—"}</td>
                  <td className="py-3 pl-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusClassMap[w.status] || "bg-slate-100 text-slate-700"}`}>
                      {w.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-500 text-xs">{w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString() : "—"}</td>
                  <td className="text-right py-3 pr-4">
                    <Link href={`/contractor/work-orders/${w.id}`}>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <FileText className="h-3 w-3" />
                        View
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
              {workOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 pt-6 text-center text-slate-500">
                    No work orders found.
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