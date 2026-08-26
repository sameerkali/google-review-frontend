import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroQrCode } from "@/components/HeroQrCode";
import { AuthLandingRedirect } from "@/components/AuthLandingRedirect";
import { GoogleReviewCard } from "@/components/GoogleReviewCard";
import { WavyBackground } from "@/components/ui/wavy-background";
import {
  QrIcon,
  ArrowRightIcon,
  ChatIcon,
  GoogleLogoIcon,
  DeviceMobileIcon,
  StorefrontIcon,
  SparkleIcon,
} from "@/components/icons";

/* A plain-language, factual description of the service — read by search
   crawlers and AI agents, not rendered visually. Kept in sync with what the
   product actually does (see the four screenshots below for the same
   claims made visually). */
const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Review by Expendifii",
  serviceType: "QR code Google review collection",
  description:
    "A QR-code-based system for collecting Google reviews. Customers scan a QR code, copy a ready-made review suggestion, and are taken directly to the business's Google review page — no app, login, or account required. Each business is onboarded and managed by a platform operator, who also provides a printable poster and QR code generator (multiple print sizes and designs) and an analytics dashboard tracking scans, review copies, and Google clicks as a conversion funnel.",
  provider: { "@type": "Organization", name: "Expendifii" },
  audience: {
    "@type": "Audience",
    audienceType: "Local businesses collecting Google reviews, such as cafés, salons, and clinics",
  },
};

const FLOW_STEPS = [
  {
    title: "The operator sets up the business",
    body: "A business is onboarded from the admin panel — plan, contact details, and a physical QR code assigned from tracked hardware stock.",
    src: "/screenshots/admin-overview.png",
    alt: "Admin panel overview showing total businesses, hardware stock, and recent scan activity",
  },
  {
    title: "A print-ready poster is generated",
    body: "Pick a size and a design — the QR is real and already embedded, previewed at full resolution exactly as it will print.",
    src: "/screenshots/poster-designs.png",
    alt: "Poster design picker showing six live QR poster templates for a café",
  },
  {
    title: "A customer scans and leaves a review",
    body: "No app, no login. They copy a ready-made suggestion, then tap through straight to the business's real Google review page.",
    src: "/screenshots/review-flow.png",
    alt: "Customer-facing review page showing suggested reviews with a copy button and a Leave a Google Review button",
  },
  {
    title: "The business sees real conversion",
    body: "Scans, copies, and Google clicks tracked as an actual funnel — not just a scan counter — plus device and browser breakdowns.",
    src: "/screenshots/business-dashboard.png",
    alt: "Business dashboard showing scan/click analytics charts and a conversion funnel",
  },
];

