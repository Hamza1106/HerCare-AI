import { jsPDF } from 'jspdf';

const COLORS = {
  purple:     [139, 92, 246],
  pink:       [245, 183, 210],
  teal:       [94, 200, 196],
  dark:       [18, 18, 30],
  cardBg:     [28, 28, 45],
  textPrimary:[240, 240, 255],
  textMuted:  [140, 140, 170],
  high:       [232, 93, 117],
  medium:     [246, 160, 77],
  low:        [94, 200, 196],
  white:      [255, 255, 255],
  border:     [50, 50, 80],
};

function riskColor(level) {
  if (!level) return COLORS.textMuted;
  const l = level.toLowerCase();
  if (l === 'high')   return COLORS.high;
  if (l === 'medium') return COLORS.medium;
  return COLORS.low;
}

function setFill(doc, rgb)   { doc.setFillColor(...rgb); }
function setDraw(doc, rgb)   { doc.setDrawColor(...rgb); }
function setTextColor(doc, rgb) { doc.setTextColor(...rgb); }

/**
 * Wrap text to fit within maxWidth, return array of lines.
 */
function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ''), maxWidth);
}

/**
 * Draw a filled rounded rectangle (jsPDF native roundedRect).
 */
function filledRoundedRect(doc, x, y, w, h, r, fillRgb, strokeRgb) {
  setFill(doc, fillRgb);
  if (strokeRgb) {
    setDraw(doc, strokeRgb);
    doc.roundedRect(x, y, w, h, r, r, 'FD');
  } else {
    setDraw(doc, fillRgb);
    doc.roundedRect(x, y, w, h, r, r, 'F');
  }
}

/**
 * Main export function. Call with the results object from /api/assess-health
 * and optional patient name.
 */
