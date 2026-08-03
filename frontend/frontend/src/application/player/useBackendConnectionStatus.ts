import { useQuery } from "@tanstack/react-query";
import { fetchHealthStatus, type HealthStatus } from "@/infrastructure/api/healthApi";

export function useBackendConnectionStatus() {
  return useQuery<HealthStatus>({
    queryKey: ["backend-health"],
    queryFn: fetchHealthStatus,
    retry: 1,
    staleTime: 30_000,
  });
}
