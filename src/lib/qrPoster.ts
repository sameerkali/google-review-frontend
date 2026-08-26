import QRCode from "qrcode";

const BRAND = "#3b6cf0";
const BRAND_DARK = "#2f56c4";
const CREAM = "#f3efe4";
const INK = "#0f172a";
const FONT_STACK = "'Helvetica Neue', Arial, sans-serif";

/* ─── Sizes (print ratios) ─────────────────────────────────────────── */

export type PosterSizeKey = "a4" | "card" | "square" | "tall";

export interface PosterSize {
  key: PosterSizeKey;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}

export const POSTER_SIZES: PosterSize[] = [
  { key: "a4", label: "Wall Poster", sublabel: "A4 · 210 × 297 mm", width: 1240, height: 1754 },
  { key: "card", label: "Table Card", sublabel: "4:5 · counter card", width: 1080, height: 1350 },
  { key: "square", label: "Square Card", sublabel: "1:1 · table tent", width: 1080, height: 1080 },
  { key: "tall", label: "Tall Card", sublabel: "9:16 · bookmark", width: 1080, height: 1920 },
];

export function getPosterSize(key: string | null): PosterSize {
  return POSTER_SIZES.find((s) => s.key === key) ?? POSTER_SIZES[1];
}

/* ─── Designs ───────────────────────────────────────────────────────── */

export type PosterDesignKey = "classic" | "minimal" | "bold" | "cafe" | "frame" | "split";

export interface PosterDesignMeta {
  key: PosterDesignKey;
  label: string;
  description: string;
  swatch: string;
}

export const POSTER_DESIGNS: PosterDesignMeta[] = [
  { key: "classic", label: "Classic", description: "Brand blue, bold and centered", swatch: BRAND },
  { key: "minimal", label: "Minimal", description: "Clean cream background, quiet type", swatch: CREAM },
  { key: "bold", label: "Bold Dark", description: "High-contrast ink background", swatch: INK },
  { key: "cafe", label: "Café", description: "Illustrated, warm counter-side feel", swatch: BRAND },
  { key: "frame", label: "Frame", description: "Thin bordered, editorial", swatch: CREAM },
  { key: "split", label: "Split", description: "Two-tone block with an offset QR", swatch: BRAND_DARK },
];

export function getPosterDesign(key: string | null): PosterDesignMeta {
  return POSTER_DESIGNS.find((d) => d.key === key) ?? POSTER_DESIGNS[0];
}

/* ─── Categories ────────────────────────────────────────────────────── */

/* Each category lists which designs are relevant to it — cafe gets the
   illustrated "cafe" design on top of the generic set; salon/doctor don't
   have illustrated designs yet (no assets), so they get the generic set
   only. Adding a salon/doctor illustration later is just adding its
   designKey to that category's list here. */
export type PosterCategoryKey = "cafe" | "salon" | "doctor";

export interface PosterCategoryMeta {
  key: PosterCategoryKey;
  label: string;
  description: string;
  designKeys: PosterDesignKey[];
}

const GENERIC_DESIGNS: PosterDesignKey[] = ["classic", "minimal", "bold", "frame", "split"];

export const POSTER_CATEGORIES: PosterCategoryMeta[] = [
  { key: "cafe", label: "Café", description: "Coffee shops, bakeries, restaurants", designKeys: ["cafe", ...GENERIC_DESIGNS] },
  { key: "salon", label: "Salon", description: "Salons, spas, barbershops", designKeys: [...GENERIC_DESIGNS] },
  { key: "doctor", label: "Doctor", description: "Clinics, dentists, healthcare", designKeys: [...GENERIC_DESIGNS] },
];

export function getPosterCategory(key: string | null): PosterCategoryMeta {
  return POSTER_CATEGORIES.find((c) => c.key === key) ?? POSTER_CATEGORIES[0];
}

export function designsForCategory(categoryKey: string | null): PosterDesignMeta[] {
  const category = getPosterCategory(categoryKey);
  return category.designKeys
    .map((k) => POSTER_DESIGNS.find((d) => d.key === k))
    .filter((d): d is PosterDesignMeta => !!d);
}

