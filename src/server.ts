// src/server.ts
import express, { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || "https://strivora.com.br")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// usar array no cors
if (process.env.NODE_ENV === "production") {
  app.use(
    cors({
      origin: (origin, callback) => {
        // permitir requisições sem origin (ex: curl, mobile apps)
        if (!origin) return callback(null, true);
        if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
      },
    })
  );
} else {
  app.use(cors());
}


const PORT = Number(process.env.PORT || 3000);

const API_KEY = process.env.BINANCE_API_KEY || "";
const API_SECRET = process.env.BINANCE_API_SECRET || "";
const USE_TESTNET =
  (process.env.BINANCE_FUTURES_TESTNET || "false").toLowerCase() === "true";

// Base URL da Binance Futures (USD-M)
const BASE = USE_TESTNET ? "https://testnet.binancefuture.com" : "https://fapi.binance.com";

if (!API_KEY || !API_SECRET) {
  console.warn("⚠️  BINANCE_API_KEY ou BINANCE_API_SECRET não configurados no .env!");
}

// === Time sync (evita problemas de timestamp/signature) ===
let timeOffset = 0; // serverTime - localNow (ms)

async function syncServerTime() {
  try {
    const resp = await axios.get(`${BASE}/fapi/v1/time`, { timeout: 5000 });
    const serverTime = resp.data?.serverTime;
    if (typeof serverTime === "number") {
      timeOffset = serverTime - Date.now();
      console.log(
        `⏱️  Time sync OK — offset: ${timeOffset} ms (server: ${serverTime}, local: ${Date.now()})`
      );
    } else {
      console.warn("⚠️  Não foi possível obter serverTime da Binance — mantendo offset = 0");
    }
  } catch (e: any) {
    console.warn("⚠️  Falha ao sincronizar tempo com Binance:", e.message || e);
  }
}

