import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const API_BASE = "";

async function fetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  const res = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export function useMaintenanceRequests(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
}) {
  const { data: session } = useSession();
  const organizationId = (session?.user as any)?.organizationId;

  return useQuery({
    queryKey: ["maintenance-requests", organizationId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
      if (params.status) searchParams.set("status", params.status);
      if (params.priority) searchParams.set("priority", params.priority);
      if (params.search) searchParams.set("search", params.search);

      const res = await fetchJson(`/api/maintenance-requests?${searchParams}`);
      return res;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useWorkOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) {
  const { data: session } = useSession();
  const organizationId = (session?.user as any)?.organizationId;

  return useQuery({
    queryKey: ["work-orders", organizationId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
      if (params.status) searchParams.set("status", params.status);
      if (params.search) searchParams.set("search", params.search);

      const res = await fetchJson(`/api/work-orders?${searchParams}`);
      return res;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDashboardStats() {
  const { data: session } = useSession();
  const organizationId = (session?.user as any)?.organizationId;

  return useQuery({
    queryKey: ["dashboard-stats", organizationId],
    queryFn: async () => {
      const res = await fetchJson("/api/dashboard/stats");
      return res;
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 1,
  });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      propertyId: string;
      unitId?: string;
      tenantId?: string;
      title: string;
      description: string;
      category: string;
      priority?: string;
    }) => {
      const res = await fetchJson("/api/maintenance-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Maintenance request created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create maintenance request");
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const searchParams = new URLSearchParams();
      searchParams.set("id", id);
      const res = await fetchJson(`/api/work-orders?${searchParams}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Work order updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update work order");
    },
  });
}
