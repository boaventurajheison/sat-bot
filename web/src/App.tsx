// web/src/App.tsx (substitua o conteúdo atual por este)
import { useEffect, useState } from "react";

type Position = {
  symbol: string;
  positionAmt: string; // pode ser negativo para short
  entryPrice: string;
  markPrice?: string;
  unrealizedProfit?: string;
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

type Order = {
  orderId: string | number;
  symbol: string;
  side: "BUY" | "SELL";
  type: string; // e.g. TAKE_PROFIT_MARKET, STOP_MARKET, TAKE_PROFIT, LIMIT ...
  stopPrice?: string; // price used for stop or take (se existir)
  price?: string; // limite
  quantity?: string;
  status?: string;
};

const formatCurrency = (s: string | number) => {
  const n = Number(s);
  if (Number.isNaN(n)) return String(s);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
};

const safeNum = (v: string | number | undefined) => {
  if (v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

export default function App() {
  const API_BASE: string = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [account, setAccount] = useState<AccountResp | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [errorAccount, setErrorAccount] = useState<string | null>(null);

  // orders
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // UI / report
  const [period, setPeriod] = useState<string>("7d");
  const [symbol, setSymbol] = useState<string>("");
  const [report, setReport] = useState<ReportResp | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  // selected (expanded) position
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

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

  async function loadOpenOrders() {
    // Endpoint optional: /futures/open-orders
    // Se sua API retornar ordens abertas, elas deverão conter symbol, type (TAKE/STOP), stopPrice/price, etc.
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API_BASE}/futures/open-orders`);
      if (!res.ok) {
        // não tratar como erro fatal — apenas limpa ordens se endpoint não existir
        setOpenOrders([]);
        setLoadingOrders(false);
        return;
      }
      const json = await res.json();
      setOpenOrders(Array.isArray(json) ? json : []);
    } catch (e) {
      // ignore — endpoint pode não existir
      setOpenOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    loadAccount();
    loadOpenOrders();
    const id = setInterval(() => {
      loadAccount();
      loadOpenOrders();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // fetch report (substitua a função existente)
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

      // Inverter entries para mostrar as mais recentes primeiro
      const sorted = {
        ...json,
        entries: json.entries ? [...json.entries].reverse() : []
      };

      setReport(sorted);
    } catch (e: any) {
      setErrorReport(e.message || String(e));
    } finally {
      setLoadingReport(false);
    }
  }

  // cálculo de PnL estimado no preço alvo
  // posiçãoAmt: quantidade (positivo = long, negativo = short)
  // entry: preço de entrada
  // targetPrice: preço alvo (take/stop)
  function pnlAtPrice(positionAmtStr: string, entryStr: string, targetPriceStr: string) {
    const qty = safeNum(positionAmtStr);
    const entry = safeNum(entryStr);
    const target = safeNum(targetPriceStr);
    // PnL em base * preço diferença
    // Nota: para contratos inversos e ajustes por tamanho de contrato isso pode mudar,
    // mas para a maioria dos pares USDT perp, fórmula simples funciona: (target - entry) * qty
    const pnl = (target - entry) * qty;
    return pnl;
  }

  // helper para achar ordens relacionadas a um símbolo
  function ordersForSymbol(sym: string) {
    return openOrders.filter(o => o.symbol === sym);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Inter, system-ui, sans-serif",textAlign:"center", maxWidth: 1100, margin: "0 auto" }}>
      <h1>SAT Monitor — Binance Futures</h1>

      <section style={{ marginBottom: 18,textAlign:"center" }}>
        <h2>Saldo</h2>
        {loadingAccount && <div></div>}
        {errorAccount && <div style={{ color: "crimson" }}>Erro: {errorAccount}</div>}
        {account && account.ok && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
  <div style={{ display: "flex", gap: 20 }}>
    
    <div style={{ padding: 12, borderRadius: 8, background: "#111", color: "#fff", minWidth: 220 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>Saldo Total da Carteira</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {formatCurrency(account.totalWalletBalance)}
      </div>
    </div>

    <div style={{ padding: 12, borderRadius: 8, background: "#1b1b1b", color: "#fff", minWidth: 220 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>Lucro Total Não Realizado</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {formatCurrency(account.totalUnrealizedProfit)}
      </div>
    </div>

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
                  <tr style={{borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: 8, textAlign: "left" }}>Símbolo</th> 
                    <th style={{ padding: 8, textAlign: "left" }}>Qtd</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Unrealized PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {account.openPositions.filter(p => parseFloat(p.positionAmt) !== 0).map((p) => {
                    const unreal = p.unrealizedProfit ? Number(p.unrealizedProfit) : pnlAtPrice(p.positionAmt, p.entryPrice, p.markPrice || p.entryPrice);
                    const isSelected = selectedSymbol === p.symbol;
                    return (
                      <tbody key={p.symbol}>
                        <tr
                          onClick={() => setSelectedSymbol(isSelected ? null : p.symbol)}
                          style={{ cursor: "pointer", background: isSelected ? "#0f1724" : undefined }}
                        >
                          <td style={{ padding: 8 }}>{p.symbol}</td>
                          <td style={{ padding: 8, textAlign: "left" }}>{p.positionAmt}</td>
                          <td style={{ padding: 8, textAlign: "left" }}>{formatCurrency(unreal)}</td>
                        </tr>

                        {isSelected && (
                          <tr>
                            <td colSpan={7} style={{ padding: 12, textAlign: "left", background: "#071224" }}>
                              <div style={{ display: "left", gap: 20 }}>
                                <div style={{ minWidth: 280 }}>
                                  <div style={{ fontSize: 13, opacity: 0.9 }}>Detalhes da Posição</div>
                                  <div>Símbolo: <strong>{p.symbol}</strong></div>
                                  <div>Quantidade: <strong>{p.positionAmt}</strong></div>
                                  <div>Unrealized PnL atual: <strong>{formatCurrency(unreal)}</strong></div>
                                </div>

                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>Ordens relacionadas (take / stop)</div>
                                  {loadingOrders && <div>Carregando ordens...</div>}
                                  {!loadingOrders && ordersForSymbol(p.symbol).length === 0 && (
                                    <div style={{ opacity: 0.8 }}>Nenhuma ordem de take/stop encontrada para este símbolo.</div>
                                  )}

                                  {ordersForSymbol(p.symbol).map((o) => {
                                    // try to get a price: prefer stopPrice then price
                                    const target = o.stopPrice ?? o.price ?? "";
                                    const pnlEstimated = pnlAtPrice(p.positionAmt, p.entryPrice, target);
                                    return (
                                      <div key={String(o.orderId)} style={{ padding: 8, borderRadius: 8, marginBottom: 8, background: "#071a2b" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                          <div>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>{o.type}</div>
                                            <div style={{ fontSize: 12, opacity: 0.8 }}>{o.side} — qty: {o.quantity ?? "—"}</div>
                                          </div>
                                          <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 12, opacity: 0.8 }}>Preço alvo</div>
                                            <div style={{ fontWeight: 700 }}>{target ? formatCurrency(target) : "—"}</div>
                                          </div>
                                        </div>

                                        <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
                                          <div>
                                            <div style={{ fontSize: 12, opacity: 0.8 }}>PnL estimado neste preço</div>
                                            <div style={{ fontWeight: 700 }}>{formatCurrency(pnlEstimated)}</div>
                                          </div>
                                          <div>
                                            <div style={{ fontSize: 12, opacity: 0.8 }}>Status</div>
                                            <div style={{ fontWeight: 700 }}>{o.status ?? "—"}</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
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
