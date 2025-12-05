// src/services/binanceService.ts
import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { decrypt } from "../utils/crypto";

/** Binance Futures (USDT-M) base URL */
const BASE_FAPI = "https://fapi.binance.com";

function sign(queryString: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

function makeClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_FAPI,
    timeout: 10_000,
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  });
}

export async function getFuturesAccount(encApiKey: string, encApiSecret: string) {
  const apiKey = decrypt(encApiKey);
  const apiSecret = decrypt(encApiSecret);

  const client = makeClient(apiKey);

  const ts = Date.now();
  const recvWindow = 60000; // 5 segundos de tolerância
  const qs = `timestamp=${ts}&recvWindow=${recvWindow}`;


  const signature = sign(qs, apiSecret);
  const url = `/fapi/v2/account?${qs}&signature=${signature}`;

  const resp = await client.get(url);
  return resp.data;
}

export async function getFuturesPositionRisk(encApiKey: string, encApiSecret: string, symbol?: string) {
  const apiKey = decrypt(encApiKey);
  const apiSecret = decrypt(encApiSecret);

  const client = makeClient(apiKey);

  const ts = Date.now();
  const recvWindow = 60000;
  let qs = `timestamp=${ts}&recvWindow=${recvWindow}`;
  if (symbol) qs += `&symbol=${encodeURIComponent(symbol)}`;

  const signature = sign(qs, apiSecret);
  const url = `/fapi/v2/positionRisk?${qs}&signature=${signature}`;

  const resp = await client.get(url);
  return resp.data;
}

export async function testFuturesConnection(encApiKey: string, encApiSecret: string) {
  try {
    const data = await getFuturesAccount(encApiKey, encApiSecret);
    return { ok: true, data };
  } catch (err: any) {
    const msg = err?.response?.data || err?.message || String(err);
    return { ok: false, error: msg };
  }
}
