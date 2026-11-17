import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialsUpdateInput, LoginInput } from "@rf/shared";
import { ApiError, apiFetch } from "@/lib/api-client";

export interface AdminDto {
  id: string;
  username: string;
  passwordUpdatedAt: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SessionDto {
  createdAt: string;
  expiresAt: string;
  absoluteExpiresAt: string;
  lastUsedAt: string;
}

export interface SessionResponse {
  admin: AdminDto;
  session: SessionDto;
}

export interface CredentialsResponse {
  admin: Pick<AdminDto, "id" | "username" | "passwordUpdatedAt">;
  rotated: boolean;
  revokedSessions: number;
}

export const sessionQueryKey = ["admin", "session"] as const;

export const fetchSession = (): Promise<SessionResponse> => apiFetch<SessionResponse>("/admin/auth/session");

const isUnauthorized = (error: unknown): boolean => error instanceof ApiError && error.status === 401;

export const useSession = () =>
  useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    retry: (failureCount, error) => !isUnauthorized(error) && failureCount < 1,
    staleTime: 60_000,
  });

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<SessionResponse>("/admin/auth/login", { method: "POST", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionQueryKey, data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/admin/auth/logout", { method: "POST" }),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: sessionQueryKey });
    },
  });
};

export const useUpdateCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CredentialsUpdateInput) =>
      apiFetch<CredentialsResponse>("/admin/auth/credentials", {
        method: "PATCH",
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
};
