"use client";

import { useRef, useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, UploadIcon } from "@/components/icons";
import { Textarea } from "@/components/ui/Input";
import { MENU_JSON_EXAMPLE } from "@/lib/parseMenuJson";

/* Paste-or-upload JSON box shared by the admin bulk uploader and the
   onboarding wizard's menu step, so both stay in sync on format and copy. */
export function MenuJsonInput({
  id = "menu-json-input", value, onChange, error, rows = 8,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
}) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.readAsText(file);
  };

  const copyExample = () => {
    navigator.clipboard
      .writeText(MENU_JSON_EXAMPLE)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
      .catch(() => {});
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border-strong bg-background p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Example JSON</span>
          <button
            type="button"
            onClick={copyExample}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-fg-tertiary hover:text-fg hover:bg-surface-inset transition-colors cursor-pointer"
          >
            {copied ? <><CheckIcon className="w-3.5 h-3.5 text-success" /> Copied</> : <><CopyIcon className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <pre className="text-xs text-brand overflow-x-auto whitespace-pre">{MENU_JSON_EXAMPLE}</pre>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="text-xs font-medium text-fg-tertiary uppercase tracking-wider">Paste JSON</label>
          <button
            type="button"
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
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={MENU_JSON_EXAMPLE}
          rows={rows}
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
    </div>
  );
}
