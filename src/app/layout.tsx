import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AdminShortcut } from "@/components/AdminShortcut";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Review by Expendifii",
  description: "Scan QR codes to leave reviews for your favourite businesses.",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // iOS ignores the web manifest for "add to home screen" behavior — without
  // these, Safari treats the install as a plain bookmark (no standalone
  // splash screen, so launches show raw blank white until the page paints
  // instead of the icon + background_color splash Android already gets from
  // manifest.ts).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expendifii",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b6cf0",
};

// Runs before first paint so the correct theme class is present before
// hydration — otherwise a stored/system light preference would flash dark.
const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Next's appleWebApp metadata only emits the modern unprefixed
            mobile-web-app-capable tag — older iOS Safari versions only
            recognize this vendor-prefixed one for standalone/splash mode. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-fg">
        <ServiceWorkerRegister />
        <AdminShortcut />
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
