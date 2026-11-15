"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Contractor = {
  id: string;
  name: string;
  businessName: string | null;
  email: string | null;
  phone: string | null;
  tradeSpecialization: string | null;
  _count: { workOrderAssignments: number };
};

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/contractors");
    const json = await res.json();
    setContractors(json.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContractors(); }, [fetchContractors]);

  const onSubmit = async (values: any) => {
    if (editing) {
      await fetch(`/api/contractors/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    } else {
      await fetch("/api/contractors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    }
    setOpen(false);
    setEditing(null);
    fetchContractors();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this contractor?")) return;
    await fetch(`/api/contractors/${id}`, { method: "DELETE" });
    fetchContractors();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
          <p className="text-slate-600">Manage your contractor directory</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> Add Contractor
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Name</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Business</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Trade</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Email</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Phone</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Jobs</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="pb-3 pl-4 text-slate-900 font-medium">{c.name}</td>
                  <td className="pb-3 pl-4 text-slate-600">{c.businessName || "—"}</td>
                  <td className="pb-3 pl-4 text-slate-600">{c.tradeSpecialization || "—"}</td>
                  <td className="pb-3 pl-4 text-slate-600">{c.email || "—"}</td>
                  <td className="pb-3 pl-4 text-slate-600">{c.phone || "—"}</td>
                  <td className="pb-3 pl-4 text-slate-600">{c._count.workOrderAssignments}</td>
                  <td className="text-right pb-3 pr-4">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}><Edit3 className="ml-2 h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}><Trash2 className="ml-2 h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {contractors.length === 0 && <tr><td colSpan={7} className="pb-6 pt-6 text-center text-slate-500">No contractors found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${open ? "flex" : "hidden"} items-center justify-center bg-slate-900/50 backdrop-blur-sm`} onClick={() => setOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-slate-900 mb-4">{editing ? "Edit Contractor" : "Add Contractor"}</h2>
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await onSubmit(Object.fromEntries(fd)); }} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input name="name" defaultValue={editing?.name || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label><input name="businessName" defaultValue={editing?.businessName || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input name="email" type="email" defaultValue={editing?.email || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input name="phone" defaultValue={editing?.phone || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Trade Specialization</label><input name="tradeSpecialization" defaultValue={editing?.tradeSpecialization || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save Changes" : "Add Contractor"}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
