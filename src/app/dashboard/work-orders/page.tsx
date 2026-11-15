"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Trash2, Edit3, FileText, Building2, Clock, CheckCircle, Calendar, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string | null;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  maintenanceRequest: {
    title: string;
    description: string;
    category: string;
    priority: string;
    property: { name: string };
    unit: { unitNumber: string } | null;
  };
  assignedTo: { firstName: string; lastName: string; email: string } | null;
  assignments: { contractor: { name: string } }[];
};


export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newScheduledDate, setNewScheduledDate] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/work-orders?${params.toString()}`);
    const json = await res.json();
    setWorkOrders(json.data || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchWorkOrders(); }, [fetchWorkOrders]);

  const openEditModal = (wo: WorkOrder) => {
    setEditingWorkOrder(wo);
    setNewStatus(wo.status);
    setNewScheduledDate(wo.scheduledDate || "");
    setNewAssignee(wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : "");
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingWorkOrder(null);
  };

  const handleStatusChange = async () => {
    if (!editingWorkOrder) return;
    if (newStatus === editingWorkOrder.status && !newScheduledDate && !newAssignee) return;

    setSubmitting(true);
    try {
      const updateBody: any = {};
      if (newStatus !== editingWorkOrder.status) updateBody.status = newStatus;
      if (newScheduledDate) updateBody.scheduledDate = newScheduledDate;

      const res = await fetch(`/api/work-orders?id=${editingWorkOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json?.error || "Failed to update work order");
        setSubmitting(false);
        return;
      }

      toast.success("Work order updated successfully");
      closeEditModal();
      fetchWorkOrders();
    } catch {
      toast.error("Failed to update work order");
      setSubmitting(false);
    }
  };

  const allowedNextStatuses = editingWorkOrder ? STATUS_FLOW[editingWorkOrder.status] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
          <p className="text-slate-600">Manage and track all work orders</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="ml-2 h-4 w-4" /> New Work Order
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
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
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="AWAITING_APPROVAL">Awaiting Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
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
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Assigned To</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Scheduled</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => {
                const config = statusConfig[w.status] || { label: w.status, className: "bg-slate-100 text-slate-700" };
                return (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="pb-3 pl-4 text-slate-900 font-medium">{w.workOrderNumber}</td>
                    <td className="pb-3 pl-4 text-slate-600">{w.title}</td>
                    <td className="pb-3 pl-4 text-slate-600">{w.maintenanceRequest.property.name}</td>
                    <td className="pb-3 pl-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="pb-3 pl-4 text-slate-600">
                      {w.assignedTo ? `${w.assignedTo.firstName} ${w.assignedTo.lastName}` : "—"}
                      {w.assignments?.length && (
                        <span className="text-xs text-blue-600 ml-2">
                          {w.assignments.map((a) => a.contractor.name).join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="pb-3 pl-4 text-slate-600">
                      {w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="text-right pb-3 pr-4">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(w)}>
                        <Edit3 className="ml-2 h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {workOrders.length === 0 && <tr><td colSpan={7} className="pb-6 pt-6 text-center text-slate-500">No work orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Work Order Modal */}
      <div
        className={`fixed inset-0 z-50 ${editModal ? "flex" : "hidden"} items-center justify-center bg-slate-900/50 backdrop-blur-sm`}
        onClick={closeEditModal}
      >
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Edit Work Order</h2>
            <Button variant="ghost" size="sm" onClick={closeEditModal}>
              <span className="h-5 w-5">×</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work Order #</label>
              <p className="text-slate-900 font-medium">{editingWorkOrder?.workOrderNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <p className="text-slate-600">{editingWorkOrder?.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value={editingWorkOrder?.status}>{editingWorkOrder?.status}</option>
                {allowedNextStatuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
              {allowedNextStatuses.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">No further status transitions available</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={newScheduledDate}
                onChange={(e) => setNewScheduledDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Contractor</label>
              <input
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="Contractor name"
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleStatusChange}
                disabled={submitting || (!newStatus && !newScheduledDate && !newAssignee)}
              >
                {submitting ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_FLOW: Record<string, string[]> = {
  NEW: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["AWAITING_APPROVAL", "NEW", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "UNDER_REVIEW", "CANCELLED"],
  APPROVED: ["ASSIGNED", "AWAITING_APPROVAL", "CANCELLED"],
  ASSIGNED: ["SCHEDULED", "APPROVED", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "ASSIGNED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_PARTS", "COMPLETED", "SCHEDULED", "CANCELLED"],
  WAITING_FOR_PARTS: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: ["NEW"],
};

const statusConfig: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-slate-100 text-slate-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-100 text-blue-700" },
  AWAITING_APPROVAL: { label: "Awaiting Approval", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  ASSIGNED: { label: "Assigned", className: "bg-indigo-100 text-indigo-700" },
  SCHEDULED: { label: "Scheduled", className: "bg-purple-100 text-purple-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-orange-100 text-orange-700" },
  WAITING_FOR_PARTS: { label: "Waiting for Parts", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", className: "bg-slate-100 text-slate-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};