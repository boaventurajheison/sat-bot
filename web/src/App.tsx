// web/src/App.tsx
import { useEffect, useState } from "react";



type Position = {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice?: string;
  unrealizedProfit: string;
  leverage: string;
  liquidationPrice?: string;
};

type AccountResp = {
  ok: true;
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  openPositions: Position[];
  fetchedAt: number;
} | {
  ok: false;
  error: any;
};

type ReportRespOk = {
  ok: true;
  period: { start: number; end: number };
  totalRealized: string;
  count: number;
  avgPerEntry: string;
  percentRelativeToInitialBalance: number | null;
  entries: Array<{ symbol: string; income: string; time: number; incomeType: string }>;
};

type ReportResp = ReportRespOk | { ok: false; error: any };

const formatCurrency = (s: string | number) => {
  const n = Number(s);
  if (Number.isNaN(n)) return String(s);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
};

export default function App() {
  // web/src/App.tsx (ou onde estiver)
  const API_BASE: string = import.meta.env.VITE_API_URL || "http://localhost:3000";


  const [account, setAccount] = useState<AccountResp | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [errorAccount, setErrorAccount] = useState<string | null>(null);

  // Report state
  const [period, setPeriod] = useState<string>("7d");
  const [symbol, setSymbol] = useState<string>("");
  const [report, setReport] = useState<ReportResp | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  async function loadAccount() {
    setLoadingAccount(true);
    setErrorAccount(null);
    try {
      const res = await fetch(`${API_BASE}/futures/account`);
      const json = await res.json();
      setAccount(json);
    } catch (e: any) {
      setErrorAccount(e.message || String(e));
      setAccount(null);
    } finally {
      setLoadingAccount(false);
    }
  }

  useEffect(() => {
    loadAccount();
    const id = setInterval(loadAccount, 5000);
    return () => clearInterval(id);
  }, []);

  // fetch report
  async function fetchReport() {
    setLoadingReport(true);
    setErrorReport(null);
    setReport(null);
    try {
      const q = new URLSearchParams();
      q.set("period", period);
      if (symbol.trim()) q.set("symbol", symbol.trim().toUpperCase());
      const res = await fetch(`${API_BASE}/futures/report?${q.toString()}`);
      const json = await res.json();
      setReport(json);
    } catch (e: any) {
      setErrorReport(e.message || String(e));
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Inter, system-ui, sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <h1>SAT Monitor — Binance Futures</h1>

      <section style={{ marginBottom: 18 }}>
        <h2>Saldo</h2>
        {loadingAccount && <div>Carregando saldo...</div>}
        {errorAccount && <div style={{ color: "crimson" }}>Erro: {errorAccount}</div>}
        {account && account.ok && (
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ padding: 12, borderRadius: 8, background: "#111", color: "#fff", minWidth: 220 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Total Wallet Balance</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(account.totalWalletBalance)}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#1b1b1b", color: "#fff", minWidth: 220 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Total Unrealized Profit</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(account.totalUnrealizedProfit)}</div>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2>Posições Abertas</h2>
        {account && account.ok && (
          <>
            {account.openPositions.filter(p => parseFloat(p.positionAmt) !== 0).length === 0 ? (
              <div>Nenhuma posição aberta.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: 8 }}>Símbolo</th>
                    <th style={{ padding: 8 }}>Qtd</th>
                    <th style={{ padding: 8 }}>Entry</th>
                    <th style={{ padding: 8 }}>Mark</th>
                    
                    <th style={{ padding: 8 }}>Leverage</th>
                    <th style={{ padding: 8 }}>Liquidation</th>
                  </tr>
                </thead>
                <tbody>
                  {account.openPositions.filter(p => parseFloat(p.positionAmt) !== 0).map((p) => (
                    <tr key={p.symbol}>
                      <td style={{ padding: 8 }}>{p.symbol}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{p.positionAmt}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{p.entryPrice}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{p.markPrice}</td>
                      
                      <td style={{ padding: 8, textAlign: "right" }}>{p.leverage}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>{p.liquidationPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2>Relatório de Ganhos / Perdas</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <label>Período:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: 8 }}>
            <option value="1d">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="180d">Últimos 180 dias</option>
            <option value="365d">Últimos 365 dias</option>
          </select>

          <label style={{ marginLeft: 12 }}>Símbolo (opcional):</label>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="ORDIUSDT" style={{ padding: 8, width: 140 }} />

          <button onClick={fetchReport} style={{ padding: "8px 12px", marginLeft: 8 }}>Gerar relatório</button>
        </div>

        {loadingReport && <div>Gerando relatório...</div>}
        {errorReport && <div style={{ color: "crimson" }}>{errorReport}</div>}

        {report && report.ok && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 8, background: "#0b1320", color: "#fff" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Total Realizado</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(report.totalRealized)}</div>
              </div>

              <div style={{ padding: 10, borderRadius: 8, background: "#0b1320", color: "#fff" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Entradas</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{report.count}</div>
              </div>

              <div style={{ padding: 10, borderRadius: 8, background: "#0b1320", color: "#fff" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Média / Entrada</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(report.avgPerEntry)}</div>
              </div>

              <div style={{ padding: 10, borderRadius: 8, background: "#0b1320", color: "#fff" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Percentual vs. Saldo Inicial (estimado)</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {report.percentRelativeToInitialBalance === null ? "—" : `${report.percentRelativeToInitialBalance.toFixed(4)}%`}
                </div>
              </div>
            </div>

            <h3>Detalhes (entradas)</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                  <th style={{ padding: 8 }}>Time</th>
                  <th style={{ padding: 8 }}>Symbol</th>
                  <th style={{ padding: 8 }}>Income</th>
                  <th style={{ padding: 8 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((e) => (
                  <tr key={String(e.time) + "-" + e.symbol}>
                    <td style={{ padding: 8 }}>{new Date(e.time).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{e.symbol}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{formatCurrency(e.income)}</td>
                    <td style={{ padding: 8 }}>{e.incomeType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {report && !report.ok && <div style={{ color: "crimson" }}>Erro gerando relatório: {JSON.stringify(report.error)}</div>}
      </section>
    </div>
  );
}