/* ─── Editable text fields ──────────────────────────────────────────── */

export type QrPosterFields = {
  eyebrow: string;
  heading: string;
  subheading: string;
  displayName: string;
  footer: string;
};

export function qrPosterDefaults(businessName: string): QrPosterFields {
  return {
    eyebrow: "REVIEW BY EXPENDIFII",
    heading: "SCAN HERE",
    subheading: "TO LEAVE US A REVIEW",
    displayName: businessName,
    footer: "Powered by Expendifii",
  };
}

/* ─── Canvas helpers ────────────────────────────────────────────────── */

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, weight: number, minSize = 14): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

function drawPill(ctx: CanvasRenderingContext2D, cx: number, y: number, text: string, opts: {
  fontSize: number; weight: number; maxWidth: number; bg: string; fg: string;
}): number {
  const size = fitFontSize(ctx, text, opts.maxWidth - opts.fontSize * 2, opts.fontSize, opts.weight, 12);
  ctx.font = `${opts.weight} ${size}px ${FONT_STACK}`;
  const textW = ctx.measureText(text).width;
  const h = size * 2.15;
  const w = textW + h * 0.85;
  ctx.fillStyle = opts.bg;
  roundRectPath(ctx, cx - w / 2, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = opts.fg;
  ctx.fillText(text, cx, y + h / 2 + size * 0.34);
  return y + h;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/** Draws the white rounded QR box with the code centered inside; returns
    the y just below the box, for callers flowing content downward. */
function drawQrBox(ctx: CanvasRenderingContext2D, qrCanvas: HTMLCanvasElement, cx: number, y: number, size: number, opts: { shadow?: boolean; border?: string } = {}): number {
  const x = cx - size / 2;
  ctx.save();
  if (opts.shadow !== false) {
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = size * 0.06;
    ctx.shadowOffsetY = size * 0.024;
  }
  ctx.fillStyle = "#ffffff";
  const radius = size * 0.06;
  roundRectPath(ctx, x, y, size, size, radius);
  ctx.fill();
  ctx.restore();
  if (opts.border) {
    ctx.save();
    ctx.strokeStyle = opts.border;
    ctx.lineWidth = size * 0.012;
    roundRectPath(ctx, x, y, size, size, radius);
    ctx.stroke();
    ctx.restore();
  }
  const pad = size * 0.09;
  const inner = size - pad * 2;
  ctx.drawImage(qrCanvas, x + pad, y + pad, inner, inner);
  return y + size;
}

/* ─── Design draw functions ─────────────────────────────────────────── */

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  fields: QrPosterFields;
  qrCanvas: HTMLCanvasElement;
  illustration: HTMLImageElement | null;
}

function drawClassic(d: DrawCtx) {
  const { ctx, W, H, fields } = d;
  const unit = Math.min(W, H);
  const padX = W * 0.09;

  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = H * 0.05;
  y = drawPill(ctx, W / 2, y, fields.eyebrow, { fontSize: H * 0.021, weight: 700, maxWidth: W - padX * 2, bg: "rgba(255,255,255,0.16)", fg: "#ffffff" });
  y += H * 0.032;

  const headingSize = fitFontSize(ctx, fields.heading, W - padX * 1.3, H * 0.1, 800, unit * 0.04);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  y += headingSize * 0.82;
  ctx.fillText(fields.heading, W / 2, y);
  y += headingSize * 0.32;

  y = drawPill(ctx, W / 2, y, fields.subheading, { fontSize: H * 0.024, weight: 700, maxWidth: W - padX * 2, bg: CREAM, fg: BRAND });
  y += H * 0.045;

  const boxSize = unit * 0.56;
  y = drawQrBox(ctx, d.qrCanvas, W / 2, y, boxSize);
  y += H * 0.058;

  const nameSize = fitFontSize(ctx, fields.displayName, W - padX * 2, H * 0.036, 800, 20);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  y += nameSize * 0.8;
  ctx.fillText(fields.displayName, W / 2, y);
  y += H * 0.024;

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - unit * 0.05, y);
  ctx.lineTo(W / 2 + unit * 0.05, y);
  ctx.stroke();
  y += H * 0.035;

  const footerSize = fitFontSize(ctx, fields.footer, W - padX * 2, H * 0.018, 600, 12);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(fields.footer, W / 2, y);
}