export function generateAssessmentPDF(results, patientName = 'Patient') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;   // page width mm
  const margin = 14;
  const contentW = W - margin * 2;

  // ── PAGE 1: HEADER + SUMMARY ──────────────────────────────────────────────

  // Background
  setFill(doc, COLORS.dark);
  doc.rect(0, 0, W, 297, 'F');

  // Header gradient strip
  setFill(doc, COLORS.purple);
  doc.rect(0, 0, W, 38, 'F');

  // Pink accent bar
  setFill(doc, COLORS.pink);
  doc.rect(0, 36, W, 3, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setTextColor(doc, COLORS.white);
  doc.text('HERCARE AI', margin, 17);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextColor(doc, [220, 200, 255]);
  doc.text("Women's Health Assessment Report", margin, 24);

  // Date top-right
  const dateStr = new Date().toLocaleDateString('en-PK', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  doc.setFontSize(8);
  setTextColor(doc, [220, 200, 255]);
  doc.text(dateStr, W - margin, 17, { align: 'right' });
  doc.text('AKU-CIME SIMPACT 2026', W - margin, 24, { align: 'right' });

  // Patient name box
  filledRoundedRect(doc, margin, 46, contentW, 18, 3, COLORS.cardBg, COLORS.border);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextColor(doc, COLORS.textMuted);
  doc.text('PATIENT', margin + 5, 53);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColor(doc, COLORS.textPrimary);
  doc.text(patientName, margin + 5, 60);

  // BMI box
  const bmi = results.bmi ?? '--';
  const bmiLabel = bmi > 25 ? 'Overweight' : bmi < 18.5 ? 'Underweight' : 'Normal';
  const bmiColor = bmi > 25 || bmi < 18.5 ? COLORS.medium : COLORS.low;
  filledRoundedRect(doc, W - margin - 45, 46, 45, 18, 3, COLORS.cardBg, COLORS.border);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTextColor(doc, COLORS.textMuted);
  doc.text('BMI', W - margin - 40, 53);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setTextColor(doc, bmiColor);
  doc.text(String(bmi), W - margin - 40, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTextColor(doc, bmiColor);
  doc.text(bmiLabel, W - margin - 25, 60);

  // Section heading
  let y = 74;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setTextColor(doc, COLORS.pink);
  doc.text('CONDITION RISK SUMMARY', margin, y);
  setFill(doc, COLORS.pink);
  doc.rect(margin, y + 2, 40, 0.5, 'F');

  y += 8;

  // Summary cards — 2 per row
  const allResults = Object.entries(results.results || {});
  const cardW = (contentW - 6) / 2;
  const cardH = 28;

  allResults.forEach(([, r], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = margin + col * (cardW + 6);
    const cy = y + row * (cardH + 4);

    filledRoundedRect(doc, cx, cy, cardW, cardH, 3, COLORS.cardBg, COLORS.border);

    // Risk badge
    const rc = riskColor(r.risk_level);
    filledRoundedRect(doc, cx + cardW - 30, cy + 4, 26, 7, 2, rc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setTextColor(doc, COLORS.dark);
    doc.text(`${r.risk_level?.toUpperCase()} ${r.risk_score}%`, cx + cardW - 17, cy + 9, { align: 'center' });

    // Condition name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setTextColor(doc, COLORS.textPrimary);
    doc.text(r.name || '', cx + 5, cy + 10);

    // Risk bar background
    const barX = cx + 5;
    const barY = cy + 16;
    const barW = cardW - 35;
    setFill(doc, COLORS.border);
    doc.roundedRect(barX, barY, barW, 3, 1.5, 1.5, 'F');
    // Risk bar fill
    setFill(doc, rc);
    const fillW = Math.max(2, (r.risk_score / 100) * barW);
    doc.roundedRect(barX, barY, fillW, 3, 1.5, 1.5, 'F');

    // Urgency
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setTextColor(doc, COLORS.textMuted);
    const urgText = wrapText(doc, r.urgency_desc || r.urgency || '', cardW - 10)[0] || '';
    doc.text(urgText, cx + 5, cy + 24);
  });

  // Move y past cards
  const rows = Math.ceil(allResults.length / 2);
  y += rows * (cardH + 4) + 6;

  // Disclaimer box
  if (y < 260) {
    filledRoundedRect(doc, margin, y, contentW, 16, 3, [30, 20, 50], COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTextColor(doc, COLORS.pink);
    doc.text('IMPORTANT NOTICE', margin + 5, y + 6);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, [200, 190, 230]);
    const dis = wrapText(doc, results.disclaimer || 'This report is for awareness only. Please consult a qualified doctor.', contentW - 10);
    doc.text(dis[0] || '', margin + 5, y + 12);
  }

  // ── PAGE 2: DETAILED CONDITION BREAKDOWN ──────────────────────────────────
  doc.addPage();

  setFill(doc, COLORS.dark);
  doc.rect(0, 0, W, 297, 'F');

  // Page 2 header
  setFill(doc, COLORS.cardBg);
  doc.rect(0, 0, W, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextColor(doc, COLORS.purple);
  doc.text('HERCARE AI', margin, 10);
  doc.setFont('helvetica', 'normal');
  setTextColor(doc, COLORS.textMuted);
  doc.text('Detailed Condition Report', margin + 28, 10);
  doc.text(`Page 2 of 2`, W - margin, 10, { align: 'right' });

  setFill(doc, COLORS.purple);
  doc.rect(0, 19, W, 0.5, 'F');

  y = 28;

  allResults.forEach(([, r]) => {
    const rc = riskColor(r.risk_level);

    // Estimate card height
    const explanationLines = wrapText(doc, r.explanation || '', contentW - 10);
    const tips = r.lifestyle_tips || [];
    const tipsLineCount = tips.reduce((acc, t) => acc + wrapText(doc, t, contentW - 20).length, 0);
    const matchedCount = (r.matched_symptoms || []).length;
    const estH = 12 + explanationLines.length * 4.5 + 6 + matchedCount * 5 + 6 + tipsLineCount * 4.5 + 8;

    // New page if needed
    if (y + estH > 285) {
      doc.addPage();
      setFill(doc, COLORS.dark);
      doc.rect(0, 0, W, 297, 'F');
      y = 14;
    }

    // Card background
    filledRoundedRect(doc, margin, y, contentW, estH, 4, COLORS.cardBg, COLORS.border);

    // Left accent bar
    setFill(doc, rc);
    doc.roundedRect(margin, y, 2, estH, 1, 1, 'F');

    // Condition name + badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setTextColor(doc, COLORS.textPrimary);
    doc.text(r.name || '', margin + 7, y + 9);

    // Risk badge
    filledRoundedRect(doc, W - margin - 36, y + 3, 32, 7, 2, rc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    setTextColor(doc, COLORS.dark);
    doc.text(`${r.risk_level?.toUpperCase()} RISK  ${r.risk_score}%`, W - margin - 20, y + 8, { align: 'center' });

    let iy = y + 14;

    // Explanation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTextColor(doc, COLORS.textMuted);
    explanationLines.forEach(line => {
      doc.text(line, margin + 7, iy);
      iy += 4.5;
    });

    iy += 3;

    // Matched symptoms
    if (matchedCount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setTextColor(doc, COLORS.pink);
      doc.text('MATCHED SYMPTOMS', margin + 7, iy);
      iy += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setTextColor(doc, COLORS.textMuted);
      r.matched_symptoms.forEach(sym => {
        doc.text(`• ${sym}`, margin + 10, iy);
        iy += 4.5;
      });
      iy += 2;
    }

    // Lifestyle tips
    if (tips.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setTextColor(doc, COLORS.teal);
      doc.text('LIFESTYLE TIPS', margin + 7, iy);
      iy += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setTextColor(doc, COLORS.textMuted);
      tips.forEach(tip => {
        const tipLines = wrapText(doc, tip, contentW - 20);
        tipLines.forEach((line, li) => {
          doc.text(li === 0 ? `• ${line}` : `  ${line}`, margin + 10, iy);
          iy += 4.5;
        });
      });
    }

    y += estH + 6;
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setFill(doc, COLORS.cardBg);
    doc.rect(0, 289, W, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setTextColor(doc, COLORS.textMuted);
    doc.text('HerCare AI — For health awareness only. Not a medical diagnosis. Consult a qualified doctor.', margin, 294);
    doc.text(`${p} / ${pageCount}`, W - margin, 294, { align: 'right' });
  }

  // Save
  const fileName = `HerCare_Report_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
