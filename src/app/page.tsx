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

const FLOW_STEPS = [
  {
    title: "The operator sets up the business",
    body: "A business is onboarded from the admin panel - plan, contact details, and a physical QR code assigned from tracked hardware stock.",
    src: "/screenshots/admin-overview.png",
    alt: "Admin panel overview showing total businesses, hardware stock, and recent scan activity",
  },
  {
    title: "A print-ready poster is generated",
    body: "Pick a size and a design - the QR is real and already embedded, previewed at full resolution exactly as it will print.",
    src: "/screenshots/poster-designs.png",
    alt: "Poster design picker showing six live QR poster templates for a Cafe",
  },
  {
    title: "The business sees real conversion",
    body: "Scans, copies, and Google clicks tracked as an actual funnel - not just a scan counter - plus device and browser breakdowns.",
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

        {/* How it works */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg text-center mb-12">
              From QR code to Google review
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Step
                icon={<QrIcon className="w-5 h-5 text-brand" />}
                title="Put the code on the table"
                body="We print it, you place it."
              />
              <Step
                icon={<ChatIcon className="w-5 h-5 text-brand" />}
                title="Three quick questions"
                body="What did you have, how was it, anything worth mentioning. Taps, not typing."
              />
              <Step
                icon={<SparkleIcon className="w-5 h-5 text-brand" />}
                title="They see their own words"
                body="Their answers become a short draft they can edit before it goes anywhere."
              />
              <Step
                icon={<GoogleLogoIcon className="w-5 h-5 text-brand" />}
                title="You see what people are saying"
                body="Which dishes get mentioned, what the complaints are, which days are strong."
              />
            </div>
          </div>
        </section>

        {/* Full flow, in screenshots - real product UI, not stock photos or
            mockups. Each caption states plainly what's happening, so the
            section is legible from its text alone (to a screen reader, a
            crawler, or an agent parsing the page), not just the image. */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg max-w-[28ch] mb-2">
              How a review actually gets collected.
            </h2>
            <p className="text-fg-tertiary text-sm max-w-[52ch] mb-10">
              Real screens from the product, in order - from setup to a posted review.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FLOW_STEPS.map((step, i) => (
                <FlowCard key={step.title} index={i + 1} {...step} />
              ))}
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
            <p className="text-fg-tertiary text-sm text-center max-w-[52ch] mx-auto mb-12">
              Setup - ₹500 one time, first month included. Cancel any month - your QR keeps working for 30 days after you stop.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <PricingCard
                name="Basic"
                price="₹299"
                period="/mo"
                features={["Ratings over time", "Scan and post numbers", "Weekly WhatsApp summary"]}
              />
              <PricingCard
                name="Full"
                price="₹499"
                period="/mo"
                features={["Menu-item breakdown", "Low-rating themes", "Shift view", "Monthly report"]}
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

function PricingCard({ name, price, period, features }: { name: string; price: string; period: string; features: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-fg">{name}</h3>
        <p className="text-2xl font-bold text-fg mt-1">
          {price}<span className="text-sm font-normal text-fg-tertiary">{period}</span>
        </p>
      </div>
      <div className="space-y-2">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-fg-secondary">
            <CheckIcon className="w-4 h-4 text-success shrink-0" />
            {f}
          </div>
        ))}
      </div>
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
