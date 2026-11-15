"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock, CheckCircle, Wrench, Calendar, Building } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  title: string;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  property: { name: string };
  unit: { unitNumber: string } | null;
};

export default function ContractorDashboardPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    upcoming: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contractor/work-orders");
      const json = await res.json();
      if (res.ok) {
        const data = json.data || [];
        setWorkOrders(data);
        setStats({
          assigned: data.filter((w: any) => ["ASSIGNED", "SCHEDULED"].includes(w.status)).length,
          inProgress: data.filter((w: any) => ["IN_PROGRESS", "WAITING_FOR_PARTS"].includes(w.status)).length,
          completed: data.filter((w: any) => ["COMPLETED", "CLOSED"].includes(w.status)).length,
          upcoming: data.filter((w: any) => w.scheduledDate && new Date(w.scheduledDate) >= new Date()).length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch contractor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractor Dashboard</h1>
          <p className="text-slate-600">Your assigned work orders at a glance</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <FileText className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.assigned}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.upcoming}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My Work Orders</h2>
          <Link href="/contractor/work-orders" className="text-sm text-blue-600 hover:text-blue-500">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Work Order #</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Title</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Property</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Unit</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Status</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Scheduled</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.slice(0, 5).map((w) => {
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
                const statusClass = statusClassMap[w.status] || "bg-slate-100 text-slate-700";
                return (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pl-4 text-slate-900 font-medium">{w.workOrderNumber}</td>
                    <td className="py-3 pl-4 text-slate-600">{w.title}</td>
                    <td className="py-3 pl-4 text-slate-600">{w.property?.name || "—"}</td>
                    <td className="py-3 pl-4 text-slate-600">{w.unit?.unitNumber || "—"}</td>
                    <td className="py-3 pl-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusClassMap[w.status] || "bg-slate-100 text-slate-700"}`}>
                        {w.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-slate-500 text-xs">{w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString() : "—"}</td>
                    <td className="text-right py-3 pr-4">
                      <Link href={`/contractor/work-orders/${w.id}`}>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                          View
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {workOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 pt-6 text-center text-slate-500">
                    No assigned work orders.
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