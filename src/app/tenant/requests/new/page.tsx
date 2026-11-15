"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Building, Home, MapPin, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const requestSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  units: { id: string; unitNumber: string }[];
};

export default function NewRequestPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      propertyId: "",
      unitId: "",
      title: "",
      description: "",
      category: "",
      priority: "MEDIUM",
    },
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/properties");
      const json = await res.json();
      if (res.ok) {
        setProperties(json.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const selectedPropertyId = watch("propertyId");
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  useEffect(() => {
    if (selectedPropertyId) {
      setValue("unitId", "");
    }
  }, [selectedPropertyId, setValue]);

  const onSubmit = async (data: RequestFormData) => {
    setSubmitting(true);

    try {
      const res = await fetch("/api/tenant/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Failed to submit request");
        setSubmitting(false);
        return;
      }

      toast.success("Maintenance request submitted successfully");
      router.push("/tenant/requests");
    } catch {
      toast.error("An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const categories = [
    "PLUMBING",
    "ELECTRICAL",
    "HVAC",
    "APPLIANCE",
    "PEST_CONTROL",
    "CLEANING",
    "LANDSCAPING",
    "PAINTING",
    "CARPENTRY",
    "ROOFING",
    "SECURITY",
    "OTHER",
  ];

  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit Maintenance Request</h1>
        <p className="text-slate-600">Describe the issue and we'll notify your property manager</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium text-slate-700">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                {...register("propertyId")}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.address}, {p.city}
                  </option>
                ))}
              </select>
              {errors.propertyId && (
                <p className="mt-1 text-sm text-red-600">{errors.propertyId.message}</p>
              )}
            </div>

            {selectedProperty && selectedProperty.units.length > 0 && (
              <div>
                <label htmlFor="unitId" className="block text-sm font-medium text-slate-700">
                  Unit
                </label>
                <select
                  {...register("unitId")}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select a unit (optional)</option>
                  {selectedProperty.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title")}
                type="text"
                placeholder="e.g., Leaking faucet in kitchen"
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Describe the issue in detail..."
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("category")}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
                  Priority
                </label>
                <select
                  {...register("priority")}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Link href="/tenant/requests">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}