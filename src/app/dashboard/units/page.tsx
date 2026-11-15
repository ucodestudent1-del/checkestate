"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit3, Home, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

type Unit = {
  id: string;
  unitNumber: string;
  status: string;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  property: { id: string; name: string };
  tenant: { id: string; firstName: string; lastName: string; email: string } | null;
};

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/units");
    const json = await res.json();
    setUnits(json.data || []);
    setLoading(false);
    const pres = await fetch("/api/properties?pageSize=100");
    const pjson = await pres.json();
    setProperties((pjson.data || []).map((p: any) => ({ id: p.id, name: p.name })));
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const onSubmit = async (values: any) => {
    if (editing) {
      await fetch(`/api/units/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    } else {
      await fetch("/api/units", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    }
    setOpen(false);
    setEditing(null);
    fetchUnits();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this unit?")) return;
    await fetch(`/api/units/${id}`, { method: "DELETE" });
    fetchUnits();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Units</h1>
          <p className="text-slate-600">Manage units across your properties</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> Add Unit
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Unit</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Property</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Status</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Tenant</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="pb-3 pl-4 text-slate-900 font-medium">{u.unitNumber}</td>
                  <td className="pb-3 pl-4 text-slate-600">{u.property.name}</td>
                  <td className="pb-3 pl-4"><span className={`px-2 py-1 rounded text-xs font-medium ${u.status === "OCCUPIED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>{u.status}</span></td>
                  <td className="pb-3 pl-4 text-slate-600">{u.tenant ? `${u.tenant.firstName} ${u.tenant.lastName}` : "—"}</td>
                  <td className="text-right pb-3 pr-4">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(u); setOpen(true); }}><Edit3 className="ml-2 h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}><Trash2 className="ml-2 h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && <tr><td colSpan={5} className="pb-6 pt-6 text-center text-slate-500">No units found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${open ? "flex" : "hidden"} items-center justify-center bg-slate-900/50 backdrop-blur-sm`} onClick={() => setOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-slate-900 mb-4">{editing ? "Edit Unit" : "Add Unit"}</h2>
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const values = Object.fromEntries(fd); await onSubmit(values); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
              <select name="propertyId" className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Number</label>
              <input name="unitNumber" defaultValue={editing?.unitNumber || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Floor</label><input name="floor" type="number" defaultValue={editing?.floor || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label><input name="bedrooms" type="number" defaultValue={editing?.bedrooms || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label><input name="bathrooms" type="number" defaultValue={editing?.bathrooms || ""} className="w-full border border-slate-300 rounded-md px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save Changes" : "Create Unit"}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
