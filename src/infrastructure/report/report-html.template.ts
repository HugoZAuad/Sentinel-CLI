import { ReportHtmlParams } from './report-html.types';
import { Finding } from './report.types';

const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const renderFindingScope = (finding: Finding): string => {
  const teamClass = finding.team === 'RED' ? 'origin-red' : 'origin-blue';
  const surfaceLabel = finding.category === 'portscan' ? 'PORT' : 'WEB';
  return `<span class="origin-chip ${teamClass}">${finding.team} · ${surfaceLabel}</span>`;
};

const renderEndpointDetailsTable = (
  details: {
    endpoint: string;
    status?: number;
    discovered: boolean;
    analyzed: boolean;
    checks: string[];
    findings: string[];
  }[],
): string => {
  if (!details || details.length === 0) {
    return '<p class="endpoint-empty">Sem detalhamento de endpoints nesta execução.</p>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th style="width:200px">Endpoint</th>
          <th style="width:80px">Status</th>
          <th style="width:90px">Descoberto</th>
          <th style="width:90px">Analisado</th>
          <th style="width:180px">Checks Executados</th>
          <th>Achados no Endpoint</th>
        </tr>
      </thead>
      <tbody>
        ${details.map((item) => `
          <tr>
            <td><code>${item.endpoint}</code></td>
            <td>${item.status ?? '-'}</td>
            <td>${item.discovered ? '<span class="badge badge-ok">SIM</span>' : 'NÃO'}</td>
            <td>${item.analyzed ? '<span class="badge badge-ok">SIM</span>' : 'NÃO'}</td>
            <td>${item.checks.length > 0 ? item.checks.join(', ') : '<span style="color:#888;font-style:italic">Sem checks</span>'}</td>
            <td>${item.findings.length > 0 ? item.findings.join(', ') : '<span style="color:#888;font-style:italic">Sem achados</span>'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};
const renderFindingsTable = (list: Finding[], emptyMsg: string): string => {
  if (list.length === 0) {
    return `<div class="no-findings"><span class="check-icon">✔</span>${emptyMsg}</div>`;
  }

  const sorted = [...list].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return `
    <table>
      <thead>
        <tr>
          <th style="width:110px">Severidade</th>
          <th style="width:120px">Origem</th>
          <th style="width:180px">Ameaça / Controle</th>
          <th>Evidência e Recomendação</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map((finding) => `
          <tr>
            <td><span class="badge badge-${finding.severity}">${finding.severity}</span></td>
            <td>${renderFindingScope(finding)}</td>
            <td class="finding-type">${finding.type}</td>
            <td class="finding-evidence">${finding.evidence}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

const renderPortsTable = (ports: { port: number; service: string; version?: string }[]): string => {
  if (!ports || ports.length === 0) return '';

  return `
    <table>
      <thead>
        <tr>
          <th style="width:80px">Porta</th>
          <th style="width:160px">Serviço</th>
          <th>Versão Detectada</th>
        </tr>
      </thead>
      <tbody>
        ${ports.map((port) => `
          <tr>
            <td><code class="port-code">${port.port}/tcp</code></td>
            <td>${port.service}</td>
            <td>${port.version ?? '<span style="color:#888;font-style:italic">Não identificada</span>'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

export const buildReportHtml = (params: ReportHtmlParams): string => {
  const {
    target,
    score,
    findings,
    meta,
    scoreLabel,
    scoreColor,
    scoreBg,
    totalCritical,
    totalHigh,
    totalMedium,
    totalLow,
    maxBar,
    totalFindings,
    totalRed,
    totalBlue,
    redShare,
    blueShare,
    scoreImpact,
    residualRisk,
    redWebFallback,
    redPort,
    blueWebFallback,
    bluePort,
  } = params;

  const severityPoints: Record<Finding['severity'], number> = {
    LOW: 2,
    MEDIUM: 5,
    HIGH: 10,
    CRITICAL: 20,
  };

  const categoryWeight: Record<NonNullable<Finding['category']>, number> = {
    webscan: 1.15,
    portscan: 0.4,
  };

  const findingImpact = (finding: Finding): number => {
    const basePoints = severityPoints[finding.severity];
    const weight = categoryWeight[finding.category ?? 'webscan'] ?? 1;
    return Math.max(1, Math.round(basePoints * weight));
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Sentinel Scan — Relatório de Segurança</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --surface-2: #1e2530;
      --border: #2a3140;
      --text: #e6edf3;
      --text-muted: #7d8590;
      --text-dim: #484f58;
      --red: #e8394a;
      --red-muted: rgba(232,57,74,0.12);
      --blue: #3b8beb;
      --blue-muted: rgba(59,139,235,0.12);
      --green: #00c896;
      --green-muted: rgba(0,200,150,0.10);
      --amber: #f5a623;
      --accent: #5b8dee;
      --mono: 'IBM Plex Mono', monospace;
      --sans: 'IBM Plex Sans', sans-serif;
    }

    @page { size: A4; margin: 0; }

    html, body {
      background: var(--bg);
      font-family: var(--sans);
      font-size: 12.5px;
      color: var(--text);
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .score-banner,
    .stats-row,
    .risk-matrix,
    .no-findings,
    .header,
    .footer,
    tr { page-break-inside: avoid; break-inside: avoid; }

    .section-heading,
    .sub-section-header,
    th { page-break-after: avoid; break-after: avoid; }

    .page { max-width: 100%; }
    .sheet { padding: 12mm 14mm 12mm 14mm; }
    .sheet + .sheet { page-break-before: always; break-before: page; }

    .sub-section,
    .open-ports-section,
    table { page-break-inside: auto; break-inside: auto; }
    thead { display: table-header-group; }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 22px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 26px;
    }
    .brand { display: flex; align-items: center; gap: 13px; }
    .brand-icon {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #1e2a3a, #253045);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .brand-name { font-size: 19px; font-weight: 700; color: var(--text); }
    .brand-sub  { font-size: 10px; color: var(--text-muted); font-family: var(--mono); margin-top: 2px; }
    .header-meta { text-align: right; font-size: 11px; color: var(--text-muted); line-height: 1.8; font-family: var(--mono); }
    .header-meta strong { color: var(--text); }
    .target-chip {
      display: inline-block;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 4px; padding: 1px 9px;
      font-size: 11px; font-family: var(--mono); color: var(--accent); margin-top: 3px;
    }

    .score-banner {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 22px 28px;
      margin-bottom: 18px;
      display: flex; align-items: center; gap: 30px;
    }
    .score-circle {
      flex-shrink: 0; width: 92px; height: 92px; border-radius: 50%;
      background: ${scoreBg}; border: 3px solid ${scoreColor};
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .score-number { font-size: 27px; font-weight: 700; color: ${scoreColor}; font-family: var(--mono); line-height: 1; }
    .score-max   { font-size: 10px; color: var(--text-muted); font-family: var(--mono); }
    .score-label-chip {
      display: inline-block; background: ${scoreBg}; color: ${scoreColor};
      border: 1px solid ${scoreColor}; border-radius: 4px;
      padding: 1px 7px; font-size: 9px; font-weight: 700;
      font-family: var(--mono); letter-spacing: 1px; margin-top: 4px;
    }
    .score-info h2 { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
    .score-info p  { color: var(--text-muted); line-height: 1.65; font-size: 11.5px; }

    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 18px; }
    .stat-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 13px 15px;
    }
    .stat-label { font-size: 9px; font-family: var(--mono); letter-spacing: 0.8px; color: var(--text-muted); text-transform: uppercase; }
    .stat-value { font-size: 25px; font-weight: 700; font-family: var(--mono); margin-top: 3px; }
    .stat-card.critical .stat-value { color: #e8394a; }
    .stat-card.high     .stat-value { color: #e74c3c; }
    .stat-card.medium   .stat-value { color: var(--amber); }
    .stat-card.low      .stat-value { color: #f1c40f; }

    .risk-matrix {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 16px 20px; margin-bottom: 0;
    }
    .risk-matrix h4 {
      font-size: 9px; font-family: var(--mono); font-weight: 700;
      letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 11px;
    }
    .risk-bar-row   { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .risk-bar-label { font-size: 9px; font-family: var(--mono); width: 60px; text-align: right; }
    .risk-bar-track { flex: 1; height: 5px; background: var(--surface-2); border-radius: 3px; overflow: hidden; }
    .risk-bar-fill  { height: 100%; border-radius: 3px; }
    .risk-bar-count { font-size: 9px; font-family: var(--mono); width: 16px; }

    .insights-grid {
      margin-top: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .insight-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 14px 16px;
      page-break-inside: avoid; break-inside: avoid;
    }
    .insight-card h4 {
      font-size: 9px; font-family: var(--mono); font-weight: 700;
      letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted);
      margin-bottom: 10px;
    }
    .team-chart-wrap { display: flex; align-items: center; gap: 14px; }
    .team-donut {
      width: 78px; height: 78px; border-radius: 50%;
      flex-shrink: 0;
      background: conic-gradient(var(--red) 0 ${redShare}%, var(--blue) ${redShare}% 100%);
      position: relative;
    }
    .team-donut::after {
      content: '';
      position: absolute; inset: 11px;
      border-radius: 50%;
      background: var(--surface-2);
      border: 1px solid var(--border);
    }
    .team-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; }
    .team-legend-row { display: flex; align-items: center; justify-content: space-between; }
    .team-legend-left { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); }
    .legend-dot { width: 7px; height: 7px; border-radius: 50%; }
    .legend-dot.red { background: var(--red); }
    .legend-dot.blue { background: var(--blue); }
    .team-legend-val { font-size: 10px; color: var(--text); font-family: var(--mono); }
    .impact-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .impact-label { width: 56px; text-align: right; font-size: 9px; font-family: var(--mono); }
    .impact-track { flex: 1; height: 6px; background: var(--surface-2); border-radius: 3px; overflow: hidden; }
    .impact-fill { height: 100%; border-radius: 3px; }
    .impact-val { width: 32px; font-size: 9px; font-family: var(--mono); text-align: right; color: var(--text-muted); }
    .metrics-grid {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .metric-pill {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px;
    }
    .metric-pill-val { font-size: 14px; font-family: var(--mono); color: var(--accent); font-weight: 700; }
    .metric-pill-lbl { font-size: 8px; font-family: var(--mono); color: var(--text-muted); letter-spacing: 0.6px; text-transform: uppercase; }

    .methodology-section {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px 24px;
    }
    .methodology-section h3 {
      font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: var(--text-muted);
      text-transform: uppercase; font-family: var(--mono);
      margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border);
    }
    .method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .method-block h4 {
      font-size: 11px; font-weight: 600; color: var(--text);
      margin-bottom: 8px; display: flex; align-items: center; gap: 7px;
    }
    .team-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .team-dot.red  { background: var(--red); }
    .team-dot.blue { background: var(--blue); }
    .method-list { list-style: none; }
    .method-list li {
      font-size: 10.5px; color: var(--text-muted);
      padding: 4px 0 4px 12px; position: relative;
      border-bottom: 1px solid var(--border); line-height: 1.5;
    }
    .method-list li:last-child { border-bottom: none; }
    .method-list li::before { content: '›'; position: absolute; left: 0; color: var(--text-dim); }
    .method-list li strong  { color: var(--text); font-weight: 600; }
    .scan-stats {
      display: flex; gap: 22px; margin-top: 14px;
      padding-top: 14px; border-top: 1px solid var(--border); flex-wrap: wrap;
    }
    .scan-stat { display: flex; flex-direction: column; gap: 2px; }
    .scan-stat-val { font-size: 16px; font-weight: 700; font-family: var(--mono); color: var(--accent); }
    .scan-stat-lbl { font-size: 9px; color: var(--text-muted); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.5px; }

    .section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .team-badge {
      font-size: 9px; font-family: var(--mono); font-weight: 700;
      letter-spacing: 1.5px; padding: 3px 8px; border-radius: 4px;
    }
    .team-badge.red  { background: var(--red-muted);  color: var(--red);  border: 1px solid rgba(232,57,74,0.3); }
    .team-badge.blue { background: var(--blue-muted); color: var(--blue); border: 1px solid rgba(59,139,235,0.3); }
    .section-heading h2 { font-size: 16px; font-weight: 700; color: var(--text); }
    .section-desc { font-size: 11px; color: var(--text-muted); line-height: 1.65; margin-bottom: 14px; }

    .sub-section { margin-bottom: 20px; }
    .sub-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
    .sub-section-header h3 { font-size: 12px; font-weight: 600; color: var(--text); }
    .sub-icon {
      font-size: 12px; width: 23px; height: 23px;
      border-radius: 5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .sub-icon.web  { background: rgba(232,57,74,0.12); }
    .sub-icon.port { background: rgba(91,141,238,0.12); }
    .sub-caption { font-size: 10px; color: var(--text-muted); font-family: var(--mono); line-height: 1.5; margin-bottom: 8px; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: var(--surface-2); }
    th {
      padding: 9px 11px; text-align: left; font-size: 9px; font-weight: 700;
      font-family: var(--mono); letter-spacing: 0.8px; text-transform: uppercase;
      color: var(--text-muted); border-bottom: 1px solid var(--border);
    }
    td {
      padding: 9px 11px; border-bottom: 1px solid var(--border);
      vertical-align: top; color: var(--text); line-height: 1.55;
    }
    tr:last-child td { border-bottom: none; }
    tbody tr            { background: var(--surface); }
    tbody tr:nth-child(even) { background: #141920; }
    .finding-type     { font-weight: 600; font-size: 11px; }
    .finding-evidence { color: var(--text-muted); font-size: 10.5px; }

    code, .port-code {
      font-family: var(--mono); font-size: 10px;
      background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 3px; padding: 1px 4px; color: var(--accent);
    }

    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; font-family: var(--mono); letter-spacing: 0.4px; }
    .badge-CRITICAL { background: rgba(232,57,74,0.20);  color: #ff5c6e; border: 1px solid rgba(232,57,74,0.35); }
    .badge-HIGH     { background: rgba(231,76,60,0.15);  color: #ff7043; border: 1px solid rgba(231,76,60,0.3); }
    .badge-MEDIUM   { background: rgba(245,166,35,0.15); color: #f5a623; border: 1px solid rgba(245,166,35,0.3); }
    .badge-LOW      { background: rgba(241,196,15,0.12); color: #f1c40f; border: 1px solid rgba(241,196,15,0.25); }
    .badge-ok       { background: rgba(0,200,150,0.15); color: #00c896; border: 1px solid rgba(0,200,150,0.3); }

    .origin-chip {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 88px; padding: 2px 8px; border-radius: 999px;
      font-size: 8.5px; font-weight: 700; font-family: var(--mono);
      letter-spacing: 0.5px; border: 1px solid transparent; white-space: nowrap;
    }
    .origin-red {
      background: rgba(232,57,74,0.14);
      color: #ff6b7a;
      border-color: rgba(232,57,74,0.30);
    }
    .origin-blue {
      background: rgba(59,139,235,0.14);
      color: #65a9ff;
      border-color: rgba(59,139,235,0.30);
    }

    .no-findings {
      display: flex; align-items: center; gap: 9px;
      background: var(--green-muted); color: var(--green);
      padding: 11px 15px; border-radius: 7px;
      border: 1px solid rgba(0,200,150,0.25);
      font-size: 10.5px; font-weight: 600; font-family: var(--mono);
    }
    .check-icon { font-size: 13px; }

    .divider { border: none; border-top: 1px solid var(--border); margin: 28px 0 0; }

    .open-ports-section {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 15px 18px; margin-bottom: 14px;
    }
    .open-ports-section h4 {
      font-size: 9px; font-family: var(--mono); font-weight: 700;
      letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 11px;
    }
    .endpoint-details-section {
      margin-top: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 15px 28px 15px 18px;
    }
    .endpoint-details-section h4 {
      font-size: 9px; font-family: var(--mono); font-weight: 700;
      letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 11px;
    }
    .endpoint-empty {
      font-size: 10px;
      color: var(--text-muted);
      font-style: italic;
    }

    .footer {
      margin-top: 36px; padding-top: 14px;
      border-top: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .footer-left  { font-size: 9px; color: var(--text-dim); line-height: 1.8; font-family: var(--mono); }
    .footer-right { font-size: 9px; color: var(--text-dim); text-align: right; font-family: var(--mono); }
    .confidential {
      display: inline-block; background: var(--red-muted); color: var(--red);
      border: 1px solid rgba(232,57,74,0.3); border-radius: 3px;
      padding: 1px 6px; font-size: 8px; font-weight: 700;
      letter-spacing: 1.5px; text-transform: uppercase;
    }
  </style>
</head>
<body>
<div class="page">
  <div class="sheet">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">🛡️</div>
      <div>
        <div class="brand-name">SENTINEL SCAN</div>
        <div class="brand-sub">SECURITY AUDIT REPORT · SENTINEL CORE v2.0</div>
      </div>
    </div>
    <div class="header-meta">
      <div><strong>Alvo:</strong></div>
      <div class="target-chip">${target}</div>
      <div style="margin-top:5px"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</div>
      <div><strong>Modo:</strong> Passivo + Ativo (Non-Destructive)</div>
    </div>
  </div>

  <div class="score-banner">
    <div class="score-circle">
      <div class="score-number">${score}</div>
      <div class="score-max">/100</div>
      <div class="score-label-chip">${scoreLabel}</div>
    </div>
    <div class="score-info">
      <h2>Índice Global de Segurança</h2>
      <p>
        O <em>Security Score</em> consolida os módulos Red Team e Blue Team em uma pontuação única.
        Cada achado reduz a pontuação conforme sua severidade e categoria: <strong>CRITICAL −20</strong>, <strong>HIGH −10</strong>,
        <strong>MEDIUM −5</strong>, <strong>LOW −2</strong>, com ajuste por contexto para Web/Auth e PortScan.
        Base: 100. Scores abaixo de 50 indicam exposição crítica e exigem ação imediata.
      </p>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card critical"><div class="stat-label">Critical</div><div class="stat-value">${totalCritical}</div></div>
    <div class="stat-card high">    <div class="stat-label">High</div>    <div class="stat-value">${totalHigh}</div></div>
    <div class="stat-card medium">  <div class="stat-label">Medium</div>  <div class="stat-value">${totalMedium}</div></div>
    <div class="stat-card low">     <div class="stat-label">Low</div>     <div class="stat-value">${totalLow}</div></div>
  </div>

  <div class="risk-matrix">
    <h4>Distribuição de Risco</h4>
    ${[
      { label: 'CRITICAL', count: totalCritical, color: '#e8394a' },
      { label: 'HIGH',     count: totalHigh,     color: '#e74c3c' },
      { label: 'MEDIUM',   count: totalMedium,   color: '#f5a623' },
      { label: 'LOW',      count: totalLow,      color: '#f1c40f' },
    ].map(({ label, count, color }) => `
      <div class="risk-bar-row">
        <div class="risk-bar-label" style="color:${color}">${label}</div>
        <div class="risk-bar-track">
          <div class="risk-bar-fill" style="width:${(count / maxBar) * 100}%;background:${color}"></div>
        </div>
        <div class="risk-bar-count" style="color:${color}">${count}</div>
      </div>`).join('')}
  </div>

  <div class="insights-grid">
    <div class="insight-card">
      <h4>Composição de Achados por Time</h4>
      <div class="team-chart-wrap">
        <div class="team-donut"></div>
        <div class="team-legend">
          <div class="team-legend-row">
            <div class="team-legend-left"><span class="legend-dot red"></span>Red Team</div>
            <div class="team-legend-val">${totalRed} (${redShare}%)</div>
          </div>
          <div class="team-legend-row">
            <div class="team-legend-left"><span class="legend-dot blue"></span>Blue Team</div>
            <div class="team-legend-val">${totalBlue} (${blueShare}%)</div>
          </div>
          <div class="team-legend-row">
            <div class="team-legend-left">Total de achados</div>
            <div class="team-legend-val">${totalFindings}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="insight-card">
      <h4>Impacto na Pontuação</h4>
      ${[
        { label: 'CRITICAL', points: findings.filter((finding) => finding.severity === 'CRITICAL').reduce((total, finding) => total + findingImpact(finding), 0), color: '#e8394a' },
        { label: 'HIGH', points: findings.filter((finding) => finding.severity === 'HIGH').reduce((total, finding) => total + findingImpact(finding), 0), color: '#e74c3c' },
        { label: 'MEDIUM', points: findings.filter((finding) => finding.severity === 'MEDIUM').reduce((total, finding) => total + findingImpact(finding), 0), color: '#f5a623' },
        { label: 'LOW', points: findings.filter((finding) => finding.severity === 'LOW').reduce((total, finding) => total + findingImpact(finding), 0), color: '#f1c40f' },
      ].map(({ label, points, color }) => `
        <div class="impact-row">
          <div class="impact-label" style="color:${color}">${label}</div>
          <div class="impact-track">
            <div class="impact-fill" style="width:${scoreImpact > 0 ? (points / scoreImpact) * 100 : 0}%;background:${color}"></div>
          </div>
          <div class="impact-val">-${points}</div>
        </div>`).join('')}

      <div class="metrics-grid">
        <div class="metric-pill">
          <div class="metric-pill-val">${residualRisk}</div>
          <div class="metric-pill-lbl">Risco Residual</div>
        </div>
        <div class="metric-pill">
          <div class="metric-pill-val">${meta?.portsScanned ?? 0}</div>
          <div class="metric-pill-lbl">Portas Cobertas</div>
        </div>
        <div class="metric-pill">
          <div class="metric-pill-val">${meta?.endpointsAnalyzed ?? meta?.endpointsScanned ?? 0}</div>
          <div class="metric-pill-lbl">Endpoints Analisados</div>
        </div>
        <div class="metric-pill">
          <div class="metric-pill-val">${meta?.endpointsDiscovered ?? 0}</div>
          <div class="metric-pill-lbl">Endpoints Encontrados</div>
        </div>
        <div class="metric-pill">
          <div class="metric-pill-val">${scoreImpact}</div>
          <div class="metric-pill-lbl">Impacto Ponderado</div>
        </div>
      </div>
    </div>
  </div>
  </div>

  <div class="sheet">
    <div class="methodology-section">
    <h3>⚙ Metodologia de Teste e Cobertura</h3>
    <div class="method-grid">
      <div class="method-block">
        <h4><span class="team-dot red"></span>Red Team — Inteligência de Ameaças</h4>
        <ul class="method-list">
          <li><strong>Web Fingerprinting:</strong> Enumeração de tecnologias via análise de headers HTTP, cookies e corpo de resposta. Detecção de frameworks, servidores e versões expostas.</li>
          <li><strong>CVE Lookup:</strong> Correlação das versões detectadas com o banco de dados NVD/CVE para identificação de vulnerabilidades conhecidas e exploits públicos.</li>
          <li><strong>DOM XSS:</strong> Análise estática de sinks perigosos (eval, innerHTML, document.write) combinada com execução ativa de payloads via Puppeteer com detecção de diálogos.</li>
          <li><strong>Injeções (SQLi / LFI / SSTI):</strong> Injeção de payloads nos parâmetros de formulários e query strings. Análise de resposta diferencial por tamanho e conteúdo de erro.</li>
          <li><strong>Sensitive File Discovery:</strong> Enumeração de arquivos sensíveis expostos publicamente (.env, .git/config, docker-compose.yml, phpinfo, backups).</li>
          <li><strong>Open Redirect:</strong> Verificação de redirecionamentos não validados em parâmetros de URL via análise do header Location.</li>
          <li><strong>Port Scan:</strong> Varredura TCP concorrente (50 threads). Banner grabbing para identificação de serviços e versões em execução.</li>
        </ul>
      </div>
      <div class="method-block">
        <h4><span class="team-dot blue"></span>Blue Team — Conformidade e Hardening</h4>
        <ul class="method-list">
          <li><strong>HTTP Security Headers:</strong> Análise de presença e configuração de Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Strict-Transport-Security (HSTS).</li>
          <li><strong>Cookie Security:</strong> Inspeção de flags Secure, HttpOnly e SameSite em todos os cookies de sessão retornados nas respostas HTTP.</li>
          <li><strong>CSRF Protection:</strong> Verificação de tokens anti-CSRF em formulários HTML via análise de campos hidden com padrão csrf/token/hash.</li>
          <li><strong>HTTPS Enforcement:</strong> Verificação de protocolo, validade e presença de redirecionamento HTTP→HTTPS na URL alvo.</li>
          <li><strong>Information Disclosure:</strong> Detecção de headers que revelam a stack tecnológica (X-Powered-By, Server) com versão exposta.</li>
          <li><strong>Fingerprint de Risco:</strong> Identificação de frameworks e tecnologias com histórico de vulnerabilidades (WordPress, versões antigas de PHP, etc.).</li>
          <li><strong>Port Security:</strong> Classificação de serviços expostos por risco e identificação de configurações padrão inseguras via banner grabbing.</li>
        </ul>
      </div>
    </div>

    ${meta ? `
    <div class="scan-stats">
      ${meta.portsScanned     !== undefined ? `<div class="scan-stat"><span class="scan-stat-val">${meta.portsScanned}</span><span class="scan-stat-lbl">Portas Varridas</span></div>` : ''}
      ${(meta.endpointsAnalyzed ?? meta.endpointsScanned) !== undefined ? `<div class="scan-stat"><span class="scan-stat-val">${meta.endpointsAnalyzed ?? meta.endpointsScanned}</span><span class="scan-stat-lbl">Endpoints Analisados</span></div>` : ''}
      ${meta.endpointsDiscovered !== undefined ? `<div class="scan-stat"><span class="scan-stat-val">${meta.endpointsDiscovered}</span><span class="scan-stat-lbl">Endpoints Encontrados</span></div>` : ''}
      ${meta.headersAnalyzed  !== undefined ? `<div class="scan-stat"><span class="scan-stat-val">${meta.headersAnalyzed}</span><span class="scan-stat-lbl">Headers Inspecionados</span></div>` : ''}
      ${meta.duration         !== undefined ? `<div class="scan-stat"><span class="scan-stat-val">${meta.duration}</span><span class="scan-stat-lbl">Duração Total</span></div>` : ''}
    </div>` : ''}

    ${meta?.endpointDetails && meta.endpointDetails.length > 0 ? `
    <div class="endpoint-details-section">
      <h4>Endpoints analisados e escopo por endpoint</h4>
      ${renderEndpointDetailsTable(meta.endpointDetails)}
    </div>` : ''}
  </div>
  </div>

  <div class="sheet">
    <div class="section-heading">
      <span class="team-badge red">RED TEAM</span>
      <h2>Inteligência de Ameaças e Ataque</h2>
    </div>
    <p class="section-desc">
      Achados ofensivos que representam vetores de exploração direta. CVEs identificadas, softwares desatualizados,
      serviços com vulnerabilidades conhecidas e superfícies de ataque ativas. Itens nesta seção exigem remediação prioritária.
    </p>

    <div class="sub-section">
      <div class="sub-section-header">
        <div class="sub-icon web">🌐</div>
        <h3>Web Scan — Análise de Superfície HTTP/HTTPS</h3>
      </div>
      <p class="sub-caption">Fingerprinting de tecnologias, CVE lookup, DOM XSS, injeções e descoberta de arquivos sensíveis via análise de resposta HTTP.</p>
      ${renderFindingsTable(redWebFallback, 'Nenhum vetor de ataque ou CVE identificada na superfície web durante o período de varredura.')}
    </div>

    <div class="sub-section">
      <div class="sub-section-header">
        <div class="sub-icon port">🔌</div>
        <h3>Port Scan — Análise de Superfície de Rede</h3>
      </div>
      <p class="sub-caption">Varredura TCP concorrente com banner grabbing. Identificação de serviços vulneráveis expostos à rede.</p>

      ${meta?.openPorts && meta.openPorts.length > 0 ? `
        <div class="open-ports-section">
          <h4>Portas Abertas Detectadas</h4>
          ${renderPortsTable(meta.openPorts)}
        </div>` : ''}

      ${renderFindingsTable(redPort, 'Nenhum serviço de rede com vulnerabilidade crítica identificada nas portas varridas.')}
    </div>
  </div>
  </div>

  <div class="sheet">
    <hr class="divider" style="margin-top:0; margin-bottom:28px">

    <div class="section-heading">
      <span class="team-badge blue">BLUE TEAM</span>
      <h2>Conformidade, Defesa e Hardening</h2>
    </div>
    <p class="section-desc">
      Avaliação de controles defensivos, headers HTTP, políticas de sessão e configuração de infraestrutura.
      Achados representam ausência de controles que ampliam a superfície de ataque indiretamente.
    </p>

    <div class="sub-section">
      <div class="sub-section-header">
        <div class="sub-icon web">🌐</div>
        <h3>Web Scan — Headers de Segurança e Configuração HTTP</h3>
      </div>
      <p class="sub-caption">Verificação de CSP, HSTS, X-Frame-Options, Referrer-Policy, cookie flags, CSRF e information disclosure em headers.</p>
      ${renderFindingsTable(blueWebFallback, 'Todos os controles HTTP verificados estão em conformidade com as melhores práticas (OWASP Secure Headers Project).')}
    </div>

    <div class="sub-section">
      <div class="sub-section-header">
        <div class="sub-icon port">🔌</div>
        <h3>Port Scan — Exposição de Serviços e Configuração de Rede</h3>
      </div>
      <p class="sub-caption">Análise de serviços desnecessariamente expostos, sem autenticação ou com configurações padrão inseguras.</p>
      ${renderFindingsTable(bluePort, 'Nenhuma exposição desnecessária ou configuração padrão insegura identificada nas portas analisadas.')}
    </div>
    <div class="footer">
      <div class="footer-left">
        Gerado por <strong>Sentinel-CLI</strong> · Motor: Sentinel Core v2.0<br>
        ${new Date().toISOString()}<br>
        Este relatório contém informações sensíveis de infraestrutura.
      </div>
      <div class="footer-right">
        <div class="confidential">Confidencial</div><br>
        Destinado exclusivamente para fins de<br>
        auditoria defensiva e correção de vulnerabilidades.
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
};