import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* Client-side PDF generation - no headless-browser/Puppeteer backend needed.
   Everything drawn here comes from the same JSON the dashboard already
   renders (see /business/dashboard/report), fetched once per range. */

export interface ReportPayload {
  range: "7d" | "30d" | "90d";
  business: { name: string };
  tier: "basic" | "full";
  summary: {
    reviewsStarted: { value: number; prev: number | null };
    avgRating: { value: number | null; ratingCount: number };
    googleClicks: { value: number; prev: number | null };
    completionRate: { value: number };
    draftEditRate: { value: number | null };
  };
  distribution: Record<string, number>;
  funnel: { key: string; label: string; value: number }[];
  referrer: { qr: number; nfc: number; direct: number };
  menu?: { name: string; mentions: number; avgRating: number | null }[];
  aspects?: { aspect: string; total: number; lowRated: number; highRated: number }[];
}

const RANGE_LABEL: Record<ReportPayload["range"], string> = { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };

/* Rule-based, one-paragraph plain-language summary - same "rules, not ML"
   approach as the growth-suggestions engine, not a generated sentence. */
function summarize(r: ReportPayload): string {
  const { reviewsStarted, avgRating, completionRate } = r.summary;
  if (!reviewsStarted.value) {
    return `No ratings came in during this period. Nothing else on this page will mean much until scans start converting to ratings.`;
  }
  const parts = [
    `Over this period, ${r.business.name} collected ${reviewsStarted.value} review${reviewsStarted.value === 1 ? "" : "s"}` +
      (avgRating.ratingCount >= 5 ? ` averaging ${avgRating.value?.toFixed(1)}★` : "") +
      `, with a ${completionRate.value}% scan-to-Google completion rate.`,
  ];
  if (r.tier === "full" && r.menu?.length) {
    const sorted = [...r.menu].filter((m) => m.mentions >= 5 && m.avgRating != null).sort((a, b) => (a.avgRating! - b.avgRating!));
    if (sorted.length) {
      const worst = sorted[0];
      const best = sorted[sorted.length - 1];
      if (worst.name !== best.name) {
        parts.push(`${best.name} is the strongest performer at ${best.avgRating?.toFixed(1)}★; ${worst.name} is worth a look at ${worst.avgRating?.toFixed(1)}★.`);
      }
    }
  }
  if (r.tier === "full" && r.aspects?.length) {
    const top = [...r.aspects].sort((a, b) => b.lowRated - a.lowRated)[0];
    if (top && top.lowRated >= 3) parts.push(`"${top.aspect}" is the most common theme in lower ratings.`);
  }
  return parts.join(" ");
}

function funnelRows(funnel: ReportPayload["funnel"]): string[][] {
  return funnel.map((s, i) => {
    const prevVal = i > 0 ? funnel[i - 1].value : null;
    const pct = prevVal ? `${Math.round((s.value / prevVal) * 100)}%` : "—";
    return [s.label, String(s.value), i === 0 ? "—" : pct];
  });
}

export function generateReportPdf(reports: ReportPayload[], businessName: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${businessName} - Performance Report`, marginX, y);
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, marginX, y);
  doc.setTextColor(20);

  reports.forEach((r, idx) => {
    if (idx > 0) { doc.addPage(); y = 50; }
    else y += 30;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(RANGE_LABEL[r.range], marginX, y);
    y += 22;

    // Stat lines - split in two so neither wraps or overflows the margin.
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const avgText = r.summary.avgRating.ratingCount >= 5 ? `${r.summary.avgRating.value?.toFixed(1)}★ avg` : `${r.summary.avgRating.ratingCount} ratings so far`;
    doc.text(
      `${r.summary.reviewsStarted.value} reviews  ·  ${avgText}  ·  ${r.summary.googleClicks.value} Google clicks  ·  ${r.summary.completionRate.value}% completion`,
      marginX,
      y
    );
    y += 16;

    const line2: string[] = [];
    if (r.summary.draftEditRate.value !== null) line2.push(`${r.summary.draftEditRate.value}% edited their draft before copying`);
    const { qr, nfc, direct } = r.referrer;
    if (nfc > 0 || direct > 0) {
      const sourceParts = [`${qr} via QR`, ...(nfc > 0 ? [`${nfc} via NFC`] : []), ...(direct > 0 ? [`${direct} direct`] : [])];
      line2.push(sourceParts.join(", "));
    }
    if (line2.length) {
      doc.setTextColor(120);
      doc.text(line2.join("  ·  "), marginX, y);
      doc.setTextColor(20);
      y += 16;
    }
    y += 4;

    // Rating distribution table
    autoTable(doc, {
      startY: y,
      margin: { left: marginX },
      head: [["Stars", "Count"]],
      body: [5, 4, 3, 2, 1].map((s) => [`${s}★`, String(r.distribution[s] || 0)]),
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 108, 240] },
      tableWidth: 200,
    });
    // @ts-expect-error - jspdf-autotable attaches this at runtime; not in its type defs.
    y = (doc.lastAutoTable?.finalY ?? y) + 20;

    // Funnel table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Scan-to-review funnel", marginX, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      margin: { left: marginX },
      head: [["Stage", "Count", "Step conversion"]],
      body: funnelRows(r.funnel),
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 108, 240] },
      tableWidth: 300,
    });
    // @ts-expect-error - see above.
    y = (doc.lastAutoTable?.finalY ?? y) + 20;

    if (r.tier === "full" && r.menu?.length) {
      const sorted = [...r.menu].sort((a, b) => b.mentions - a.mentions);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Top menu items", marginX, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        margin: { left: marginX },
        head: [["Dish", "Mentions", "Avg rating"]],
        body: sorted.slice(0, 5).map((m) => [m.name, String(m.mentions), m.avgRating != null ? m.avgRating.toFixed(1) : "—"]),
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 108, 240] },
        tableWidth: 300,
      });
      // @ts-expect-error - see above.
      y = (doc.lastAutoTable?.finalY ?? y) + 16;

      if (sorted.length > 5) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Needs attention", marginX, y);
        y += 8;
        autoTable(doc, {
          startY: y,
          margin: { left: marginX },
          head: [["Dish", "Mentions", "Avg rating"]],
          body: [...sorted].reverse().slice(0, 5).map((m) => [m.name, String(m.mentions), m.avgRating != null ? m.avgRating.toFixed(1) : "—"]),
          theme: "grid",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 108, 240] },
          tableWidth: 300,
        });
        // @ts-expect-error - see above.
        y = (doc.lastAutoTable?.finalY ?? y) + 20;
      }
    }

    if (r.tier === "full" && r.aspects?.length) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("What comes up in reviews", marginX, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        margin: { left: marginX },
        head: [["Aspect", "Low-rated (≤3★)", "High-rated (4-5★)"]],
        body: r.aspects.map((a) => [a.aspect, String(a.lowRated), String(a.highRated)]),
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 108, 240] },
        tableWidth: 300,
      });
      // @ts-expect-error - see above.
      y = (doc.lastAutoTable?.finalY ?? y) + 20;
    }

    // Plain-language summary
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", marginX, y);
    y += 14;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(summarize(r), 500);
    doc.text(lines, marginX, y);
  });

  const filename = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
