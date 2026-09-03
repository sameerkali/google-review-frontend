import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroQrCode } from "@/components/HeroQrCode";
import { AuthLandingRedirect } from "@/components/AuthLandingRedirect";
import { GoogleReviewCard } from "@/components/GoogleReviewCard";
import { PinnedSection } from "@/components/PinnedSection";
import { WavyBackground } from "@/components/ui/wavy-background";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import Link from "next/link";
import {
  QrIcon,
  ArrowRightIcon,
  ChatIcon,
  GoogleLogoIcon,
  DeviceMobileIcon,
  StorefrontIcon,
  SparkleIcon,
  CheckIcon,
} from "@/components/icons";

/* A plain-language, factual description of the service - read by search
   crawlers and AI agents, not rendered visually. Kept in sync with what the
   product actually does (see /policy for the full honesty statement). */
const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Review by Expendifii",
  serviceType: "QR code Google review collection",
  description:
    "A QR-code-based feedback system. Customers scan a QR code at the table, answer three quick tap questions about their visit, and get a short draft built only from their own answers - which they can edit before posting it to the business's real Google review page. No app, login, or account required, and the same flow and the same Google button show up whatever they rate the visit. Each business is onboarded and managed by a platform operator, who also provides a printable poster and QR code generator and an analytics dashboard tracking scans and Google clicks as a conversion funnel.",
  provider: { "@type": "Organization", name: "Expendifii" },
  audience: {
    "@type": "Audience",
    audienceType: "Local businesses collecting Google reviews, such as Cafes, salons, and clinics",
  },
};

// WhatsApp is the actual sales channel right now (doorknocking + a founder
// closing the deal), not a self-serve signup form - so "claim a spot" hands
// off to a real conversation with a prefilled opener instead of a form.
const FOUNDING_PARTNER_WHATSAPP_URL =
  "https://wa.me/919639356395?text=" +
  encodeURIComponent("Hi! I'd like to claim a Founding Partner spot - Full plan at ₹499/month, locked for 12 months, setup waived.");

