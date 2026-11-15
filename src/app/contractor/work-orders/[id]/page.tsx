"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FileText, Calendar, Clock, CheckCircle, AlertTriangle, Wrench, Building, Home, MapPin, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string | null;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  property: { name: string; address: string; city: string; state: string; zipCode: string } | null;
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

const statusOptions = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FOR_PARTS", label: "Waiting for Parts" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function ContractorWorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const fetchWorkOrder = async () => {
    const id = params.id as string;
    setLoading(true);
    try {
      const res = await fetch(`/api/contractor/work-orders?id=${id}`);
      const json = await res.json();
      if (res.ok) {
        setWorkOrder(json.data);
        setNewStatus(json.data.status);
      } else {
        toast.error("Work order not found");
        router.push("/contractor/work-orders");
      }
    } catch {
      toast.error("Failed to load work order");
      router.push("/contractor/work-orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrder();
  }, [params.id, router]);

  const handleStatusChange = async () => {
    if (!newStatus || !workOrder) return;
    if (newStatus === workOrder.status) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/contractor/work-orders?id=${workOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json?.error || "Failed to update status");
        setNewStatus(workOrder.status);
        return;
      }

      toast.success("Status updated successfully");
      setWorkOrder({ ...workOrder, status: newStatus });
    } catch {
      toast.error("Failed to update status");
      setNewStatus(workOrder.status);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
    NEW: { className: "bg-slate-100 text-slate-700", icon: <span>📄</span> },
    UNDER_REVIEW: { className: "bg-blue-100 text-blue-700", icon: <Clock className="h-3 w-3" /> },
    AWAITING_APPROVAL: { className: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-3 w-3" /> },
    APPROVED: { className: "bg-blue-100 text-blue-700", icon: <CheckCircle className="h-3 w-3" /> },
    ASSIGNED: { className: "bg-indigo-100 text-indigo-700", icon: <Wrench className="h-3 w-3" /> },
    SCHEDULED: { className: "bg-purple-100 text-purple-700", icon: <Calendar className="h-3 w-3" /> },
    IN_PROGRESS: { className: "bg-orange-100 text-orange-700", icon: <Wrench className="h-3 w-3" /> },
    WAITING_FOR_PARTS: { className: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="h-3 w-3" /> },
    COMPLETED: { className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
    CLOSED: { className: "bg-slate-100 text-slate-700", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { className: "bg-red-100 text-red-700", icon: <AlertCircle className="h-3 w-3" /> },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Work Order Not Found</h2>
        <Link href="/contractor/work-orders">
          <Button variant="outline" className="mt-4">
            Back to Work Orders
          </Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[workOrder.status] || { className: "bg-slate-100 text-slate-700", icon: null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contractor/work-orders">
            <Button variant="ghost" size="sm">
              <span className="h-5 w-5">←</span> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{workOrder.workOrderNumber}</h1>
            <p className="text-slate-600">{workOrder.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.className}`}>
            {config.icon}
            {workOrder.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Work Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500">Work Order #</label>
                  <p className="font-medium text-slate-900">{workOrder.workOrderNumber}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Status</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${{
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
                  }[workOrder.status] || "bg-slate-100 text-slate-700"}`}>
                    {workOrder.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Scheduled Date</label>
                  <p className="text-slate-900">{formatDate(workOrder.scheduledDate)}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Completed Date</label>
                  <p className="text-slate-900">{formatDate(workOrder.completedDate)}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <p className="text-slate-600 whitespace-pre-wrap">{workOrder.description || "No description provided"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Original Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500">Request #</label>
                  <p className="font-medium text-slate-900">{workOrder.maintenanceRequest?.title || "—"}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Category</label>
                  <p className="text-slate-900">{workOrder.maintenanceRequest?.category || "—"}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Priority</label>
                  <p className="text-slate-900">{workOrder.maintenanceRequest?.priority || "—"}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Unit</label>
                  <p className="text-slate-900">{workOrder.unit?.unitNumber || "—"}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <p className="text-slate-600 whitespace-pre-wrap">{workOrder.maintenanceRequest?.description || "No description"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                  Current Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleStatusChange} disabled={updating || newStatus === workOrder.status}>
                  {updating ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workOrder.property && (
                <div className="flex items-start gap-3">
                  <Building className="h-6 w-6 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">{workOrder.property.name}</p>
                    <p className="text-sm text-slate-600">
                      {workOrder.property.address}, {workOrder.property.city}, {workOrder.property.state} {workOrder.property.zipCode}
                    </p>
                    {workOrder.unit && (
                      <p className="text-sm text-slate-500 mt-1">Unit: {workOrder.unit.unitNumber}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}