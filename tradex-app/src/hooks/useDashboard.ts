import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { UserProfile, UserInfo, SystemSetting, ReferralReward, PointsTransaction, WalletTransaction } from "../utils/dashboardHelpers";

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
  return useQuery<UserProfile>({
    queryKey: ["currentUser"],
    queryFn: () => api("/auth/me")
  });
}

export function useAdminTelemetry(isAdmin: boolean) {
  return useQuery<{ usersList: UserInfo[], settingsConfig: SystemSetting }>({
    queryKey: ["adminTelemetry"],
    queryFn: async () => {
      const [usersList, settingsConfig] = await Promise.all([
        api("/admin/users"),
        api("/admin/settings")
      ]);
      return { usersList, settingsConfig };
    },
    enabled: isAdmin
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
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await api("/auth/logout", { method: "POST" });
      } catch (e) {
        // Suppress failure so we clean up local state anyway
      }
    },
    onSuccess: () => {
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
  return useQuery<WalletData>({
    queryKey: ["walletData"],
    queryFn: async () => {
      const [transactions, user] = await Promise.all([
        api("/wallet/transactions"),
        api("/auth/me")
      ]);
      return { transactions, user };
    }
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

export function useUpdateBankDetails(
  onSuccessCallback: () => void,
  onErrorCallback: (errorMsg: string) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, { accountNumber: string }>({
    mutationFn: ({ accountNumber }) => {
      return api("/wallet/bank-details", {
        method: "PUT",
        body: JSON.stringify({ accountNumber })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletData"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["referralsData"] });
      onSuccessCallback();
    },
    onError: (err: Error) => {
      onErrorCallback(err.message || "Updating bank details failed");
    }
  });
}

export function usePublicSettings() {
  return useQuery<SystemSetting>({
    queryKey: ["publicSettings"],
    queryFn: () => api("/auth/settings")
  });
}