export default function Home() {
  return (
    <div className="bg-background overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_JSON_LD) }} />
      <AuthLandingRedirect />

      <main>
        {/* Theme toggle floats fixed over everything - the landing page has
            no nav bar for it to live in, and it needs to stay reachable
            whether the wave (always dark) or a themed section is underneath. */}
        <ThemeToggle className="fixed top-4 right-4 z-20 bg-surface/80 backdrop-blur-md border border-border shadow-sm" />

        {/* Hero - no nav bar at all. Wave colors are the brand blue family only,
            fixed dark regardless of page theme (same precedent as the
            brand-blue final CTA band below). Pinned to the viewport while
            everything below scrolls up and over it (see PinnedSection). */}
        <PinnedSection>
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
                  <span className="inline-block text-xs font-semibold tracking-wide uppercase text-white bg-white/10 border border-white/15 rounded-full px-3 py-1">
                    Built for one goal - 200+ Google reviews in your first 60 days
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.08] text-white">
                    Find out what your customers actually think.
                  </h1>
                  <p className="text-white/70 text-base leading-relaxed max-w-[46ch]">
                    One QR on the table. Three taps. They tell you what they ordered and how it was, then post it to Google in their own words.
                  </p>
                  <div className="pt-1">
                    <HoverBorderGradient
                      as="a"
                      href="/business/login"
                      className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5"
                    >
                      Business Login
                      <ArrowRightIcon className="w-4 h-4" />
                    </HoverBorderGradient>
                  </div>
                </div>

                {/* What actually shows up on the business's Google listing,
                    and the real, scannable QR code that leads there (encodes
                    this page's own URL) - stacked, not overlapping, so
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
        </PinnedSection>

        {/* Everything below the hero - higher z-index and its own opaque
            background, so it visually scrolls up and covers the pinned
            hero instead of scrolling past it. */}
        <div className="relative z-10 bg-background">

        {/* The problem */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24 text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">
              Most happy customers never say anything.
            </h2>
            <p className="text-fg-tertiary text-sm leading-relaxed max-w-[56ch] mx-auto">
              Ask a hundred people to review you and one or two will actually do it. Not because they
              didn&apos;t like the food. Because it means opening Google, searching your name, finding
              the right listing, and typing something out on a phone with one hand.
            </p>
            <p className="text-fg-tertiary text-sm leading-relaxed max-w-[56ch] mx-auto">
              The ones who do bother are usually the angry ones. That&apos;s why your rating looks
              worse than your restaurant actually is.
            </p>
          </div>
        </section>

        {/* How it works - three steps, nothing else. Deliberately just the
            customer-facing flow (scan, answer, post) - the business-facing
            payoff (what you see on your side) belongs to the pricing
            section below, not here, so this stays skimmable in one glance. */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg text-center mb-12">
              From QR code to Google review
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <Step
                icon={<QrIcon className="w-5 h-5 text-brand" />}
                title="1. Scan"
                body="One QR code on the table. No app, no login."
              />
              <Step
                icon={<ChatIcon className="w-5 h-5 text-brand" />}
                title="2. Answer"
                body="Three taps - what they had, how it was, anything worth mentioning."
              />
              <Step
                icon={<GoogleLogoIcon className="w-5 h-5 text-brand" />}
                title="3. Post"
                body="A short draft in their own words. They can edit it, then post it to Google."
              />
            </div>
          </div>
        </section>

        {/* Honesty block - on the landing page, not buried in a policy footnote. */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg text-center mb-10">
              How we keep this clean
            </h2>
            <div className="space-y-5">
              <HonestyPoint text="Customers write their own reviews. We never write one for them and we never post on anyone's behalf." />
              <HonestyPoint text="Everyone sees the Google button, whatever they rate you. We do not hide it from unhappy customers." />
              <HonestyPoint text="No discounts, no free coffee, no rewards for reviewing. Those break Google's rules and get listings penalised." />
              <HonestyPoint text="If the feedback is bad, that is information you needed." />
            </div>
            <p className="text-center text-sm text-fg-tertiary mt-8">
              Full details on <Link href="/policy" className="text-brand hover:text-brand-hover font-medium">our policy page</Link>.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg text-center mb-2">Pricing</h2>
            <p className="text-fg-tertiary text-sm text-center max-w-[52ch] mx-auto mb-10">
              ₹999 one-time setup. Cancel any month - your QR keeps working for 30 days after you stop.
            </p>

            {/* Founding Partner callout - first 20 businesses only, Full
                plan at the Basic price, locked for a fixed 12 months (not
                "for life," so it never becomes an un-fixable promise). */}
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6 sm:p-8 mb-10 max-w-3xl mx-auto text-center space-y-3">
              <span className="inline-block text-xs font-semibold tracking-wide uppercase text-brand bg-brand/10 rounded-full px-3 py-1">
                Founding Partner - first 20 businesses
              </span>
              <p className="text-2xl sm:text-3xl font-bold text-fg">
                Full plan at ₹499<span className="text-sm font-normal text-fg-tertiary">/mo</span>
              </p>
              <p className="text-sm text-fg-secondary max-w-[46ch] mx-auto">
                Locked for 12 months. Setup fee waived. Every Full feature, at the Basic price.
              </p>
              <div className="pt-1">
                <HoverBorderGradient
                  as="a"
                  href={FOUNDING_PARTNER_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5"
                >
                  Claim a founding spot
                  <ArrowRightIcon className="w-4 h-4" />
                </HoverBorderGradient>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <PricingCard
                name="Basic"
                price="₹499"
                period="/mo"
                subprice="or ₹4,999/yr"
                features={[
                  "Your own QR code, ready to print",
                  "Ratings over time",
                  "Scan-to-review conversion numbers",
                  "Weekly WhatsApp summary",
                ]}
                note="By invite only during launch"
              />
              <PricingCard
                name="Full"
                price="₹1,499"
                period="/mo"
                subprice="or ₹14,999/yr"
                intro="Everything in Basic, plus:"
                features={[
                  "Menu-item breakdown",
                  "Complaint & praise themes",
                  "Shift view - rating by time of day",
                  "Growth suggestions from your own numbers",
                  "Compare across time periods",
                  "Monthly report",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">
                No app. No login. Nothing to install.
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
            <HoverBorderGradient
              as="a"
              href="/business/login"
              containerClassName="mx-auto"
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3"
            >
              Business Login
              <ArrowRightIcon className="w-4 h-4" />
            </HoverBorderGradient>
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/icon-512.png" alt="" width={24} height={24} className="w-6 h-6 rounded-md" />
            <span className="text-xs text-fg-tertiary">© 2026 Review by Expendifii</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/policy" className="text-sm font-medium text-fg-tertiary hover:text-fg transition-colors">
              Policy
            </Link>
            <HoverBorderGradient
              as="a"
              href="/admin/login"
              className="text-sm font-medium px-4 py-2"
            >
              Admin
            </HoverBorderGradient>
          </div>
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

function HonestyPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
        <CheckIcon className="w-3.5 h-3.5 text-success" />
      </div>
      <p className="text-sm text-fg-secondary leading-relaxed">{text}</p>
    </div>
  );
}

function PricingCard({ name, price, period, subprice, intro, features, note }: { name: string; price: string; period: string; subprice?: string; intro?: string; features: string[]; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-fg">{name}</h3>
        <p className="text-2xl font-bold text-fg mt-1">
          {price}<span className="text-sm font-normal text-fg-tertiary">{period}</span>
        </p>
        {subprice && <p className="text-xs text-fg-tertiary mt-0.5">{subprice}</p>}
      </div>
      {intro && <p className="text-xs font-medium text-fg-tertiary">{intro}</p>}
      <div className="space-y-2">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-fg-secondary">
            <CheckIcon className="w-4 h-4 text-success shrink-0" />
            {f}
          </div>
        ))}
      </div>
      {note && <p className="text-xs text-fg-quaternary pt-1 border-t border-border">{note}</p>}
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

