import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroQrCode } from "@/components/HeroQrCode";
import { QrScanScroll } from "@/components/QrScanScroll";
import {
  QrIcon,
  ArrowRightIcon,
  ChatIcon,
  GoogleLogoIcon,
  DeviceMobileIcon,
  StorefrontIcon,
  SparkleIcon,
} from "@/components/icons";

export default function Home() {
  return (
    <div className="bg-background overflow-x-clip">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/25 flex items-center justify-center">
              <QrIcon className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-fg">QR Review</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="/business/login"
              className="inline-flex items-center rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold px-4 py-2 text-xs transition-all duration-150 active:scale-[0.98]"
            >
              Business Login
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.08] text-fg">
              Reviews start with a scan, not a request.
            </h1>
            <p className="text-fg-tertiary text-base leading-relaxed max-w-[46ch]">
              Print one QR code. Customers scan it, copy a ready-made review, and land straight on your Google listing.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="/business/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold px-5 py-2.5 text-sm transition-all duration-150 active:scale-[0.98]"
              >
                Business Login
                <ArrowRightIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* A real photo of a counter (placeholder, swap for your own) with
              a real, scannable QR code composed over the corner, the way it
              would actually sit on a till. The only motion on the page: a
              thin scan line that tracks scroll position as this block moves
              through the viewport — scrubbed by hand, not looped. */}
          <div className="flex justify-center lg:justify-end">
            <QrScanScroll className="w-full max-w-[340px]">
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl">
                <Image
                  src="https://picsum.photos/seed/qr-review-counter/800/1000"
                  alt="A café counter, the kind of spot a QR review code lives next to the till"
                  fill
                  sizes="(min-width: 1024px) 340px, 80vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-8 -left-8 sm:-left-10">
                <HeroQrCode size={132} />
              </div>
            </QrScanScroll>
          </div>
        </section>

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

        {/* Photo strip — works wherever customers already are. Placeholders
            (picsum), swap for real photos of the shops using it. */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-fg max-w-[24ch] mb-10">
              Works wherever the till does.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { seed: "qr-review-cafe", label: "Cafés and bakeries" },
                { seed: "qr-review-salon", label: "Salons and clinics" },
                { seed: "qr-review-shop", label: "Shops and studios" },
              ].map((item) => (
                <figure key={item.seed}>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                    <Image
                      src={`https://picsum.photos/seed/${item.seed}/500/620`}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 33vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm text-fg-secondary">{item.label}</figcaption>
                </figure>
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
            <span className="text-xs text-fg-tertiary">© 2026 QR Review Platform</span>
          </div>
          <a href="/admin/login" className="text-xs text-fg-quaternary hover:text-fg-tertiary transition-colors">
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