export default function Home() {
  return (
    <div className="bg-background overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSON_LD) }} />
      <AuthLandingRedirect />

      <main>
        {/* Theme toggle floats fixed over everything — the landing page has
            no nav bar for it to live in, and it needs to stay reachable
            whether the wave (always dark) or a themed section is underneath. */}
        <ThemeToggle className="fixed top-4 right-4 z-20 bg-surface/80 backdrop-blur-md border border-border shadow-sm" />

        {/* Hero — no nav bar at all. Wave colors are the brand blue family only,
            fixed dark regardless of page theme (same precedent as the
            brand-blue final CTA band below). */}
        <WavyBackground
          colors={["#3b6cf0", "#5a84f3", "#93b4fb", "#2f56c4", "#1c3f8f"]}
          backgroundFill="#05070f"
          waveOpacity={0.35}
          blur={14}
          speed="slow"
          containerClassName="!h-auto !min-h-0"
        >
          <div className="w-full">
            <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.08] text-white">
                  Reviews start with a scan, not a request.
                </h1>
                <p className="text-white/70 text-base leading-relaxed max-w-[46ch]">
                  Print one QR code. Customers scan it, copy a ready-made review, and land straight on your Google listing.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="/business/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-white/90 text-brand font-semibold px-5 py-2.5 text-sm transition-all duration-150 active:scale-[0.98]"
                  >
                    Business Login
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* What actually shows up on the business's Google listing,
                  and the real, scannable QR code that leads there (encodes
                  this page's own URL) — stacked, not overlapping, so
                  nothing ever covers the review text. */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[420px] space-y-4">
                  <GoogleReviewCard />
                  <div className="flex items-center gap-3 justify-end">
                    <p className="text-xs text-white/50 text-right leading-snug">
                      A real, scannable code<br />pointing at this page
                    </p>
                    <div className="shrink-0">
                      <HeroQrCode size={64} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </WavyBackground>

        {/* How it works */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg text-center mb-12">
              From QR code to Google review
            </h2>
            <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-8 md:gap-4 items-start">
              <Step
                icon={<QrIcon className="w-5 h-5 text-brand" />}
                title="Stick up your QR code"
                body="One code per till or table. We print it, you place it."
              />
              <Connector />
              <Step
                icon={<ChatIcon className="w-5 h-5 text-brand" />}
                title="Customer picks a review"
                body="They scan, read a couple of honest suggestions, and copy the one that fits."
              />
              <Connector />
              <Step
                icon={<GoogleLogoIcon className="w-5 h-5 text-brand" />}
                title="It posts straight to Google"
                body="One tap drops them on your listing, review already in the clipboard."
              />
            </div>
          </div>
        </section>

        {/* Full flow, in screenshots — real product UI, not stock photos or
            mockups. Each caption states plainly what's happening, so the
            section is legible from its text alone (to a screen reader, a
            crawler, or an agent parsing the page), not just the image. */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg max-w-[28ch] mb-2">
              How a review actually gets collected.
            </h2>
            <p className="text-fg-tertiary text-sm max-w-[52ch] mb-10">
              Four real screens from the product, in order — from setup to a posted review.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FLOW_STEPS.map((step, i) => (
                <FlowCard key={step.title} index={i + 1} {...step} />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">
                No app. No login. No excuse to skip it.
              </h2>
              <p className="text-fg-tertiary text-sm leading-relaxed max-w-[46ch]">
                Customers already have a phone and a camera. That&apos;s the whole install process.
              </p>
            </div>
            <div className="divide-y divide-border">
              <Benefit icon={<DeviceMobileIcon className="w-4.5 h-4.5" />} text="Works with any phone, no app to install" />
              <Benefit icon={<StorefrontIcon className="w-4.5 h-4.5" />} text="Set up once per location, works for every visit" />
              <Benefit icon={<SparkleIcon className="w-4.5 h-4.5" />} text="Reviews go straight to your real Google listing" />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-brand">
          <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20 text-center space-y-5">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">Ready when you are.</h2>
            <p className="text-sm text-white/80">
              Existing customer? Sign in to see your QR code and reviews.
            </p>
            <a
              href="/business/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-brand font-semibold px-6 py-3 text-sm hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Business Login
              <ArrowRightIcon className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-brand/15 border border-brand/25 flex items-center justify-center">
              <QrIcon className="w-3 h-3 text-brand" />
            </div>
            <span className="text-xs text-fg-tertiary">© 2026 Review by Expendifii</span>
          </div>
          <a
            href="/admin/login"
            className="inline-flex items-center rounded-xl border border-border hover:border-border-strong text-sm text-fg-secondary hover:text-fg px-4 py-2 transition-colors"
          >
            Admin
          </a>
        </div>
      </footer>
    </div>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="space-y-2.5">
      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">{icon}</div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="text-sm text-fg-tertiary leading-relaxed">{body}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="hidden md:flex items-center justify-center pt-4">
      <ArrowRightIcon className="w-4 h-4 text-fg-quaternary" />
    </div>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="w-8 h-8 rounded-lg bg-surface-inset flex items-center justify-center text-brand shrink-0">{icon}</div>
      <p className="text-sm text-fg-secondary">{text}</p>
    </div>
  );
}

function FlowCard({ index, title, body, src, alt }: { index: number; title: string; body: string; src: string; alt: string }) {
  return (
    <figure className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="relative h-64 bg-surface-inset flex items-center justify-center p-4">
        <Image src={src} alt={alt} fill sizes="(min-width: 640px) 50vw, 90vw" className="object-contain p-4" />
      </div>
      <figcaption className="p-5 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-brand/15 text-brand text-xs font-semibold flex items-center justify-center shrink-0">
            {index}
          </span>
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
        </div>
        <p className="text-sm text-fg-tertiary leading-relaxed">{body}</p>
      </figcaption>
    </figure>
  );
}
