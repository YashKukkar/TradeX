import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { UserProfile, UserInfo, SystemSetting, ReferralReward, PointsTransaction, WalletTransaction } from "../utils/dashboardHelpers";
import { useOverlay, getPollingInterval } from "../context/OverlayContext";

export interface ReferralsData {
  downline: ReferralReward[];
  txs: PointsTransaction[];
  user: UserProfile;
}

export function useReferralsData() {
  return useQuery<ReferralsData>({
    queryKey: ["referralsData"],
    queryFn: async () => {
      const [downline, txs, user] = await Promise.all([
        api("/referrals/downline"),
        api("/referrals/transactions"),
        api("/auth/me")
      ]);
      return { downline, txs, user };
    }
  });
}

export function useCurrentUser() {
  const { isOverlayActive } = useOverlay();
  return useQuery<UserProfile>({
    queryKey: ["currentUser"],
    queryFn: () => api("/auth/me"),
    refetchInterval: () => getPollingInterval(isOverlayActive, 5000),
  });
}

export function useAdminTelemetry(isAdmin: boolean, currentUser?: UserProfile | null) {
  const { isOverlayActive } = useOverlay();
  return useQuery<{ usersList: UserInfo[], settingsConfig: SystemSetting | undefined }>({
    queryKey: ["adminTelemetry", currentUser?.email],
    queryFn: async () => {
      const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
      const canManageUsers = isSuperAdmin || currentUser?.permissions?.includes("MANAGE_USERS") === true;

      const [usersList, settingsConfig] = await Promise.all([
        canManageUsers ? api("/admin/users") : [],
        api("/admin/settings")  // readable by all admins — drives overview status cards
      ]);
      return { usersList, settingsConfig };
    },
    enabled: isAdmin && !!currentUser,
    staleTime: 60000,
    refetchInterval: () => getPollingInterval(isOverlayActive, 5000),
  });
}

export function useVerification(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { target: "email" | "phone"; otpCode: string }>({
    mutationFn: ({ target, otpCode }) => {
      const endpoint = target === "email" ? "verify-email" : "verify-phone";
      return api(`/auth/${endpoint}?code=${otpCode}`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Verification failed");
    }
  });
}

export function useResendOtp(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  return useMutation<void, Error, { target: "email" | "phone" }>({
    mutationFn: ({ target }) => {
      return api(`/auth/resend-otp?type=${target}`, { method: "POST" });
    },
    onSuccess: () => {
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Resend failed");
    }
  });
}

export function useSeedTestData(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => api("/admin/seed-test-data", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "An error occurred during database seeding.");
    }
  });
}

export function useLogout(onLogoutComplete: () => void) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await api("/auth/logout", { method: "POST" });
      } catch (e) {
        // Suppress failure so we clean up local state anyway
      }
    },
    onSuccess: () => {
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.documentElement.removeAttribute("data-theme");
      onLogoutComplete();
    }
  });
}

export interface WalletData {
  transactions: WalletTransaction[];
  user: UserProfile;
}

export function useWalletData() {
  const { isOverlayActive } = useOverlay();
  return useQuery<WalletData>({
    queryKey: ["walletData"],
    queryFn: async () => {
      const [transactions, user] = await Promise.all([
        api("/wallet/transactions"),
        api("/auth/me")
      ]);
      return { transactions, user };
    },
    refetchInterval: () => getPollingInterval(isOverlayActive, 5000),
  });
}

export function useDeposit(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<WalletTransaction, Error, { amount: number }>({
    mutationFn: ({ amount }) => {
      return api("/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletData"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["referralsData"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Deposit failed");
    }
  });
}

export function useWithdraw(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<WalletTransaction, Error, { amount: number }>({
    mutationFn: ({ amount }) => {
      return api("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletData"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["referralsData"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Withdrawal failed");
    }
  });
}

export function useConvertPoints(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<WalletTransaction, Error, { points: number }>({
    mutationFn: ({ points }) => {
      return api("/wallet/convert-points", {
        method: "POST",
        body: JSON.stringify({ points })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletData"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["referralsData"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Conversion failed");
    }
  });
}


export function usePublicSettings() {
  return useQuery<SystemSetting>({
    queryKey: ["publicSettings"],
    queryFn: () => api("/auth/settings")
  });
}

export function useUpdateProfile(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { phoneNumber: string }>({
    mutationFn: ({ phoneNumber }) => {
      return api("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ phoneNumber })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Profile update failed");
    }
  });
}

export function useChangePassword(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  return useMutation<void, Error, { currentPassword: string; newPassword: string }>({
    mutationFn: (body) => {
      return api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(body)
      });
    },
    onSuccess: () => {
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Changing password failed");
    }
  });
}

export function useAddBankAccount(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { accountNumber: string; ifscCode: string; holderName: string; bankName: string; isPrimary: boolean }>({
    mutationFn: (body) => {
      return api("/auth/profile/bank", {
        method: "POST",
        body: JSON.stringify(body)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Adding bank account failed");
    }
  });
}

export function useSetPrimaryBankAccount(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { id: number }>({
    mutationFn: ({ id }) => {
      return api(`/auth/profile/bank/${id}/primary`, {
        method: "PUT"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Setting primary bank failed");
    }
  });
}

export function useDeleteBankAccount(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { id: number }>({
    mutationFn: ({ id }) => {
      return api(`/auth/profile/bank/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Deleting bank account failed");
    }
  });
}

