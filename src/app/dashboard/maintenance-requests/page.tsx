"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit3, List, Mail, Building2 } from "lucide-react";
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
  tenant: { firstName: string; lastName: string } | null;
  assignedContractor: { name: string } | null;
};

export default function MaintenanceRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Request | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/maintenance-requests");
    const json = await res.json();
    setRequests(json.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const statusColors: Record<string, string> = {
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

  const onSubmit = async (values: any) => {
    if (editing) {
      await fetch(`/api/work-orders?id=${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: values.status }) });
    }
    setOpen(false);
    setEditing(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-600">Track and manage maintenance work orders</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> New Request
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
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="pb-3 pl-4 text-slate-900 font-medium">{r.requestNumber}</td>
                  <td className="pb-3 pl-4 text-slate-600">{r.title}</td>
                  <td className="pb-3 pl-4 text-slate-600">{r.property.name}</td>
                  <td className="pb-3 pl-4 text-slate-600">{r.category}</td>
                  <td className="pb-3 pl-4 text-slate-600">{r.priority}</td>
                  <td className="pb-3 pl-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[r.status] || "bg-slate-100 text-slate-700"}`}>{r.status}</span></td>
                  <td className="text-right pb-3 pr-4">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}><Edit3 className="ml-2 h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={7} className="pb-6 pt-6 text-center text-slate-500">No maintenance requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${open ? "flex" : "hidden"} items-center justify-center bg-slate-900/50 backdrop-blur-sm`} onClick={() => setOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Update Work Order Status</h2>
          <p className="text-sm text-slate-600 mb-4">{editing?.title}</p>
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await onSubmit({ status: fd.get("status") }); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" defaultValue={editing?.status} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                {["NEW","UNDER_REVIEW","AWAITING_APPROVAL","APPROVED","ASSIGNED","SCHEDULED","IN_PROGRESS","WAITING_FOR_PARTS","COMPLETED","CLOSED","CANCELLED"].map(s => (<option key={s} value={s}>{s.replace(/_/g, " ")}</option>))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Update Status</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
