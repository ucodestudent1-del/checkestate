"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Trash2, Edit3, Building2, MapPin, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const propertySchema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  zipCode: z.string().min(1, "Required"),
  propertyType: z.string().min(1, "Required"),
  description: z.string().optional(),
});

type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  description: string | null;
  photoUrls: string[];
  _count: { units: number; maintenanceRequests: number };
  createdAt: string;
};

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const PROPERTY_TYPES = [
  "Single Family",
  "Multi Family",
  "Apartment",
  "Condo",
  "Commercial",
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterPropertyType, setFilterPropertyType] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "",
      description: "",
    },
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCity) params.set("city", filterCity);
    if (filterState) params.set("state", filterState);
    if (filterPropertyType) params.set("propertyType", filterPropertyType);
    const res = await fetch(`/api/properties?${params.toString()}`);
    const json = await res.json();
    setProperties(json.data || []);
    setLoading(false);
  }, [search, filterCity, filterState, filterPropertyType]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onSubmit = async (values: z.infer<typeof propertySchema>) => {
    if (editing) {
      const res = await fetch(`/api/properties/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Property updated");
        setOpen(false);
        setEditing(null);
        reset();
        fetchProperties();
      } else {
        toast.error("Failed to update property");
      }
    } else {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Property created");
        setOpen(false);
        reset();
        fetchProperties();
      } else {
        toast.error("Failed to create property");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this property? Units must be removed first.")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Property deleted");
      fetchProperties();
    } else {
      const json = await res.json();
      toast.error(json?.error || "Failed to delete property");
    }
  };

  const hasActiveFilters = filterCity || filterState || filterPropertyType;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-600">Manage your rental properties and units</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> Add Property
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="pl-9 pr-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="ml-2 h-4 w-4" /> Filters {hasActiveFilters && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Active</span>}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => { setFilterCity(""); setFilterState(""); setFilterPropertyType(""); }}>
              Clear all
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder="Filter by city"
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="">All States</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
              <select
                value={filterPropertyType}
                onChange={(e) => setFilterPropertyType(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Name</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Address</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Type</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Units</th>
                <th className="text-left pb-3 pl-4 text-slate-500 font-medium">Requests</th>
                <th className="text-right pb-3 pr-4 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="pb-3 pl-4">
                    <div className="text-slate-900 font-medium">{p.name}</div>
                  </td>
                  <td className="pb-3 pl-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="truncate">{p.address}, {p.city}, {p.state} {p.zipCode}</div>
                    </div>
                  </td>
                  <td className="pb-3 pl-4 text-slate-600">{p.propertyType}</td>
                  <td className="pb-3 pl-4 text-slate-600">{p._count.units}</td>
                  <td className="pb-3 pl-4 text-slate-600">{p._count.maintenanceRequests}</td>
                  <td className="text-right pb-3 pr-4">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}>
                      <Edit3 className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="ml-2 h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={6} className="pb-6 pt-6 text-center text-slate-500">
                    No properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 ${open ? "flex" : "hidden"} items-center justify-center bg-slate-900/50 backdrop-blur-sm`}
        onClick={() => setOpen(false)}
      >
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Property" : "Add Property"}</h2>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
              <input {...register("name")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
              <input {...register("address")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input {...register("city")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <select {...register("state")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select State</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                <input {...register("zipCode")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
              <select {...register("propertyType")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Select Type</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea {...register("description")} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save Changes" : "Create Property"}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
