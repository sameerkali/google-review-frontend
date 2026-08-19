"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAdmin } from "../_lib/context";
import { QrCard } from "../_components/QrCard";
import { AlertIcon, InfoIcon } from "../_lib/icons";

export default function SimulatorPage() {
  const { toast } = useAdmin();
  const [serial, setSerial] = useState("");
  const [serialErr, setSerialErr] = useState("");
  const [verifyErr, setVerifyErr] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [bizName, setBizName] = useState("");
  const [verifying, setVerifying] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = serial.trim();
    if (!trimmed) { setSerialErr("Serial / Code is required"); return; }
    setSerialErr("");
    setVerifyErr("");
    setReviewUrl("");
    setBizName("");
    setVerifying(true);

    try {
      // Verify the serial actually exists + is assigned to a business
      const result = await api<{ business: { name: string }; suggestion: string | null }>(`/r/${encodeURIComponent(trimmed)}`);
      const url = `${baseUrl}/r/${encodeURIComponent(trimmed)}`;
      setReviewUrl(url);
      setBizName(result.business?.name || "");
      toast("success", `QR generated for "${result.business?.name}" — scan or open the link!`);
    } catch {
      setVerifyErr(`Serial "${trimmed}" was not found or is not assigned to a business yet.`);
      toast("error", "Serial not set up — see the steps below.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white">QR Code Simulator</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Test the full review flow without physical hardware.</p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
          <InfoIcon className="w-4 h-4 shrink-0" />
          Quickest way to get a code
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Use the <strong className="text-zinc-200">Onboard New Business</strong> wizard (Overview tab) — it
          creates the business and a working QR code in one step. Or, if you already have a business set up,
          view its QR anytime from the <strong className="text-zinc-200">Businesses</strong> tab. This simulator
          is for re-testing any serial you already know.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={generate} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4" noValidate>
        <h3 className="text-sm font-semibold text-white">Generate QR Code</h3>
        <div className="space-y-1.5">
          <label htmlFor="sim-serial" className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Hardware Serial / Code <span className="text-red-400">*</span>
          </label>
          <input
            id="sim-serial"
            type="text"
            placeholder="e.g. TEST-001, CAFE-ABC"
            value={serial}
            onChange={(e) => { setSerial(e.target.value); setSerialErr(""); setVerifyErr(""); }}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-zinc-800 placeholder-zinc-600 outline-none transition-all duration-200 focus:ring-1 ${
              serialErr || verifyErr
                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                : "border-zinc-700 focus:border-emerald-500/50 focus:ring-emerald-500/15"
            }`}
          />
          {serialErr && (
            <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
              <AlertIcon className="w-3 h-3 shrink-0" />
              {serialErr}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={verifying}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 cursor-pointer"
        >
          {verifying ? (
            <><div className="w-4 h-4 border-[1.5px] border-zinc-800 border-t-transparent rounded-full animate-spin" /> Verifying…</>
          ) : (
            "Verify & Generate QR"
          )}
        </button>
      </form>

      {/* Error: serial not found */}
      {verifyErr && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-red-400">Serial not found or not assigned</p>
              <p className="text-xs text-zinc-400">{verifyErr}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Fix: go to the <strong className="text-zinc-300">Businesses</strong> tab, find the business, and
                use <strong className="text-zinc-300">View QR</strong> to link a code — or add one directly from
                the <strong className="text-zinc-300">Hardware</strong> tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success: QR result */}
      {reviewUrl && !verifyErr && <QrCard reviewUrl={reviewUrl} businessName={bizName} toast={toast} />}
    </div>
  );
}
