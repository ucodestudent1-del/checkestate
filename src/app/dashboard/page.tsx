"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, Clock, CheckCircle, DollarSign, Building, Home, TrendingUp, TrendingDown, Minus, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useMaintenanceRequests, useWorkOrders } from "@/lib/api/hooks";

type Stats = {
  totalProperties: number;
  totalUnits: number;
  openRequests: number;
  urgentRequests: number;
  awaitingApproval: number;
  scheduledRepairs: number;
  completedRepairs: number;
  monthlyExpenses: number;
  avgResolutionDays: number;
  requestsByCategory: { category: string; count: number }[];
};

const statusConfig: Record<string, string> = {
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

const categoryColors: Record<string, string> = {
  PLUMBING: "bg-blue-100 text-blue-700",
  ELECTRICAL: "bg-yellow-100 text-yellow-700",
  HVAC: "bg-orange-100 text-orange-700",
  APPLIANCE: "bg-purple-100 text-purple-700",
  PEST_CONTROL: "bg-green-100 text-green-700",
  CLEANING: "bg-slate-100 text-slate-700",
  LANDSCAPING: "bg-green-100 text-green-700",
  PAINTING: "bg-red-100 text-red-700",
  CARPENTRY: "bg-amber-100 text-amber-700",
  ROOFING: "bg-slate-100 text-slate-700",
  SECURITY: "bg-red-100 text-red-700",
  OTHER: "bg-slate-100 text-slate-700",
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: requestsData, isLoading: requestsLoading } = useMaintenanceRequests({
    pageSize: 5,
  });
  const { data: workOrdersData, isLoading: appointmentsLoading } = useWorkOrders({
    status: "SCHEDULED",
    pageSize: 5,
  });

  const loading = statsLoading || requestsLoading || appointmentsLoading;

  const recentRequests = requestsData?.data || [];
  const upcomingAppointments = (workOrdersData?.data || []).map((w: any) => ({
    id: w.id,
    title: w.title,
    property: w.maintenanceRequest?.property?.name || "—",
    date: w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "TBD",
    contractor: w.assignments?.[0]?.contractor?.name || w.assignedTo ? `${w.assignedTo.firstName} ${w.assignedTo.lastName}` : "Unassigned",
  }));

  const statCards = stats ? [
    { title: "Total Properties", value: stats.totalProperties.toString(), icon: Building, trend: "neutral", change: "" },
    { title: "Total Units", value: stats.totalUnits.toString(), icon: Home, trend: "neutral", change: "" },
    { title: "Open Requests", value: stats.openRequests.toString(), icon: FileText, trend: stats.openRequests > 10 ? "up" : "neutral", change: stats.openRequests > 10 ? "High volume" : "" },
    { title: "Urgent Requests", value: stats.urgentRequests.toString(), icon: AlertTriangle, trend: stats.urgentRequests > 0 ? "down" : "neutral", change: stats.urgentRequests > 0 ? "Needs attention" : "" },
    { title: "Awaiting Approval", value: stats.awaitingApproval.toString(), icon: FileText, trend: "neutral", change: "" },
    { title: "Scheduled Repairs", value: stats.scheduledRepairs.toString(), icon: Calendar, trend: "neutral", change: "" },
    { title: "Completed Repairs", value: stats.completedRepairs.toString(), icon: CheckCircle, trend: "up", change: "This month" },
    { title: "Monthly Expenses", value: `$${stats.monthlyExpenses.toLocaleString()}`, icon: DollarSign, trend: "neutral", change: "" },
    { title: "Avg Resolution", value: `${stats.avgResolutionDays} days`, icon: Clock, trend: stats.avgResolutionDays > 7 ? "down" : "neutral", change: stats.avgResolutionDays > 7 ? "Above target" : "" },
  ] : [];

  const handleRefresh = useCallback(() => {
    // TanStack Query handles refetching automatically via invalidation
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Recent Maintenance Requests</CardTitle></CardHeader>
            <CardContent><div className="h-64 bg-slate-50 animate-pulse rounded" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle></CardHeader>
            <CardContent><div className="h-64 bg-slate-50 animate-pulse rounded" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Overview of your maintenance operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : Minus;
          const trendClass = stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-slate-600";
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendIcon className={`h-4 w-4 ${trendClass}`} />
                  <p className={`text-xs ${trendClass}`}>{stat.change || ""}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Maintenance Requests</CardTitle>
            <Link href="/dashboard/maintenance-requests" className="text-sm text-blue-600 hover:text-blue-500">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-2 text-slate-500 font-medium">Request #</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Property</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Category</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Priority</th>
                    <th className="text-left pb-2 text-slate-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.slice(0, 5).map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 text-slate-900 font-medium">{item.requestNumber}</td>
                      <td className="py-2 text-slate-600">{item.property.name}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[item.category] || "bg-slate-100 text-slate-700"}`}>
                          {item.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2 text-slate-600">{item.priority}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[item.status] || "bg-slate-100 text-slate-700"}`}>
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">No recent requests</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Link href="/dashboard/work-orders?status=SCHEDULED" className="text-sm text-blue-600 hover:text-blue-500">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between pb-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.property}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{item.date}</p>
                    <p className="text-xs text-slate-500">{item.contractor}</p>
                  </div>
                </div>
              ))}
              {upcomingAppointments.length === 0 && (
                <div className="text-center py-8 text-slate-500">No upcoming appointments</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats && stats.requestsByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Requests by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.requestsByCategory.map((item: any) => (
                <span key={item.category} className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[item.category] || "bg-slate-100 text-slate-700"}`}>
                  {item.category.replace(/_/g, " ")} ({item.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
    </div>
  );
}
