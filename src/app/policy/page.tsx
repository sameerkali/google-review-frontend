import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Policy — Review by Expendifii",
  description: "How Review by Expendifii keeps review collection clean: what we do, what we never do, and our refund policy.",
};

const POLICY_POINTS = [
  { title: "We do not write reviews.", body: "The text is built from answers the customer gave seconds earlier. They can edit every word." },
  { title: "We do not post reviews.", body: "The customer posts from their own Google account." },
  { title: "We do not filter by rating.", body: "Same screen, same button, one star or five." },
  { title: "We do not allow incentives.", body: "Businesses using our codes agree not to offer discounts or rewards for reviews." },
  { title: "We do not guarantee ratings.", body: "A restaurant's rating reflects the food and the service." },
];

export default function PolicyPage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-20 space-y-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-fg-tertiary hover:text-fg transition-colors mb-8">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-fg">Policy</h1>
          <p className="text-sm text-fg-tertiary mt-2">How we keep review collection clean.</p>
        </div>

        <section className="space-y-6">
          {POLICY_POINTS.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon className="w-3.5 h-3.5 text-success" />
              </div>
              <p className="text-sm text-fg-secondary leading-relaxed">
                <span className="font-semibold text-fg">{p.title}</span> {p.body}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-3 border-t border-border pt-10">
          <h2 className="text-lg font-semibold text-fg">Refund FAQ</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium text-fg">What if Google removes reviews?</p>
            <p className="text-sm text-fg-tertiary leading-relaxed">
              Reviews posted through us are written by real customers about real visits, so this should
              not happen. If it does and it traces back to our tool, we refund everything you have paid
              and help with the appeal, though we cannot promise Google will reverse it.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