function drawMinimal(d: DrawCtx) {
  const { ctx, W, H, fields } = d;
  const unit = Math.min(W, H);
  const padX = W * 0.1;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = H * 0.08;
  const eyebrowSize = fitFontSize(ctx, fields.eyebrow, W - padX * 2, H * 0.02, 700, 12);
  ctx.font = `700 ${eyebrowSize}px ${FONT_STACK}`;
  ctx.fillStyle = BRAND;
  y += eyebrowSize;
  ctx.fillText(fields.eyebrow, W / 2, y);
  y += H * 0.035;

  const headingSize = fitFontSize(ctx, fields.heading, W - padX * 1.3, H * 0.095, 800, unit * 0.04);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = INK;
  y += headingSize * 0.82;
  ctx.fillText(fields.heading, W / 2, y);
  y += headingSize * 0.28;

  const subSize = fitFontSize(ctx, fields.subheading, W - padX * 2, H * 0.024, 600, 12);
  ctx.font = `600 ${subSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(15,23,42,0.62)";
  y += subSize * 0.9;
  ctx.fillText(fields.subheading, W / 2, y);
  y += H * 0.05;

  // Thin rule
  ctx.strokeStyle = "rgba(15,23,42,0.15)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - unit * 0.09, y);
  ctx.lineTo(W / 2 + unit * 0.09, y);
  ctx.stroke();
  y += H * 0.045;

  const boxSize = unit * 0.56;
  y = drawQrBox(ctx, d.qrCanvas, W / 2, y, boxSize, { shadow: false, border: "rgba(59,108,240,0.3)" });
  y += H * 0.058;

  const nameSize = fitFontSize(ctx, fields.displayName, W - padX * 2, H * 0.036, 800, 20);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = INK;
  y += nameSize * 0.8;
  ctx.fillText(fields.displayName, W / 2, y);
  y += H * 0.05;

  const footerSize = fitFontSize(ctx, fields.footer, W - padX * 2, H * 0.017, 600, 11);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(15,23,42,0.45)";
  ctx.fillText(fields.footer, W / 2, y);
}

function drawBold(d: DrawCtx) {
  const { ctx, W, H, fields } = d;
  const unit = Math.min(W, H);
  const padX = W * 0.09;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = H * 0.055;
  y = drawPill(ctx, W / 2, y, fields.eyebrow, { fontSize: H * 0.021, weight: 700, maxWidth: W - padX * 2, bg: "rgba(59,108,240,0.22)", fg: "#8fa8f7" });
  y += H * 0.038;

  const headingSize = fitFontSize(ctx, fields.heading, W - padX * 1.1, H * 0.115, 800, unit * 0.045);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  y += headingSize * 0.82;
  ctx.fillText(fields.heading, W / 2, y);
  y += headingSize * 0.32;

  const subSize = fitFontSize(ctx, fields.subheading, W - padX * 2, H * 0.025, 700, 12);
  ctx.font = `700 ${subSize}px ${FONT_STACK}`;
  ctx.fillStyle = BRAND;
  y += subSize * 0.9;
  ctx.fillText(fields.subheading, W / 2, y);
  y += H * 0.05;

  const boxSize = unit * 0.56;
  y = drawQrBox(ctx, d.qrCanvas, W / 2, y, boxSize, { border: BRAND });
  y += H * 0.058;

  const nameSize = fitFontSize(ctx, fields.displayName, W - padX * 2, H * 0.036, 800, 20);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  y += nameSize * 0.8;
  ctx.fillText(fields.displayName, W / 2, y);
  y += H * 0.05;

  const footerSize = fitFontSize(ctx, fields.footer, W - padX * 2, H * 0.017, 600, 11);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(fields.footer, W / 2, y);
}

function drawFrame(d: DrawCtx) {
  const { ctx, W, H, fields } = d;
  const unit = Math.min(W, H);
  const inset = unit * 0.045;
  const padX = W * 0.1;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = BRAND;
  ctx.lineWidth = unit * 0.006;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  ctx.lineWidth = unit * 0.0015;
  ctx.strokeRect(inset + unit * 0.014, inset + unit * 0.014, W - (inset + unit * 0.014) * 2, H - (inset + unit * 0.014) * 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = H * 0.1;
  const eyebrowSize = fitFontSize(ctx, fields.eyebrow, W - padX * 2, H * 0.019, 700, 11);
  ctx.font = `700 ${eyebrowSize}px ${FONT_STACK}`;
  ctx.fillStyle = BRAND;
  y += eyebrowSize;
  ctx.fillText(fields.eyebrow, W / 2, y);
  y += H * 0.04;

  const headingSize = fitFontSize(ctx, fields.heading, W - padX * 1.4, H * 0.09, 800, unit * 0.038);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = INK;
  y += headingSize * 0.82;
  ctx.fillText(fields.heading, W / 2, y);
  y += headingSize * 0.3;

  const subSize = fitFontSize(ctx, fields.subheading, W - padX * 2, H * 0.023, 600, 11);
  ctx.font = `600 ${subSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(15,23,42,0.6)";
  y += subSize * 0.9;
  ctx.fillText(fields.subheading, W / 2, y);
  y += H * 0.055;

  const boxSize = unit * 0.52;
  y = drawQrBox(ctx, d.qrCanvas, W / 2, y, boxSize, { shadow: false, border: "rgba(15,23,42,0.12)" });
  y += H * 0.055;

  const nameSize = fitFontSize(ctx, fields.displayName, W - padX * 2, H * 0.033, 800, 18);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = INK;
  y += nameSize * 0.8;
  ctx.fillText(fields.displayName, W / 2, y);
  y += H * 0.045;

  const footerSize = fitFontSize(ctx, fields.footer, W - padX * 2, H * 0.016, 600, 10);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(15,23,42,0.4)";
  ctx.fillText(fields.footer, W / 2, y);
}

function drawSplit(d: DrawCtx) {
  const { ctx, W, H, fields } = d;
  const unit = Math.min(W, H);
  const padX = W * 0.09;
  const splitY = H * 0.52;

  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, splitY);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, splitY, W, H - splitY);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = H * 0.08;
  const eyebrowSize = fitFontSize(ctx, fields.eyebrow, W - padX * 2, H * 0.02, 700, 12);
  ctx.font = `700 ${eyebrowSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  y += eyebrowSize;
  ctx.fillText(fields.eyebrow, W / 2, y);
  y += H * 0.045;

  const headingSize = fitFontSize(ctx, fields.heading, W - padX * 1.3, H * 0.11, 800, unit * 0.045);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  y += headingSize * 0.82;
  ctx.fillText(fields.heading, W / 2, y);
  y += headingSize * 0.32;

  const subSize = fitFontSize(ctx, fields.subheading, W - padX * 2, H * 0.024, 700, 12);
  ctx.font = `700 ${subSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(fields.subheading, W / 2, y);

  // QR box straddles the color boundary.
  const boxSize = unit * 0.52;
  const boxY = splitY - boxSize / 2;
  drawQrBox(ctx, d.qrCanvas, W / 2, boxY, boxSize, { border: BRAND_DARK });

  let by = splitY + boxSize / 2 + H * 0.07;
  const nameSize = fitFontSize(ctx, fields.displayName, W - padX * 2, H * 0.036, 800, 20);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = INK;
  by += nameSize * 0.8;
  ctx.fillText(fields.displayName, W / 2, by);
  by += H * 0.045;

  const footerSize = fitFontSize(ctx, fields.footer, W - padX * 2, H * 0.017, 600, 11);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(15,23,42,0.45)";
  ctx.fillText(fields.footer, W / 2, by);
}

