"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Row, ToastFn } from "@/lib/types";
import { AlertIcon, CheckIcon, CopyIcon, UploadIcon } from "@/components/icons";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Input";

type ParsedItem = { name: string; price?: number };

const EXAMPLE = JSON.stringify(
  [
    { id: 1, name: "Cold Brew", price: 150 },
    { id: 2, name: "Cappuccino", price: 120 },
    { id: 3, name: "Club Sandwich", price: 220 },
  ],
  null,
  2
);

/* Accepts the documented {id, name, price} shape — `id` is read and ignored
   (Mongo assigns its own on insert; it's only there so a menu exported
   elsewhere with its own ids can be pasted in unmodified) — but also
   tolerates {items:[...]} and a plain array of name strings with no price,
   so JSON from an earlier version of this uploader still works. The business
   itself always comes from the dropdown, never from the JSON, so admins
   never have to hand-copy an id. */
function extractItems(parsed: unknown): ParsedItem[] | null {
  const obj = parsed as Record<string, unknown> | null;
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(obj?.items) ? (obj!.items as unknown[]) : null;
  if (!arr) return null;

  const items: ParsedItem[] = [];
  for (const it of arr) {
    if (typeof it === "string") { items.push({ name: it }); continue; }
    if (it && typeof it === "object" && typeof (it as Record<string, unknown>).name === "string") {
      const rawPrice = (it as Record<string, unknown>).price;
      const price = typeof rawPrice === "number" && !isNaN(rawPrice) ? rawPrice : undefined;
      items.push({ name: (it as { name: string }).name, price });
      continue;
    }
    return null;
  }
  return items;
}

/* Bulk-imports menu items from a JSON file or pasted JSON, instead of adding
   one at a time through the inline form. */
export function BulkMenuUploadModal({
  open, businesses, token, onClose, toast,
}: {
  open: boolean;
  businesses: Row[];
  token: string;
  onClose: () => void;
  toast: ToastFn;
}) {
  const queryClient = useQueryClient();
  const [businessId, setBusinessId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationKey: ["admin", "menu-items", "bulk-upload"],
    mutationFn: (items: { businessId: string; name: string; price?: number }[]) =>
      api<{ created: number; skipped: number }>("/admin/menu-items/bulk", { method: "POST", token, body: { items } }),
    meta: { toastOnError: false }, // inline `error` state below
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "businesses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items", "list"] });
      if (res.skipped) {
        toast("info", `Uploaded ${res.created} item${res.created !== 1 ? "s" : ""} — ${res.skipped} row${res.skipped !== 1 ? "s" : ""} skipped`);
      } else {
        toast("success", `Uploaded ${res.created} item${res.created !== 1 ? "s" : ""}`);
      }
      setText("");
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Upload failed"),
  });
  useEscapeKey(onClose, open && !uploadMutation.isPending);

  if (!open) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => { setText(String(reader.result || "")); setError(""); };
    reader.onerror = () => setError("Could not read that file");
    reader.readAsText(file);
  };

  const copyExample = () => {
    navigator.clipboard
      .writeText(EXAMPLE)
      .then(() => { setCopied(true); toast("info", "Example JSON copied"); setTimeout(() => setCopied(false), 2500); })
      .catch(() => toast("error", "Could not copy to clipboard"));
  };

  const upload = () => {
    if (!businessId) {
      setError("Select which business this menu belongs to first");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That's not valid JSON — check for missing commas or quotes");
      return;
    }
    const items = extractItems(parsed);
    if (!items) {
      setError('Expected a JSON array of {"name": "...", "price": ...} items, or plain name strings');
      return;
    }
    const cleaned = items.map((it) => ({ name: it.name.trim(), price: it.price })).filter((it) => it.name);
    if (!cleaned.length) {
      setError("No item names found in that JSON");
      return;
    }

    setError("");
    uploadMutation.mutate(cleaned.map(({ name, price }) => ({ businessId, name, price })));
  };

  return (
    <Modal open={open} onClose={uploadMutation.isPending ? undefined : onClose} maxWidth="2xl" labelledBy="bulk-menu-title">
      <div className="max-h-[85vh] flex flex-col">
        <ModalHeader onClose={uploadMutation.isPending ? undefined : onClose}>
          <h2 id="bulk-menu-title" className="text-sm font-semibold text-fg">Bulk Upload Menu Items</h2>
        </ModalHeader>

        <div className="overflow-y-auto">
          <ModalBody>
            <p className="text-xs text-fg-tertiary leading-relaxed">
              Pick the business below, then upload or paste each item&apos;s name and price — no
              business ID needed, it&apos;s attached automatically, and any <code>id</code> field is
              ignored. Price is optional; plain name strings still work too. You can still add items
              one at a time from the form on this page, and you can run this upload as many times as
              you like.
            </p>

            <Field label="Business *" htmlFor="bulk-menu-business" error={error && !businessId ? error : undefined}>
              <Select
                id="bulk-menu-business"
                value={businessId}
                onChange={(e) => { setBusinessId(e.target.value); if (error) setError(""); }}
                error={!!(error && !businessId)}
              >
                <option value="">Select a business…</option>
                {businesses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </Select>
              {!businesses.length && (
                <p className="mt-1.5 text-xs text-fg-tertiary">No businesses yet — onboard one first from the Overview tab.</p>
              )}
            </Field>

            <div className="rounded-xl border border-border-strong bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Example JSON</span>
                <button
                  onClick={copyExample}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg-tertiary hover:text-fg hover:bg-surface-inset transition-colors cursor-pointer"
                >
                  {copied ? <><CheckIcon className="w-3.5 h-3.5 text-success" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <pre className="text-xs text-brand overflow-x-auto whitespace-pre">{EXAMPLE}</pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="bulk-menu-json" className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Paste JSON</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1 text-xs text-fg-tertiary hover:text-fg hover:border-fg-quaternary transition-colors cursor-pointer"
                >
                  <UploadIcon className="w-3.5 h-3.5" />
                  Upload .json file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
              </div>
              <Textarea
                id="bulk-menu-json"
                value={text}
                onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
                placeholder={EXAMPLE}
                rows={8}
                spellCheck={false}
                error={!!error}
                className="text-xs font-mono"
              />
              {error && (
                <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                  <AlertIcon className="w-3 h-3 shrink-0" />
                  {error}
                </p>
              )}
            </div>
          </ModalBody>
        </div>

        <ModalFooter>
          <Button onClick={upload} disabled={!text.trim() || !businessId} loading={uploadMutation.isPending} loadingText="Uploading…" variant="primary" className="ml-auto">
            Upload
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