// Função para assinar querys com HMAC-SHA256 (usa timeOffset)
function signQuery(params: Record<string, any> = {}) {
  const timestamp = Date.now() + timeOffset;
  const qsObj = { ...params, timestamp, recvWindow: 5000 }; // recvWindow para tolerância
  const qs = new URLSearchParams(
    Object.entries(qsObj).reduce((acc: any, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {})
  ).toString();

  const signature = crypto.createHmac("sha256", API_SECRET).update(qs).digest("hex");
  return qs + `&signature=${signature}`;
}

// Cliente Axios autenticado para Futures
function axiosAuth() {
  return axios.create({
    baseURL: BASE,
    headers: { "X-MBX-APIKEY": API_KEY },
    timeout: 7000,
  });
}

// Rota raiz informativa
app.get("/", (_req: Request, res: Response) => {
  res.send(`
    <h3>SAT Monitor - Binance Futures</h3>
    <ul>
      <li><a href="/futures/account">/futures/account</a> - saldo e posições (GET)</li>
      <li><a href="/futures/report">/futures/report?period=7d</a> - relatório realized PnL (GET)</li>
    </ul>
  `);
});

/**
 * GET /futures/account
 * optional query: ?symbol=ORDIUSDT  (retorna só essa posição, se existir)
 */
app.get("/futures/account", async (req: Request, res: Response) => {
  if (!API_KEY || !API_SECRET) {
    return res.status(400).json({
      ok: false,
      error: "BINANCE_API_KEY / BINANCE_API_SECRET não configurados no arquivo .env.",
    });
  }

  try {
    const client = axiosAuth();
    const requestedSymbol = (req.query.symbol as string | undefined)?.toUpperCase();

    // 1) Account summary (totalWalletBalance, totalUnrealizedProfit)
    const qsAccount = signQuery();
    const accountResp = await client.get(`/fapi/v2/account?${qsAccount}`);
    const account = accountResp.data;

    // 2) Position risk (lista todas as posições; filtramos as abertas)
    const qsPos = signQuery();
    const posResp = await client.get(`/fapi/v2/positionRisk?${qsPos}`);
    const positions = Array.isArray(posResp.data) ? posResp.data : [];

    // Filtrar posições abertas (positionAmt !== 0) e, se solicitado, por símbolo
    const openPositions = positions
      .filter((p: any) => {
        const amt = parseFloat(p.positionAmt);
        return !isNaN(amt) && amt !== 0;
      })
      .filter((p: any) => (requestedSymbol ? p.symbol === requestedSymbol : true))
      .map((p: any) => ({
        symbol: p.symbol,
        positionAmt: p.positionAmt, // string: positivo = long, negativo = short
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        unrealizedProfit: p.unrealizedProfit,
        leverage: p.leverage,
        liquidationPrice: p.liquidationPrice,
      }));

    return res.json({
      ok: true,
      totalWalletBalance: account.totalWalletBalance,
      totalUnrealizedProfit: account.totalUnrealizedProfit,
      openPositions,
      fetchedAt: Date.now(),
    });
  } catch (err: any) {
    const status = err.response?.status || 500;
    const data = err.response?.data || err.message || "Erro desconhecido";
    console.warn("Erro /futures/account:", data);
    return res.status(status).json({ ok: false, error: data });
  }
});

/**
 * GET /futures/report
 * Query params:
 *  - period: optional string ("1d", "7d", "30d") OR
 *  - start: optional unix ms timestamp
 *  - end: optional unix ms timestamp
 *  - symbol: optional symbol like ORDIUSDT
 *
 * Response:
 * {
 *   ok: true,
 *   period: { start: number, end: number },
 *   totalRealized: string,
 *   count: number,
 *   avgPerEntry: string,
 *   percentRelativeToInitialBalance: number | null,
 *   entries: [ { symbol, income, time, incomeType } ... ]
 * }
 */
app.get("/futures/report", async (req: Request, res: Response) => {
  if (!API_KEY || !API_SECRET) {
    return res.status(400).json({ ok: false, error: "API keys não configuradas." });
  }

  try {
    // parse period or start/end
    const { period, symbol } = req.query as Record<string, string | undefined>;
    const now = Date.now() + timeOffset;
    let startTime = Number(req.query.start) || 0;
    let endTime = Number(req.query.end) || 0;

    if (!startTime || !endTime) {
      // support simple period strings
      const p = (period || "7d").toLowerCase();
      const map: Record<string, number> = {
        "1d": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
        "180d": 180 * 24 * 60 * 60 * 1000,
        "365d": 365 * 24 * 60 * 60 * 1000,
      };
      const ms = (map[p] !== undefined ? map[p] : (parseInt(p) || map["7d"]));

      endTime = now;
      startTime = now - ms;
    }

    // prepare query for /fapi/v1/income
    const qsParams: Record<string, any> = {
      incomeType: "REALIZED_PNL",
      startTime,
      endTime,
      limit: 1000,
    };
    if (symbol) qsParams.symbol = symbol;

    const qs = signQuery(qsParams);
    const client = axiosAuth();

    // fetch income entries (realized PnL)
    const incomeResp = await client.get(`/fapi/v1/income?${qs}`);
    const entries = Array.isArray(incomeResp.data) ? incomeResp.data : [];

    // aggregate
    let totalRealized = 0;
    entries.forEach((e: any) => {
      const val = parseFloat((e.income ?? "0").toString());
      if (!isNaN(val)) totalRealized += val;
    });

    // get current account to estimate initial balance
    // NOTE: initialBalanceEstimate = currentWalletBalance - totalRealized (assuming realized occurred in period)
    const qsAccount = signQuery();
    const accountResp = await client.get(`/fapi/v2/account?${qsAccount}`);
    const account = accountResp.data;
    const currentWallet = parseFloat(account.totalWalletBalance || "0");
    const initialBalanceEstimate = currentWallet - totalRealized;

    const percentRelative =
      initialBalanceEstimate !== 0 ? (totalRealized / initialBalanceEstimate) * 100 : null;

    const count = entries.length;
    const avgPerEntry = count > 0 ? totalRealized / count : 0;

    return res.json({
      ok: true,
      period: { start: Number(startTime), end: Number(endTime) },
      totalRealized: totalRealized.toString(),
      count,
      avgPerEntry: avgPerEntry.toString(),
      percentRelativeToInitialBalance:
        percentRelative === null ? null : Number(percentRelative.toFixed(6)),
      entries, // raw entries (time, symbol, income, incomeType)
      fetchedAt: Date.now(),
    });
  } catch (err: any) {
    const status = err.response?.status || 500;
    const data = err.response?.data || err.message || "Erro desconhecido";
    console.warn("Erro /futures/report:", data);
    return res.status(status).json({ ok: false, error: data });
  }
});

// Inicia servidor somente após tentar sincronizar o tempo com a Binance
(async () => {
  await syncServerTime();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em port ${PORT}`);
    console.log(`🔗 Binance Futures Base URL: ${BASE}`);

  });
})();