function drawCafe(d: DrawCtx) {
  const { ctx, W, H, fields, illustration } = d;
  const unit = Math.min(W, H);
  const padX = W * 0.08;

  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = H * 0.055;
  y = drawPill(ctx, W / 2, y, fields.eyebrow, { fontSize: H * 0.02, weight: 700, maxWidth: W - padX * 2, bg: "rgba(255,255,255,0.16)", fg: "#ffffff" });
  y += H * 0.035;

  const headingSize = fitFontSize(ctx, fields.heading, W - padX * 1.4, H * 0.088, 800, unit * 0.038);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  y += headingSize * 0.82;
  ctx.fillText(fields.heading, W / 2, y);
  y += headingSize * 0.3;

  y = drawPill(ctx, W / 2, y, fields.subheading, { fontSize: H * 0.022, weight: 700, maxWidth: W - padX * 2, bg: CREAM, fg: BRAND });
  y += H * 0.05;

  // Bottom two-column zone: illustration bottom-left, QR bottom-right,
  // both bottom-aligned; name + footer sit centered in the strip below.
  const footerZoneH = H * 0.12;
  const bottomY = H - footerZoneH;
  const colTop = y;
  const colH = bottomY - colTop;

  const boxSize = Math.min(unit * 0.46, colH * 0.92);
  const boxX = W - padX - boxSize / 2 - W * 0.02;
  const boxY = bottomY - boxSize;
  drawQrBox(ctx, d.qrCanvas, boxX, boxY, boxSize);

  if (illustration) {
    const illoAspect = illustration.width / illustration.height;
    const illoH = Math.min(colH * 1.02, boxSize * 1.5);
    const illoW = illoH * illoAspect;
    const illoX = padX * 0.4;
    const illoY = bottomY - illoH;
    ctx.drawImage(illustration, illoX, illoY, illoW, illoH);
  }

  const nameSize = fitFontSize(ctx, fields.displayName, W - padX * 2, H * 0.032, 800, 18);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fields.displayName, W / 2, bottomY + footerZoneH * 0.45);

  const footerSize = fitFontSize(ctx, fields.footer, W - padX * 2, H * 0.016, 600, 11);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(fields.footer, W / 2, bottomY + footerZoneH * 0.85);
}

