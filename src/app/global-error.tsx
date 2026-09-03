"use client";

/* Catches an exception in the root layout itself - the one place app/error.tsx
   can't reach, since it renders inside that same layout. This replaces the
   entire document when active, so it can't rely on globals.css, fonts, or
   ThemeProvider (none of that has necessarily mounted) - plain inline styles
   only, as a true last-resort fallback. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#0b0b0b", color: "#fafafa" }}>
        <div style={{ textAlign: "center", maxWidth: 360, padding: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Something went wrong</p>
          <p style={{ fontSize: 14, color: "#a1a1aa", margin: "0 0 16px" }}>
            The app failed to load. Try again, or reload the page.
          </p>
          <button
            onClick={reset}
            style={{ borderRadius: 999, background: "#3b6cf0", color: "#fff", border: "none", padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
