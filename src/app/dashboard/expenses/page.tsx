"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Edit3, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type Expense = {
  id: string;
  title: string;
  category: string;
  actualCost: number;
  paymentStatus: string;
  expenseDate: string;
  property: { name: string } | null;
  contractor: { name: string } | null;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/expenses");
    const json = await res.json();
    setExpenses(json.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const onSubmit = async (values: any) => {
    if (editing) {
      await fetch(`/api/expenses/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    } else {
      await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    }
    setOpen(false);
    setEditing(null);
    fetchExpenses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-600">Track maintenance costs and expenses</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Title</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Category</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Property</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Contractor</th>
                <th className="text-right pb-3 pl-4 text-slate-500 font-medium">Cost</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Status</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="pb-3 pl-4 text-slate-900 font-medium">{e.title}</td>
                  <td className="pb-3 pl-4 text-slate-600">{e.category}</td>
                  <td className="pb-3 pl-4 text-slate-600">{e.property?.name || "—"}</td>
                  <td className="pb-3 pl-4 text-slate-600">{e.contractor?.name || "—"}</td>
                  <td className="pb-3 pl-4 text-right text-slate-600">${e.actualCost.toFixed(2)}</td>
                  <td className="pb-3 pl-4"><span className={`px-2 py-1 rounded text-xs font-medium ${e.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{e.paymentStatus}</span></td>
                  <td className="text-right pb-3 pr-4">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(e); setOpen(true); }}><Edit3 className="ml-2 h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={7} className="pb-6 pt-6 text-center text-slate-500">No expenses found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${open ? "flex" : "hidden"} items-center justify-center bg-slate-900/50 backdrop-blur-sm`} onClick={() => setOpen(false)}>
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-slate-900 mb-4">{editing ? "Edit Expense" : "Add Expense"}</h2>
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await onSubmit(Object.fromEntries(fd)); }} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Title</label><input name="title" defaultValue={editing?.title || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><select name="category" className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value="PLUMBING">Plumbing</option><option value="ELECTRICAL">Electrical</option><option value="HVAC">HVAC</option><option value="APPLIANCE">Appliance</option><option value="OTHER">Other</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Actual Cost</label><input name="actualCost" type="number" step="0.01" defaultValue={editing?.actualCost || ""} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label><select name="paymentStatus" defaultValue={editing?.paymentStatus || "UNPAID"} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option><option value="PARTIAL">Partial</option></select></div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save Changes" : "Add Expense"}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
