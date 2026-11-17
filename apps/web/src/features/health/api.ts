import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

interface HealthResponse {
  database: "ONLINE" | "OFFLINE";
  checkedAt: string;
}

export const useHealth = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthResponse>("/health"),
    staleTime: 30_000,
    retry: 0,
  });

export const useOwnerPresence = () =>
  useQuery({
    queryKey: ["presence"],
    queryFn: () => apiFetch<{ status: "ONLINE" | "OFFLINE"; lastSeenAt: string | null }>("/presence"),
    staleTime: 30_000,
    retry: 0,
  });
