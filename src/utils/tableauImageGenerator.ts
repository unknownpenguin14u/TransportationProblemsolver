import { MethodSolution, ProblemObjective, LoopStep } from '../types/transportation';

export interface TableauImageOptions {
  showLoop?: boolean;
  objective?: ProblemObjective;
  scale?: number;
  customLoop?: LoopStep[] | null;
}

/**
 * Renders a Transportation Method Solution onto a high-resolution HTML5 Canvas
 * and returns a standard PNG base64 Data URL.
 * 
 * Browsers never strip <img> tags during printing, so embedding this rendered
 * image guarantees that full tableaus, allocation badges, and vector loop pictures
 * show up on paper and PDF even if "Background graphics" is unchecked.
 */
export function generateTableauImageDataUrl(
  sol: MethodSolution,
  options: TableauImageOptions = {}
): string {
  const { showLoop = true, objective = 'minimize', scale = 2 } = options;
  const isMax = objective === 'maximize';

  const canvas = document.createElement('canvas');
  const originColWidth = 140;
  const cellWidth = 105;
  const cellHeight = 72;
  const numCols = sol.destinations.length;
  const numRows = sol.sources.length;

  const tableWidth = originColWidth + numCols * cellWidth + cellWidth;
  const headerBannerHeight = 84;
  const colHeaderHeight = 44;
  const demandRowHeight = 44;
  const legendHeight = 44;
  const padding = 28;

  const totalWidth = padding * 2 + tableWidth;
  const totalHeight =
    padding * 2 +
    headerBannerHeight +
    colHeaderHeight +
    numRows * cellHeight +
    demandRowHeight +
    legendHeight;

  canvas.width = totalWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Subtle border around entire image card
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padding / 2, padding / 2, totalWidth - padding, totalHeight - padding);

  let currentY = padding;

  // Header Banner: Gradient Dark Slate to Indigo
  const headerRadius = 10;
  const bannerWidth = tableWidth;
  const bannerX = padding;

  // Draw rounded rect header
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(bannerX, currentY, bannerWidth, headerBannerHeight - 12, headerRadius);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Banner Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('OPERATIONS RESEARCH • TRANSPORTATION TABLEAU', bannerX + 16, currentY + 26);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(sol.methodName, bannerX + 16, currentY + 52);

  // Objective / Cost Pill in header
  const costText = `$${sol.totalCost.toLocaleString()}`;
  const costSubtext = isMax ? 'Total Profit' : 'Total Cost';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const costWidth = ctx.measureText(costText).width;
  const pillWidth = Math.max(140, costWidth + 30);
  const pillHeight = 48;
  const pillX = bannerX + bannerWidth - pillWidth - 14;
  const pillY = currentY + 12;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 8);
  ctx.fillStyle = '#1e1b4b';
  ctx.fill();
  ctx.strokeStyle = '#4338ca';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(costSubtext.toUpperCase(), pillX + pillWidth / 2, pillY + 16);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(costText, pillX + pillWidth / 2, pillY + 38);
  ctx.textAlign = 'left';
  ctx.restore();

  currentY += headerBannerHeight;

  // Grid coordinates
  const tableX = padding;
  const tableY = currentY;

  // Draw Header Row
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tableX, tableY, tableWidth, colHeaderHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, tableY, tableWidth, colHeaderHeight);

  // Origin \ Destination column header text
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Origin \\ Dest', tableX + 12, tableY + 26);

  // Destination Columns
  sol.destinations.forEach((dest, c) => {
    const colX = tableX + originColWidth + c * cellWidth;
    ctx.strokeRect(colX, tableY, cellWidth, colHeaderHeight);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dest, colX + cellWidth / 2, tableY + 26);
    if (sol.dummyDestIndex === c) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'italic 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('(Dummy)', colX + cellWidth / 2, tableY + 38);
    }
  });

  // Supply Column Header
  const supplyHeaderX = tableX + originColWidth + numCols * cellWidth;
  ctx.fillStyle = '#e0e7ff';
  ctx.fillRect(supplyHeaderX, tableY, cellWidth, colHeaderHeight);
  ctx.strokeRect(supplyHeaderX, tableY, cellWidth, colHeaderHeight);
  ctx.fillStyle = '#312e81';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Supply', supplyHeaderX + cellWidth / 2, tableY + 26);

  // Table Body Rows
  let rowY = tableY + colHeaderHeight;

  for (let r = 0; r < numRows; r++) {
    // Origin Header
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(tableX, rowY, originColWidth, cellHeight);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(tableX, rowY, originColWidth, cellHeight);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(sol.sources[r], tableX + 12, rowY + cellHeight / 2 + 4);

    if (sol.dummySourceIndex === r) {
      ctx.fillStyle = '#b45309';
      ctx.font = 'italic 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('(Dummy)', tableX + 12, rowY + cellHeight / 2 + 18);
    }

    // Cells
    for (let c = 0; c < numCols; c++) {
      const cellX = tableX + originColWidth + c * cellWidth;
      const alloc = sol.allocations[r][c];
      const isEps = sol.isEpsilon[r][c];
      const cost = sol.costs[r][c];
      const hasAlloc = alloc !== null;

      // Cell background
      ctx.fillStyle = hasAlloc ? '#eff6ff' : '#ffffff';
      ctx.fillRect(cellX, rowY, cellWidth, cellHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(cellX, rowY, cellWidth, cellHeight);

      // Cost Tag in Upper Right
      const costBoxWidth = 34;
      const costBoxHeight = 18;
      const costBoxX = cellX + cellWidth - costBoxWidth - 4;
      const costBoxY = rowY + 4;

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(costBoxX, costBoxY, costBoxWidth, costBoxHeight, 3);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${cost}`, costBoxX + costBoxWidth / 2, costBoxY + 13);

      // Allocation Pill in Center
      if (isEps) {
        const allocPillWidth = 52;
        const allocPillHeight = 24;
        const pillX = cellX + (cellWidth - allocPillWidth) / 2;
        const pillY = rowY + (cellHeight - allocPillHeight) / 2 + 6;

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, allocPillWidth, allocPillHeight, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('ε (0)', pillX + allocPillWidth / 2, pillY + 16);
      } else if (hasAlloc) {
        const allocStr = String(alloc);
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const strWidth = ctx.measureText(allocStr).width;
        const allocPillWidth = Math.max(38, strWidth + 20);
        const allocPillHeight = 26;
        const pillX = cellX + (cellWidth - allocPillWidth) / 2;
        const pillY = rowY + (cellHeight - allocPillHeight) / 2 + 6;

        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, allocPillWidth, allocPillHeight, 13);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(allocStr, pillX + allocPillWidth / 2, pillY + 17);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('—', cellX + cellWidth / 2, rowY + cellHeight / 2 + 10);
      }
    }

    // Supply Cell
    const supplyCellX = tableX + originColWidth + numCols * cellWidth;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(supplyCellX, rowY, cellWidth, cellHeight);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(supplyCellX, rowY, cellWidth, cellHeight);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(sol.supply[r]), supplyCellX + cellWidth / 2, rowY + cellHeight / 2 + 5);

    rowY += cellHeight;
  }

  // Demand Row
  ctx.fillStyle = '#e0e7ff';
  ctx.fillRect(tableX, rowY, originColWidth, demandRowHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(tableX, rowY, originColWidth, demandRowHeight);

  ctx.fillStyle = '#312e81';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Demand', tableX + 12, rowY + 26);

  sol.demand.forEach((dem, c) => {
    const demCellX = tableX + originColWidth + c * cellWidth;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(demCellX, rowY, cellWidth, demandRowHeight);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(demCellX, rowY, cellWidth, demandRowHeight);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(dem), demCellX + cellWidth / 2, rowY + 26);
  });

  // Total Balance Cell
  const totalBalanceX = tableX + originColWidth + numCols * cellWidth;
  ctx.fillStyle = '#c7d2fe';
  ctx.fillRect(totalBalanceX, rowY, cellWidth, demandRowHeight);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(totalBalanceX, rowY, cellWidth, demandRowHeight);

  const totalSupply = sol.supply.reduce((a, b) => a + b, 0);
  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(totalSupply), totalBalanceX + cellWidth / 2, rowY + 27);

  // Stepping Stone Loop Vector Drawing (if applicable)
  const activeLoop =
    options.customLoop !== undefined
      ? options.customLoop
      : sol.steppingStoneIterations?.find((it) => it.loop && it.loop.length >= 4)?.loop || null;
  if (showLoop && activeLoop && activeLoop.length >= 4) {
    const points = activeLoop.map((step) => {
      const cx = tableX + originColWidth + step.col * cellWidth + cellWidth / 2;
      const cy = tableY + colHeaderHeight + step.row * cellHeight + cellHeight / 2 + 5;
      return { ...step, cx, cy };
    });

    ctx.save();
    // Fill closed polygon
    ctx.beginPath();
    ctx.moveTo(points[0].cx, points[0].cy);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].cx, points[i].cy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fill();

    // Outline path with dashed stroke
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vertex badges (+ and - signs)
    points.forEach((p, i) => {
      const isPlus = p.sign === '+';
      const badgeColor = isPlus ? '#059669' : '#e11d48';

      // Badge circle
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = badgeColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sign text (+ or -)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.sign, p.cx, p.cy + 5);

      // Mini sequence number tag (#1, #2...)
      const tagX = p.cx + 12;
      const tagY = p.cy - 12;
      ctx.beginPath();
      ctx.arc(tagX, tagY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(String(i + 1), tagX, tagY + 3);
    });

    ctx.restore();
  }

  // Footer Legend
  const legendY = rowY + demandRowHeight + 14;
  ctx.fillStyle = '#64748b';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(
    'Key: [ $c_ij ] = Unit Cost in upper box  •  [ Pill ] = Allocated Units (x_ij)  •  [ ε ] = Degeneracy Resolver',
    tableX,
    legendY + 12
  );

  return canvas.toDataURL('image/png');
}
