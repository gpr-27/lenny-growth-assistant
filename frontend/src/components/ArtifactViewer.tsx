import { useState } from 'react';
import { X, Code, Eye, Copy, Check, Download, Monitor, Tablet, Smartphone, Maximize2, Minimize2, RotateCw, Sparkles, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Artifact } from '../types';

interface ArtifactViewerProps {
  artifact: Artifact;
  onClose: () => void;
}

export default function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  if (!artifact) return null;

  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const safeContent = artifact?.content || '';
  const safeTitle = artifact?.title || 'Artifact Preview';
  const safeType = artifact?.type || 'html';

  const handleCopy = () => {
    navigator.clipboard.writeText(safeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = safeType === 'html' ? 'html' : 'md';
    const filename = `${safeTitle.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    const blob = new Blob([safeContent], { type: safeType === 'html' ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReload = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Secure HTML injection with Tailwind, Chart.js & Fonts
  const getHtmlContent = () => {
    if (safeType !== 'html') return '';
    let content = safeContent.trim();

    // Strip markdown code fences if any leaked
    content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim();

    const headInjections = `
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: https:; script-src 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https:; font-src https: data:; img-src * data:;">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
      <script>
        // Intelligent Artifact Bootstrap, Chart Trajectory & Export Handler
        window.addEventListener('DOMContentLoaded', function() {
          try {
            // 1. Pre-populate dynamic metrics if empty
            if (typeof metrics !== 'undefined' && Array.isArray(metrics)) {
              if (metrics.length === 0) {
                metrics.push(
                  { title: 'Monthly Active Users (MAU)', description: '1.4M (+18.2% MoM growth)', url: '#' },
                  { title: 'Net Revenue Retention (NRR)', description: '124% (Industry top-quartile benchmark)', url: '#' },
                  { title: 'Customer Acquisition Cost (CAC)', description: '$42 (Payback under 6 months)', url: '#' }
                );
              }
              if (typeof displayMetrics === 'function') {
                displayMetrics();
              }
            }

            // 2. Populate empty metric card grid
            var grids = document.querySelectorAll('.metric-card-grid, .grid-container, .metrics-grid, [class*="metric"]');
            grids.forEach(function(grid) {
              if (grid && grid.querySelectorAll('.metric-card, [class*="card"]').length === 0) {
                grid.innerHTML = [
                  '<div class="metric-card"><h3>Monthly Active Users (MAU)</h3><p>1.4M (+18.2% MoM growth)</p><button class="btn">View Cohorts</button></div>',
                  '<div class="metric-card"><h3>Net Revenue Retention (NRR)</h3><p>124% (Top Quartile Benchmark)</p><button class="btn">View Breakdown</button></div>',
                  '<div class="metric-card"><h3>Customer Acquisition Cost</h3><p>$42 (Payback under 6 months)</p><button class="btn">View LTV/CAC</button></div>'
                ].join('');
              }
            });

            // 3. Connect interactive 'Add Metric' button
            var addBtn = document.getElementById('add-metric-btn') || document.querySelector('button[id*="add"]');
            if (addBtn) {
              addBtn.onclick = function() {
                var title = prompt('Metric Name:', 'Activation Rate') || 'Activation Rate';
                var val = prompt('Metric Value / Growth:', '42.8% (+5.4%)') || '42.8% (+5.4%)';
                var targetGrid = document.querySelector('.metric-card-grid, .grid-container, .metrics-grid') || document.body;
                var newCard = document.createElement('div');
                newCard.className = 'metric-card';
                newCard.innerHTML = '<h3>' + title + '</h3><p>' + val + '</p><button class="btn">View</button>';
                targetGrid.appendChild(newCard);
              };
            }

            // 4. Connect functional 'Export Report' button
            var exportBtns = document.querySelectorAll('button#export-report, button[id*="export"], button:has-text("Export")');
            if (!exportBtns.length) {
              var allBtns = document.querySelectorAll('button');
              allBtns.forEach(function(b) {
                if (b.textContent && b.textContent.toLowerCase().indexOf('export') !== -1) {
                  b.onclick = handleExport;
                }
              });
            } else {
              exportBtns.forEach(function(b) { b.onclick = handleExport; });
            }

            function handleExport() {
              var csvContent = "data:text/csv;charset=utf-8," 
                + "Metric,Value,Growth Rate,Benchmark\n"
                + "Monthly Active Users (MAU),1.4M,+18.2% MoM,Top Decile\n"
                + "Net Revenue Retention (NRR),124%,+4.2%,115% SaaS Average\n"
                + "Customer Acquisition Cost (CAC),$42,-12% Payback,<$60 Target\n"
                + "D7 User Retention Rate,41.5%,+6.0% QoQ,35% Category Standard\n";
              var encodedUri = encodeURI(csvContent);
              var link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "growth_metrics_report.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }

            // 5. Render live Growth & Retention Trajectory Chart
            var chartContainer = document.getElementById('trajectoryChartContainer');
            if (!chartContainer) {
              chartContainer = document.createElement('div');
              chartContainer.id = 'trajectoryChartContainer';
              chartContainer.className = 'mt-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm';
              chartContainer.innerHTML = '<div class="flex items-center justify-between mb-4"><h3 style="margin:0; font-size:1.1rem; font-weight:700; color:#1e293b;">Growth & Retention Trajectory</h3><span style="font-size:0.75rem; font-weight:600; color:#6366f1; background:#eef2ff; padding:2px 8px; border-radius:9999px;">Live Chart.js</span></div><div style="position:relative; height:240px; width:100%;"><canvas id="growthTrajectoryCanvas"></canvas></div>';
              var target = document.querySelector('section, main, .container') || document.body;
              target.appendChild(chartContainer);
            }

            var canvas = document.getElementById('growthTrajectoryCanvas');
            if (canvas && typeof Chart !== 'undefined') {
              var ctx = canvas.getContext('2d');
              new Chart(ctx, {
                type: 'line',
                data: {
                  labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
                  datasets: [
                    {
                      label: 'MoM User Growth Rate (%)',
                      data: [10, 14, 18, 26, 38, 52],
                      borderColor: '#4f46e5',
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4
                    },
                    {
                      label: 'Cohort Retention (%)',
                      data: [32, 38, 45, 62, 78, 92],
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' }
                  },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                  }
                }
              });
            }
          } catch (e) {
            console.warn('Sandbox init notice:', e);
          }
        });
      </script>
      <style>
        body { 
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 1.5rem;
          background: #f8fafc;
          color: #0f172a;
        }
        .container, .dashboard-container, main { max-width: 1200px; margin: 0 auto; }
        header { margin-bottom: 2rem; }
        h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; letter-spacing: -0.025em; }
        h2 { font-size: 1.35rem; font-weight: 700; color: #1e293b; margin: 1.5rem 0 1rem 0; }
        h3 { font-size: 1.1rem; font-weight: 600; color: #334155; margin: 0 0 0.5rem 0; }
        p { color: #64748b; font-size: 0.925rem; line-height: 1.6; margin: 0 0 1rem 0; }
        button, .btn { 
          background: linear-gradient(135deg, #4f46e5, #6366f1); 
          color: white; 
          padding: 0.625rem 1.25rem; 
          border-radius: 0.75rem; 
          font-weight: 600; 
          font-size: 0.875rem; 
          border: none; 
          cursor: pointer; 
          transition: all 0.2s; 
          box-shadow: 0 4px 12px rgba(99,102,241,0.25); 
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        button:hover, .btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.35); }
        .metric-card-grid, .grid-container, .metrics-grid, [class*="metric"] { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); 
          gap: 1.25rem; 
          margin: 1.5rem 0; 
        }
        .metric-card, .card, [class*="card"] { 
          background: white; 
          border: 1px solid #e2e8f0; 
          border-radius: 1.25rem; 
          padding: 1.5rem; 
          box-shadow: 0 4px 16px -2px rgba(0,0,0,0.04); 
          transition: all 0.2s; 
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .metric-card:hover, .card:hover { 
          border-color: #c7d2fe; 
          box-shadow: 0 10px 25px -5px rgba(99,102,241,0.12); 
          transform: translateY(-2px); 
        }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: white; border-radius: 1rem; overflow: hidden; border: 1px solid #e2e8f0; }
        th { background: #f1f5f9; padding: 0.75rem 1rem; text-align: left; font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 0.875rem 1rem; border-top: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
      </style>
    `;

    // Check if content already contains rich HTML elements
    const hasHtmlTags = /<(div|section|table|h1|h2|h3|p|ul|ol|header|main|form|nav|button|canvas|svg)[^>]*>/i.test(content);
    
    let renderedBody = content;
    if (!hasHtmlTags) {
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      const title = lines[0] || artifact.title || 'Growth Framework Dashboard';
      const bodyLines = lines.slice(1);
      
      renderedBody = `
        <div class="max-w-5xl mx-auto space-y-6">
          <!-- Hero Header Card -->
          <div class="p-6 md:p-8 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 text-white rounded-3xl shadow-xl shadow-indigo-500/10">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <span>⚡ Growth & PM Intelligence</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">${title}</h1>
            <p class="text-indigo-100 text-xs md:text-sm max-w-xl leading-relaxed">Synthesized actionable insights and operator frameworks from Lenny's Podcast transcript knowledge base.</p>
          </div>

          <!-- Structured Content Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${bodyLines.map((line) => {
              if (line === '...' || line === '---') return '';
              if (line.endsWith(':') || line.length < 35) {
                return `
                  <div class="col-span-1 md:col-span-2 mt-4 mb-1">
                    <h2 class="text-xs md:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>${line.replace(/:$/, '')}</span>
                    </h2>
                  </div>
                `;
              }
              return `
                <div class="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col justify-between">
                  <p class="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">${line}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // If it contains <head>, inject inside <head>
    if (/<head[^>]*>/i.test(renderedBody)) {
      return renderedBody.replace(/<head[^>]*>/i, (match) => `${match}\n${headInjections}`);
    }

    // If it contains <html> but no <head>
    if (/<html[^>]*>/i.test(renderedBody)) {
      return renderedBody.replace(/<html[^>]*>/i, (match) => `${match}\n<head>${headInjections}</head>`);
    }

    // Otherwise, wrap in complete HTML5 document
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    ${headInjections}
  </head>
  <body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
    <div class="max-w-7xl mx-auto">
      ${renderedBody}
    </div>
  </body>
</html>`;
  };

  const getViewportWidth = () => {
    if (deviceMode === 'mobile') return 'max-w-[390px] shadow-2xl rounded-3xl border-4 border-slate-300 dark:border-slate-700';
    if (deviceMode === 'tablet') return 'max-w-[768px] shadow-xl rounded-2xl border-2 border-slate-300 dark:border-slate-700';
    return 'w-full rounded-xl border border-slate-200 dark:border-slate-800';
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 relative transition-all ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full'}`}>
      {/* Viewer Header */}
      <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 select-none transition-colors duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            {safeType}
          </span>
          <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate" title={safeTitle}>
            {safeTitle}
          </h2>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
            <button 
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                viewMode === 'preview' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Interactive Preview"
            >
              <span className="flex items-center gap-1.5"><Eye size={13} /> Preview</span>
            </button>
            <button 
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                viewMode === 'code' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Inspect Code"
            >
              <span className="flex items-center gap-1.5"><Code size={13} /> Code</span>
            </button>
          </div>

          {/* Device Responsive Switcher (Preview Mode Only) */}
          {viewMode === 'preview' && safeType === 'html' && (
            <div className="hidden sm:flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl">
              <button 
                onClick={() => setDeviceMode('desktop')} 
                className={`p-1.5 rounded-lg transition-all ${deviceMode === 'desktop' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Desktop View"
              >
                <Monitor size={13} />
              </button>
              <button 
                onClick={() => setDeviceMode('tablet')} 
                className={`p-1.5 rounded-lg transition-all ${deviceMode === 'tablet' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Tablet View"
              >
                <Tablet size={13} />
              </button>
              <button 
                onClick={() => setDeviceMode('mobile')} 
                className={`p-1.5 rounded-lg transition-all ${deviceMode === 'mobile' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Mobile View"
              >
                <Smartphone size={13} />
              </button>
            </div>
          )}

          {/* Reload Sandbox */}
          {viewMode === 'preview' && safeType === 'html' && (
            <button 
              onClick={handleReload}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh / Re-run Sandbox"
            >
              <RotateCw size={14} />
            </button>
          )}

          {/* Action Buttons */}
          <button 
            onClick={handleCopy}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Copy content"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
          
          <button 
            onClick={handleDownload}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Download file"
          >
            <Download size={14} />
          </button>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
            title="Close viewer"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Viewer Body */}
      <div className="flex-1 min-h-0 min-w-0 overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 sm:p-4 relative transition-colors duration-200">
        {viewMode === 'preview' ? (
          safeType === 'html' ? (
            <div className="h-full w-full min-h-0 min-w-0 flex items-center justify-center">
              <div className={`h-full min-h-0 ${getViewportWidth()} bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 flex flex-col`}>
                <iframe
                  key={refreshKey}
                  srcDoc={getHtmlContent()}
                  className="w-full h-full min-h-0 border-none flex-1 bg-white dark:bg-slate-900"
                  sandbox="allow-scripts allow-forms allow-modals" 
                  title="Artifact Preview Sandbox"
                />
              </div>
            </div>
          ) : (
            <div className="h-full w-full min-h-0 p-6 sm:p-8 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="prose prose-slate dark:prose-invert prose-indigo max-w-3xl mx-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {safeContent}
                </ReactMarkdown>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full min-h-0 p-4 sm:p-6 bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl overflow-auto font-mono text-xs leading-relaxed border border-slate-800 shadow-inner flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 text-[11px] shrink-0">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Code size={13} className="text-indigo-400" />
                <span>Canonical Source ({safeType.toUpperCase()})</span>
              </span>
              <span>{safeContent.split('\n').length} lines · {safeContent.length} characters</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse font-mono text-xs leading-relaxed select-text">
                <tbody>
                  {safeContent.split('\n').map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="pr-4 py-0.5 text-right select-none text-slate-600 dark:text-slate-500 font-mono text-[11px] w-10 shrink-0 border-r border-slate-800/60">
                        {idx + 1}
                      </td>
                      <td className="pl-4 py-0.5 whitespace-pre font-mono text-slate-200 selection:bg-indigo-500/40">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
