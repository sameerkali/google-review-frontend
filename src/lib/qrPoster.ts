import QRCode from "qrcode";

const BRAND = "#3b6cf0";
const CREAM = "#f3efe4";
const INK = "#0f172a";
const FONT_STACK = "'Helvetica Neue', Arial, sans-serif";
export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1350;

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

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, weight: number, minSize = 22): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

export function slugifyForFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "business";
}

/* Draws the "scan to review" poster onto a given canvas (portrait,
   1080x1350) — shapes, text, and the QR bitmap itself, entirely via the
   Canvas 2D API. Used both for the one-click default download and for the
   live preview in the poster editor, where every text field is
   user-editable; only the QR (encoding the business's real review URL)
   never changes. */
export async function drawQrPoster(
  canvas: HTMLCanvasElement,
  reviewUrl: string,
  fields: QrPosterFields
): Promise<void> {
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  const { eyebrow, heading, subheading, displayName, footer } = fields;

  ctx.clearRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Eyebrow pill
  const eyebrowSize = fitFontSize(ctx, eyebrow, POSTER_WIDTH - 160, 26, 700);
  ctx.font = `700 ${eyebrowSize}px ${FONT_STACK}`;
  const eyebrowW = ctx.measureText(eyebrow).width;
  const eyebrowPillW = eyebrowW + 56;
  const eyebrowPillH = 56;
  const eyebrowPillY = 70;
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRectPath(ctx, POSTER_WIDTH / 2 - eyebrowPillW / 2, eyebrowPillY, eyebrowPillW, eyebrowPillH, eyebrowPillH / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(eyebrow, POSTER_WIDTH / 2, eyebrowPillY + eyebrowPillH / 2 + 9);

  // Heading
  const headingSize = fitFontSize(ctx, heading, POSTER_WIDTH - 120, 128, 800, 48);
  ctx.font = `800 ${headingSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(heading, POSTER_WIDTH / 2, 330);

  // Subheading pill
  const subSize = fitFontSize(ctx, subheading, POSTER_WIDTH - 160, 30, 700);
  ctx.font = `700 ${subSize}px ${FONT_STACK}`;
  const subW = ctx.measureText(subheading).width;
  const subPillW = subW + 56;
  const subPillH = 64;
  const subPillY = 380;
  ctx.fillStyle = CREAM;
  roundRectPath(ctx, POSTER_WIDTH / 2 - subPillW / 2, subPillY, subPillW, subPillH, 16);
  ctx.fill();
  ctx.fillStyle = BRAND;
  ctx.fillText(subheading, POSTER_WIDTH / 2, subPillY + subPillH / 2 + 11);

  // QR box — always the real review URL, never editable.
  const boxSize = 700;
  const boxX = POSTER_WIDTH / 2 - boxSize / 2;
  const boxY = 490;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#ffffff";
  roundRectPath(ctx, boxX, boxY, boxSize, boxSize, 40);
  ctx.fill();
  ctx.restore();

  const qrSize = 600;
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, reviewUrl, {
    width: qrSize,
    margin: 1,
    color: { dark: INK, light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, boxX + (boxSize - qrSize) / 2, boxY + (boxSize - qrSize) / 2, qrSize, qrSize);

  // Display name
  const boxBottom = boxY + boxSize;
  const nameY = boxBottom + 70;
  const nameSize = fitFontSize(ctx, displayName, POSTER_WIDTH - 160, 56, 800);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(displayName, POSTER_WIDTH / 2, nameY);

  // Footer
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(POSTER_WIDTH / 2 - 60, nameY + 35);
  ctx.lineTo(POSTER_WIDTH / 2 + 60, nameY + 35);
  ctx.stroke();

  const footerSize = fitFontSize(ctx, footer, POSTER_WIDTH - 160, 24, 600);
  ctx.font = `600 ${footerSize}px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(footer, POSTER_WIDTH / 2, nameY + 75);
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
}: {
  reviewUrl: string;
  businessName: string;
  fields?: QrPosterFields;
}): Promise<void> {
  const canvas = document.createElement("canvas");
  await drawQrPoster(canvas, reviewUrl, fields ?? qrPosterDefaults(businessName));
  await downloadCanvasPng(canvas, `${slugifyForFilename(businessName)}-review-qr-poster.png`);
}
