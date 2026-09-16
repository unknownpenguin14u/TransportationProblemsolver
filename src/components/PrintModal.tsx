import { useState, useMemo } from 'react';
import {
  TransportationProblem,
  MethodSolution,
  ProblemObjective,
} from '../types/transportation';
import {
  Printer,
  Copy,
  Check,
  Download,
  X,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  FileDown,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { generateTableauImageDataUrl } from '../utils/tableauImageGenerator';
import { downloadTransportationPdf } from '../utils/pdfGenerator';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: TransportationProblem;
  solutions: {
    nwcr: MethodSolution;
    least_cost: MethodSolution;
    max_profit: MethodSolution;
    vam: MethodSolution;
    stepping_stone: MethodSolution;
  };
  activeTab: string;
  objective: ProblemObjective;
}

export default function PrintModal({
  isOpen,
  onClose,
  problem,
  solutions,
  activeTab,
  objective,
}: PrintModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [includeAllMethods, setIncludeAllMethods] = useState(false);
  const [includeVisualPolygon, setIncludeVisualPolygon] = useState(true);
  const [previewTab, setPreviewTab] = useState<'image' | 'text'>('image');
  const [selectedMethodForImage, setSelectedMethodForImage] = useState<string>(activeTab);

  const isMax = objective === 'maximize';

  const methodMap: Record<string, MethodSolution> = {
    nwcr: solutions.nwcr,
    least_cost: solutions.least_cost,
    max_profit: solutions.max_profit,
    vam: solutions.vam,
    stepping_stone: solutions.stepping_stone,
  };

  const currentPreviewSolution = methodMap[selectedMethodForImage] || solutions.stepping_stone;

  // Generate crisp high-definition PNG picture for preview
  const currentImagePreviewUrl = useMemo(() => {
    if (!isOpen) return '';
    try {
      return generateTableauImageDataUrl(currentPreviewSolution, {
        showLoop: includeVisualPolygon && currentPreviewSolution.method === 'stepping_stone',
        objective,
        scale: 2,
      });
    } catch (e) {
      console.error('Failed to generate tableau image:', e);
      return '';
    }
  }, [isOpen, currentPreviewSolution, includeVisualPolygon, objective]);

  if (!isOpen) return null;

  const targetSolution = methodMap[activeTab] || solutions.stepping_stone;

  // Generate plain text report
  const generateTextReport = () => {
    let report = `========================================================================\n`;
    report += `OPERATIONS RESEARCH: TRANSPORTATION PROBLEM REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Objective: ${isMax ? 'MAXIMIZE PROFIT / VALUE' : 'MINIMIZE TOTAL TRANSPORTATION COST'}\n`;
    report += `========================================================================\n\n`;

    report += `1. PROBLEM SPECIFICATIONS\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `Sources (${problem.sources.length}): ${problem.sources.join(', ')}\n`;
    report += `Supplies: ${problem.supply.join(', ')} (Total Supply = ${problem.supply.reduce((a, b) => a + b, 0)})\n`;
    report += `Destinations (${problem.destinations.length}): ${problem.destinations.join(', ')}\n`;
    report += `Demands: ${problem.demand.join(', ')} (Total Demand = ${problem.demand.reduce((a, b) => a + b, 0)})\n\n`;

    report += `Cost Matrix [c_ij]:\n`;
    const colWidth = 14;
    report += `Origin \\ Dest`.padEnd(colWidth);
    problem.destinations.forEach((d) => {
      report += d.padEnd(colWidth);
    });
    report += `Supply\n`;

    problem.sources.forEach((s, r) => {
      report += s.padEnd(colWidth);
      problem.costs[r].forEach((c) => {
        report += `$${c}`.padEnd(colWidth);
      });
      report += `${problem.supply[r]}\n`;
    });
    report += `Demand`.padEnd(colWidth);
    problem.demand.forEach((d) => {
      report += `${d}`.padEnd(colWidth);
    });
    report += `\n\n`;

    report += `2. METHOD RESULTS SUMMARY\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `• Northwest Corner Rule (NWCR):     $${solutions.nwcr.totalCost.toLocaleString()}\n`;
    report += `• Least Cost / Matrix Minimum:      $${solutions.least_cost.totalCost.toLocaleString()}\n`;
    report += `• Maximum Profit Method:            $${solutions.max_profit.totalCost.toLocaleString()}\n`;
    report += `• Vogel's Approximation (VAM):      $${solutions.vam.totalCost.toLocaleString()}\n`;
    report += `• Stepping Stone (Optimal):         $${solutions.stepping_stone.totalCost.toLocaleString()} (${
      solutions.stepping_stone.steppingStoneIterations?.length || 1
    } iterations)\n\n`;

    const methodsToPrint = includeAllMethods
      ? [
          solutions.nwcr,
          solutions.least_cost,
          solutions.max_profit,
          solutions.vam,
          solutions.stepping_stone,
        ]
      : [targetSolution];

    report += `3. DETAILED TRANSPORTATION TABLEAUS\n`;
    report += `------------------------------------------------------------------------\n`;

    methodsToPrint.forEach((sol) => {
      report += `\n[ ${sol.methodName.toUpperCase()} ] -> Total ${isMax ? 'Profit' : 'Cost'}: $${sol.totalCost.toLocaleString()}\n`;
      report += `Allocations (x_ij):\n`;
      report += `Origin \\ Dest`.padEnd(colWidth);
      sol.destinations.forEach((d) => {
        report += d.padEnd(colWidth);
      });
      report += `Supply\n`;

      sol.sources.forEach((s, r) => {
        report += s.padEnd(colWidth);
        sol.destinations.forEach((_, c) => {
          const alloc = sol.allocations[r][c];
          const isEps = sol.isEpsilon[r][c];
          const cost = sol.costs[r][c];
          let cellStr = `[$${cost}] `;
          if (isEps) cellStr += `ε (0)`;
          else if (alloc !== null) cellStr += `${alloc}`;
          else cellStr += `—`;
          report += cellStr.padEnd(colWidth);
        });
        report += `${sol.supply[r]}\n`;
      });

      report += `Demand`.padEnd(colWidth);
      sol.demand.forEach((d) => {
        report += `${d}`.padEnd(colWidth);
      });
      report += `\n`;
    });

    return report;
  };

  const handleCopy = () => {
    const text = generateTextReport();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadTxt = () => {
    const text = generateTextReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transportation_Problem_Report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!currentImagePreviewUrl) return;
    const link = document.createElement('a');
    link.href = currentImagePreviewUrl;
    link.download = `Transportation_Tableau_${currentPreviewSolution.methodName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
    link.click();
  };

  // Direct genuine PDF file download via jsPDF
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadTransportationPdf({
        problem,
        solutions,
        targetSolution: currentPreviewSolution,
        includeAllMethods,
        includeLoop: includeVisualPolygon,
        objective,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to generate PDF document:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const buildPrintHtml = () => {
    const methodsToPrint = includeAllMethods
      ? [
          solutions.stepping_stone,
          solutions.nwcr,
          solutions.least_cost,
          solutions.max_profit,
          solutions.vam,
        ]
      : [currentPreviewSolution];

    const imageHtmlBlocks = methodsToPrint
      .map((sol) => {
        const dataUrl = generateTableauImageDataUrl(sol, {
          showLoop: includeVisualPolygon && sol.method === 'stepping_stone',
          objective,
          scale: 2,
        });

        return `
          <div class="image-wrapper" style="page-break-inside: avoid; margin-bottom: 24px;">
            <img 
              src="${dataUrl}" 
              alt="${sol.methodName} Transportation Tableau" 
              style="width: 100%; max-width: 820px; display: block; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" 
            />
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transportation Problem Graphical Report</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              padding: 20px;
              max-width: 880px;
              margin: 0 auto;
            }
            @media print {
              body { padding: 5px; max-width: 100%; }
              .image-wrapper { page-break-inside: avoid; }
              .no-print { display: none !important; }
            }
            .action-bar {
              background: #f1f5f9;
              padding: 10px 16px;
              border-radius: 8px;
              margin-bottom: 16px;
              display: flex;
              gap: 10px;
              align-items: center;
              border: 1px solid #cbd5e1;
            }
            .print-btn {
              background: #4f46e5;
              color: white;
              border: none;
              padding: 8px 16px;
              font-size: 13px;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
            }
            h1 { font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a; }
            p { font-size: 12px; color: #475569; margin: 0 0 16px 0; }
            .header-bar {
              background: #0f172a;
              color: white;
              padding: 12px 16px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
            }
            .header-bar strong { color: #38bdf8; }
            .footer-tag {
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="action-bar no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <span style="font-size: 12px; color: #475569;">In destination, select <strong>Save as PDF</strong> or select your printer.</span>
          </div>

          <h1>Operations Research: Transportation Problem Graphical Report</h1>
          <p>
            Objective: <strong>${isMax ? 'Maximize Profit' : 'Minimize Total Cost'}</strong> | 
            Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </p>

          <div class="header-bar">
            <div>Optimal Stepping Stone Cost: <strong>$${solutions.stepping_stone.totalCost.toLocaleString()}</strong></div>
            <div>NWCR: <strong>$${solutions.nwcr.totalCost.toLocaleString()}</strong></div>
            <div>Least Cost: <strong>$${solutions.least_cost.totalCost.toLocaleString()}</strong></div>
            <div>VAM: <strong>$${solutions.vam.totalCost.toLocaleString()}</strong></div>
          </div>

          ${imageHtmlBlocks}

          <div class="footer-tag">
            Generated with Operations Research Transportation Problem Solver & Educational Dashboard
          </div>
        </body>
      </html>
    `;
  };

  const handleOpenInNewTab = () => {
    const html = buildPrintHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      handleNativePrint();
    }
  };

  const handleNativePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      handleOpenInNewTab();
      return;
    }

    frameDoc.open();
    frameDoc.write(buildPrintHtml());
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print blocked, falling back to new tab:', err);
        handleOpenInNewTab();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2000);
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/80 flex items-center justify-center shadow-xs">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Print & Export Report
              </h2>
              <p className="text-2xs text-slate-300">
                Direct PDF file download, high-resolution PNG image, or browser print
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Main Actions Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                pdfSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-98 text-white'
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>PDF Saved!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* PNG Image Download */}
            <button
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Picture (.PNG)</span>
            </button>

            {/* Print / Save via Browser */}
            <button
              onClick={handleNativePrint}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print via Browser</span>
            </button>

            {/* Open in New Window Tab */}
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>Open in New Tab</span>
            </button>
          </div>

          {/* Quick Guidance Alert */}
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-900 block">
                Can&apos;t save PDF with your browser printer dialog?
              </span>
              <p className="text-rose-900 leading-relaxed">
                Many browsers block print modals inside iframe previews. Click the red <strong>&quot;Download PDF (.pdf)&quot;</strong> button above to <strong>instantly generate and download the actual .pdf file</strong> straight to your device with all color tableaus and loop diagrams included!
              </p>
            </div>
          </div>

          {/* Controls & Method Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Selected Method:</span>
              <select
                value={selectedMethodForImage}
                onChange={(e) => setSelectedMethodForImage(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="stepping_stone">Stepping Stone (Optimal + Closed Loop)</option>
                <option value="nwcr">Northwest Corner Rule</option>
                <option value="least_cost">Least Cost Method</option>
                <option value="max_profit">Maximum Profit Method</option>
                <option value="vam">Vogel&apos;s Approximation (VAM)</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeVisualPolygon}
                  onChange={(e) => setIncludeVisualPolygon(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Include Stepping Stone loop overlay</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeAllMethods}
                  onChange={(e) => setIncludeAllMethods(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Include all 5 methods in PDF</span>
              </label>
            </div>
          </div>

          {/* Preview Tabs: Image Picture vs Raw Text */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTab('image')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewTab === 'image'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Tableau Picture Preview</span>
                </button>

                <button
                  onClick={() => setPreviewTab('text')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewTab === 'text'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Raw Text Report</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {previewTab === 'text' && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-2xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
                <span className="text-3xs text-slate-400 font-mono">
                  {previewTab === 'image' ? 'High-Res PNG (Retina 2x)' : 'UTF-8 ASCII'}
                </span>
              </div>
            </div>

            {previewTab === 'image' ? (
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[220px] max-h-[340px] overflow-auto">
                {currentImagePreviewUrl ? (
                  <div className="relative group">
                    <img
                      src={currentImagePreviewUrl}
                      alt="Transportation Tableau Preview"
                      className="max-w-full h-auto rounded-lg shadow-md border border-slate-300"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={handleDownloadPng}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-lg backdrop-blur-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save PNG</span>
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-lg backdrop-blur-xs cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Save PDF</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-8">Generating image preview...</div>
                )}
              </div>
            ) : (
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-2xs font-mono overflow-x-auto max-h-56 leading-relaxed select-all">
                {generateTextReport()}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-2xs text-slate-500">
            Tip: <strong>Download PDF (.pdf)</strong> saves the actual file directly without relying on browser printer dialogs.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


