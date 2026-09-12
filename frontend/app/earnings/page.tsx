"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/authStore";
import { formatMoney } from "@/lib/format";
import { StatusMessage } from "@/components/StatusMessage";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import type { Earnings } from "@/lib/types/api";

export default function EarningsPage() {
  const { token, user, hydrate, signOut } = useAuthStore();
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrate();
    setReady(true);
    // Also clear private results when a response interceptor expires the session.
    return useAuthStore.subscribe((state, previous) => {
      if (state.token !== previous.token) {
        void queryClient.cancelQueries({ queryKey: ["earnings"] });
        queryClient.removeQueries({ queryKey: ["earnings"] });
      }
    });
  }, [hydrate, queryClient]);

  const earnings = useQuery({
    queryKey: ["earnings", user?.id],
    enabled: ready && !!token && !!user,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Earnings>("/me/earnings", { signal });
      return data;
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  if (!ready) return <StatusMessage state="loading" />;

  if (!token || !user) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Earnings</h2>
        <p role="status">You are signed out. Sign in to view your earnings.</p>
        <Link href="/login" className="text-blue-700 underline">Sign in</Link>
      </section>
    );
  }

  const forbidden = axios.isAxiosError(earnings.error) && earnings.error.response?.status === 403;
  const unreachable = axios.isAxiosError(earnings.error) && !earnings.error.response;
  const serviceFailure = axios.isAxiosError(earnings.error) && (earnings.error.response?.status ?? 0) >= 500;
  const canShowCached = !earnings.isError || unreachable || serviceFailure;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Earnings</h2>
          <p className="text-sm text-slate-600">Signed in as {user.name}</p>
        </div>
        <button type="button" onClick={signOut} className="rounded-md border bg-white px-4 py-2">
          Sign out
        </button>
      </div>
      {earnings.isPending && <StatusMessage state="loading" />}
      {earnings.isError && (
        <div className="space-y-3" role="alert">
          <StatusMessage state="error" message={forbidden
            ? "Only instructors can view earnings. Your account is not permitted."
            : unreachable
              ? "Cannot reach the earnings service. Check your connection and try again."
              : "Could not load earnings. Please try again."} />
          {!forbidden && (
            <button type="button" disabled={earnings.isFetching} onClick={() => void earnings.refetch()}
              className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
              {earnings.isFetching ? "Retrying…" : "Try again"}
            </button>
          )}
        </div>
      )}
      {earnings.data && canShowCached && (
        <>
        {earnings.isError && (
          <p role="status" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Showing your last loaded balance. It may be outdated. Withdrawal requests are checked against the current balance by the server.
          </p>
        )}
        <dl className="grid gap-4 rounded-md border bg-white p-6 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-600">Available balance</dt>
            <dd className="text-2xl font-semibold">{formatMoney(earnings.data.availableMinor, earnings.data.currency)}</dd></div>
          <div><dt className="text-sm text-slate-600">Pending balance</dt>
            <dd className="text-2xl font-semibold">{formatMoney(earnings.data.pendingMinor, earnings.data.currency)}</dd></div>
          <div><dt className="text-sm text-slate-600">Minimum withdrawal</dt>
            <dd>{formatMoney(earnings.data.minimumWithdrawalMinor, earnings.data.currency)}</dd></div>
          <div><dt className="text-sm text-slate-600">Last withdrawal</dt>
            <dd>{earnings.data.lastWithdrawalAt
              ? new Date(earnings.data.lastWithdrawalAt).toLocaleString()
              : "No withdrawals yet"}</dd></div>
        </dl>
        <WithdrawalForm key={user.id} earnings={earnings.data} instructorId={user.id} />
        </>
      )}
    </section>
  );
}
