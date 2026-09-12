"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import type { ApiError, Earnings, Withdrawal } from "@/lib/types/api";

type Attempt = { amountMinor: number; payoutReference: string };

export function WithdrawalForm({ earnings, instructorId }: { earnings: Earnings; instructorId: number }) {
  const queryClient = useQueryClient();
  const busy = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const [uncertain, setUncertain] = useState<Attempt | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const schema = z.object({
    amountMinor: z.number({ invalid_type_error: "Enter an amount in whole minor units." })
      .int("Enter a whole number of minor units.")
      .positive("Enter an amount greater than zero.")
      .max(Number.MAX_SAFE_INTEGER, "This amount is too large.")
      .min(earnings.minimumWithdrawalMinor, `The minimum is ${formatMoney(earnings.minimumWithdrawalMinor, earnings.currency)}.`)
      .max(earnings.availableMinor, `You can withdraw up to ${formatMoney(earnings.availableMinor, earnings.currency)}.`),
  });
  const { register, handleSubmit, setError, clearErrors, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  async function send(attempt: Attempt) {
    if (busy.current) return;
    busy.current = true;
    setIsSending(true);
    setMessage(null);
    clearErrors();
    try {
      const { data } = await api.post<Withdrawal>("/me/withdrawals", attempt, {
        headers: { "Idempotency-Key": attempt.payoutReference },
      });
      setUncertain(null);
      setWithdrawal(data);
      reset();
      // Refetch the server's balance; do not guess a new balance locally.
      void queryClient.invalidateQueries({ queryKey: ["earnings", instructorId] });
    } catch (failure: unknown) {
      if (axios.isAxiosError<ApiError>(failure) && failure.response && failure.response.status < 500) {
        setUncertain(null);
        const code = failure.response.data?.code;
        if (code === "below_minimum" || code === "insufficient_balance") {
          setError("amountMinor", { type: "server", message: failure.response.data.message }, { shouldFocus: true });
        } else if (code === "withdrawal_in_progress") {
          setMessage("You already have a withdrawal in progress.");
        } else if (failure.response.status === 401) {
          setMessage("Your session has expired. Sign in again.");
        } else if (failure.response.status === 403) {
          setMessage("Only instructors can request withdrawals.");
        } else {
          setMessage("The request was refused. Check the amount and try again.");
        }
      } else {
        // An outage or 5xx may happen after creation. Retry this exact payload.
        setUncertain(attempt);
        setMessage("We could not confirm the result. Retry the same request before starting another withdrawal. Keep this page open until the result is confirmed.");
      }
    } finally {
      busy.current = false;
      setIsSending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-md border bg-white p-6">
      <h3 className="text-lg font-semibold">Request a withdrawal</h3>
      {withdrawal && <p role="status" className="rounded-md bg-green-50 p-3 text-green-800">
        Withdrawal #{withdrawal.id} requested: {formatMoney(withdrawal.amountMinor, earnings.currency)}. Status: {withdrawal.status}.
      </p>}
      <form noValidate onSubmit={handleSubmit((values) => {
        if (uncertain) return;
        setWithdrawal(null);
        return send({ ...values, payoutReference: `wd_${crypto.randomUUID()}` });
      })} className="space-y-3" aria-busy={isSending}>
        <label htmlFor="amountMinor" className="block text-sm font-medium">Amount in minor units (kobo for NGN)</label>
        <p id="amount-help" className="text-sm text-slate-600">
          For NGN, 100 kobo = ₦1. Minimum: {formatMoney(earnings.minimumWithdrawalMinor, earnings.currency)}.
          {" "}Available: {formatMoney(earnings.availableMinor, earnings.currency)}.
        </p>
        <input id="amountMinor" type="number" step="1" readOnly={isSending || !!uncertain}
          {...register("amountMinor", { valueAsNumber: true })}
          aria-invalid={!!errors.amountMinor} aria-describedby={`amount-help${errors.amountMinor ? " amount-error" : ""}`}
          className="w-full rounded-md border border-slate-300 px-3 py-2" />
        {errors.amountMinor && <p id="amount-error" role="alert" className="text-sm text-red-700">{errors.amountMinor.message}</p>}
        {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
        {uncertain ? (
          <button type="button" disabled={isSending} onClick={() => void send(uncertain)}
            className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
            {isSending ? "Checking request…" : "Retry same withdrawal"}
          </button>
        ) : (
          <button type="submit" disabled={isSending}
            className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-50">
            {isSending ? "Submitting…" : "Request withdrawal"}
          </button>
        )}
      </form>
    </section>
  );
}
