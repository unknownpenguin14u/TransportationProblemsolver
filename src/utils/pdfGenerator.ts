import { jsPDF } from 'jspdf';
import { MethodSolution, ProblemObjective, TransportationProblem } from '../types/transportation';
import { generateTableauImageDataUrl } from './tableauImageGenerator';

export interface GeneratePdfOptions {
  problem: TransportationProblem;
  solutions: {
    nwcr: MethodSolution;
    least_cost: MethodSolution;
    max_profit: MethodSolution;
    vam: MethodSolution;
    stepping_stone: MethodSolution;
  };
  targetSolution: MethodSolution;
  includeAllMethods: boolean;
  includeLoop: boolean;
  objective: ProblemObjective;
}

/**
 * Generates and triggers download of a genuine .pdf document
 * containing the summary and high-resolution graphical pictures of the tableaus.
 */
export async function downloadTransportationPdf(options: GeneratePdfOptions): Promise<void> {
  const {
    problem,
    solutions,
    targetSolution,
    includeAllMethods,
    includeLoop,
    objective,
  } = options;

  const isMax = objective === 'maximize';
  const methodsToRender = includeAllMethods
    ? [
        solutions.stepping_stone,
        solutions.nwcr,
        solutions.least_cost,
        solutions.max_profit,
        solutions.vam,
      ]
    : [targetSolution];

  // Create A4 Landscape PDF for optimal wide-table presentation
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;

  for (let idx = 0; idx < methodsToRender.length; idx++) {
    const sol = methodsToRender[idx];

    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.roundedRect(margin, margin, pageWidth - margin * 2, 54, 6, 6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('OPERATIONS RESEARCH: TRANSPORTATION PROBLEM REPORT', margin + 18, margin + 24);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.text(
      `Objective: ${isMax ? 'Maximize Profit' : 'Minimize Total Cost'}   •   Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}   •   Page ${idx + 1} of ${methodsToRender.length}`,
      margin + 18,
      margin + 42
    );

    // Cost highlight in banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(56, 189, 248); // #38bdf8
    const costStr = `Total: $${sol.totalCost.toLocaleString()}`;
    const costStrWidth = doc.getTextWidth(costStr);
    doc.text(costStr, pageWidth - margin - 18 - costStrWidth, margin + 34);

    // Method Comparison Quick Bar (on first page or top)
    let contentStartY = margin + 66;

    if (idx === 0) {
      doc.setFillColor(241, 245, 249); // #f1f5f9
      doc.setDrawColor(203, 213, 225); // #cbd5e1
      doc.roundedRect(margin, contentStartY, pageWidth - margin * 2, 32, 4, 4, 'FD');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      const summaryText = `All Methods Summary:  Optimal Stepping Stone: $${solutions.stepping_stone.totalCost.toLocaleString()}  |  NWCR: $${solutions.nwcr.totalCost.toLocaleString()}  |  Least Cost: $${solutions.least_cost.totalCost.toLocaleString()}  |  VAM: $${solutions.vam.totalCost.toLocaleString()}  |  Total Supply = Total Demand = ${problem.supply.reduce((a, b) => a + b, 0)}`;
      doc.text(summaryText, margin + 12, contentStartY + 20);

      contentStartY += 42;
    } else {
      contentStartY += 8;
    }

    // Generate high-resolution PNG image of the tableau with polygon loop vectors
    const dataUrl = generateTableauImageDataUrl(sol, {
      showLoop: includeLoop && sol.method === 'stepping_stone',
      objective,
      scale: 2,
    });

    if (dataUrl) {
      // Load image to determine native aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });

      const nativeWidth = img.naturalWidth || 800;
      const nativeHeight = img.naturalHeight || 500;

      const maxRenderWidth = pageWidth - margin * 2;
      const maxRenderHeight = pageHeight - contentStartY - margin - 20;

      let renderWidth = maxRenderWidth;
      let renderHeight = (nativeHeight / nativeWidth) * renderWidth;

      if (renderHeight > maxRenderHeight) {
        renderHeight = maxRenderHeight;
        renderWidth = (nativeWidth / nativeHeight) * renderHeight;
      }

      const imageX = margin + (maxRenderWidth - renderWidth) / 2;
      const imageY = contentStartY + (maxRenderHeight - renderHeight) / 2;

      doc.addImage(dataUrl, 'PNG', imageX, imageY, renderWidth, renderHeight, undefined, 'FAST');
    }

    // Page footer
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Generated with Transportation Problem Solver & Educational Dashboard. High-resolution vector tableau.',
      margin,
      pageHeight - 16
    );
  }

  // Trigger genuine file download
  const filename = `Transportation_Report_${isMax ? 'MaxProfit' : 'MinCost'}_${Date.now()}.pdf`;
  doc.save(filename);
}
