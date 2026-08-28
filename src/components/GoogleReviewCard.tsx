import { StarFillIcon } from "@/components/icons";

/* The real, multi-color Google "G" mark — used for its literal purpose
   (this card illustrates what a review posted through the product looks
   like on Google), not as decoration. */
export function GoogleG({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C40.971 35.205 44 30 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

/* A big, realistic Google review card — illustrating what a review posted
   through the product looks like on the business's real Google listing.
   Always a plain white surface regardless of page theme, same as an actual
   Google review would render (not tinted to match our own light/dark
   tokens). Example content, not a real customer quote. */
export function GoogleReviewCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-3xl bg-white border border-black/10 shadow-2xl p-8 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand/15 text-brand font-semibold text-lg flex items-center justify-center shrink-0">
            M
          </div>
          <div>
            <p className="text-[15px] font-semibold text-zinc-900">Anmol Kumar</p>
            <p className="text-xs text-zinc-500">2 minutes ago</p>
          </div>
        </div>
        <GoogleG className="w-6 h-6 shrink-0" />
      </div>

      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarFillIcon key={i} className="w-6 h-6" style={{ color: "#FBBC04" }} />
        ))}
      </div>

      <p className="text-[17px] leading-relaxed text-zinc-800 max-w-[36ch]">
        Great coffee, welcoming spot, and the staff remembered my order. Will be back.
      </p>
    </div>
  );
}