const DESIGN_DRAW: Record<PosterDesignKey, (d: DrawCtx) => void> = {
  classic: drawClassic,
  minimal: drawMinimal,
  bold: drawBold,
  cafe: drawCafe,
  frame: drawFrame,
  split: drawSplit,
};

/* ─── Orchestration ─────────────────────────────────────────────────── */

export function slugifyForFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "business";
}

/* Draws the poster onto a given canvas at the chosen size/design — shapes,
   text, and the QR bitmap itself, entirely via the Canvas 2D API. Used both
   for the one-click default download and for the live preview in the
   poster editor, where every text field is user-editable; only the QR
   (encoding the business's real review URL) never changes. */
export async function drawQrPoster(
  canvas: HTMLCanvasElement,
  reviewUrl: string,
  fields: QrPosterFields,
  sizeKey: PosterSizeKey,
  designKey: PosterDesignKey
): Promise<void> {
  const size = getPosterSize(sizeKey);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");
  ctx.clearRect(0, 0, size.width, size.height);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, reviewUrl, {
    width: 800,
    margin: 1,
    color: { dark: INK, light: "#ffffff" },
  });

  let illustration: HTMLImageElement | null = null;
  if (designKey === "cafe") {
    illustration = await loadImage("/lady_in_cafe.webp").catch(() => null);
  }

  DESIGN_DRAW[designKey]({ ctx, W: size.width, H: size.height, fields, qrCanvas, illustration });
}

export async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not generate the poster image");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* One-click default poster (no customization) — draws to an offscreen
   canvas and downloads immediately. */
export async function downloadQrPoster({
  reviewUrl,
  businessName,
  fields,
  sizeKey = "card",
  designKey = "classic",
}: {
  reviewUrl: string;
  businessName: string;
  fields?: QrPosterFields;
  sizeKey?: PosterSizeKey;
  designKey?: PosterDesignKey;
}): Promise<void> {
  const canvas = document.createElement("canvas");
  await drawQrPoster(canvas, reviewUrl, fields ?? qrPosterDefaults(businessName), sizeKey, designKey);
  await downloadCanvasPng(canvas, `${slugifyForFilename(businessName)}-review-qr-poster.png`);
}
