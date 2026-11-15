"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Request = {
  id: string;
  requestNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  submittedAt: string;
  property: { name: string };
  unit: { unitNumber: string } | null;
};

export default function TenantDashboardPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/requests");
      const json = await res.json();
      if (res.ok) {
        const data = json.data || [];
        setRequests(data);
        setStats({
          total: data.length,
          open: data.filter((r: Request) => ["NEW", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED", "ASSIGNED"].includes(r.status)).length,
          inProgress: data.filter((r: Request) => ["SCHEDULED", "IN_PROGRESS", "WAITING_FOR_PARTS"].includes(r.status)).length,
          completed: data.filter((r: Request) => ["COMPLETED", "CLOSED"].includes(r.status)).length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch tenant data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    NEW: { label: "New", className: "bg-slate-100 text-slate-700", icon: <FileText className="h-3 w-3" /> },
    UNDER_REVIEW: { label: "Under Review", className: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
    AWAITING_APPROVAL: { label: "Awaiting Approval", className: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-3 w-3" /> },
    APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-700", icon: <CheckCircle className="h-3 w-3" /> },
    ASSIGNED: { label: "Assigned", className: "bg-indigo-100 text-indigo-700", icon: <CheckCircle className="h-3 w-3" /> },
    SCHEDULED: { label: "Scheduled", className: "bg-purple-100 text-purple-700", icon: <Clock className="h-3 w-3" /> },
    IN_PROGRESS: { label: "In Progress", className: "bg-orange-100 text-orange-700", icon: <Clock className="h-3 w-3" /> },
    WAITING_FOR_PARTS: { label: "Waiting for Parts", className: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-3 w-3" /> },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
    CLOSED: { label: "Closed", className: "bg-slate-100 text-slate-700", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3" /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Overview of your maintenance requests</p>
        </div>
        <Link href="/tenant/requests/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" /> Submit Request
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <FileText className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Requests</h2>
          <Link href="/tenant/requests" className="text-sm text-blue-600 hover:text-blue-500">
            View all
          </Link>
        </div>
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
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 5).map((r) => {
                const config = statusConfig[r.status] || { label: r.status, className: "bg-slate-100 text-slate-700", icon: null };
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pl-4 text-slate-900 font-medium">{r.requestNumber}</td>
                    <td className="py-3 pl-4 text-slate-600">{r.title}</td>
                    <td className="py-3 pl-4 text-slate-600">{r.property.name}</td>
                    <td className="py-3 pl-4 text-slate-600">{r.category}</td>
                    <td className="py-3 pl-4 text-slate-600">{r.priority}</td>
                    <td className="py-3 pl-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.className}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-500 text-xs">{new Date(r.submittedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 pt-6 text-center text-slate-500">
                    No maintenance requests yet. <Link href="/tenant/requests/new" className="text-blue-600 hover:underline">Submit your first request</Link>
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