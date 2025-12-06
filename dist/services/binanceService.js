"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFuturesAccount = getFuturesAccount;
exports.getFuturesPositionRisk = getFuturesPositionRisk;
exports.testFuturesConnection = testFuturesConnection;
// src/services/binanceService.ts
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("../utils/crypto");
/** Binance Futures (USDT-M) base URL */
const BASE_FAPI = "https://fapi.binance.com";
function sign(queryString, secret) {
    return crypto_1.default.createHmac("sha256", secret).update(queryString).digest("hex");
}
function makeClient(apiKey) {
    return axios_1.default.create({
        baseURL: BASE_FAPI,
        timeout: 10000,
        headers: {
            "X-MBX-APIKEY": apiKey,
        },
    });
}
async function getFuturesAccount(encApiKey, encApiSecret) {
    const apiKey = (0, crypto_2.decrypt)(encApiKey);
    const apiSecret = (0, crypto_2.decrypt)(encApiSecret);
    const client = makeClient(apiKey);
    const ts = Date.now();
    const recvWindow = 60000; // 5 segundos de tolerância
    const qs = `timestamp=${ts}&recvWindow=${recvWindow}`;
    const signature = sign(qs, apiSecret);
    const url = `/fapi/v2/account?${qs}&signature=${signature}`;
    const resp = await client.get(url);
    return resp.data;
}
async function getFuturesPositionRisk(encApiKey, encApiSecret, symbol) {
    const apiKey = (0, crypto_2.decrypt)(encApiKey);
    const apiSecret = (0, crypto_2.decrypt)(encApiSecret);
    const client = makeClient(apiKey);
    const ts = Date.now();
    const recvWindow = 60000;
    let qs = `timestamp=${ts}&recvWindow=${recvWindow}`;
    if (symbol)
        qs += `&symbol=${encodeURIComponent(symbol)}`;
    const signature = sign(qs, apiSecret);
    const url = `/fapi/v2/positionRisk?${qs}&signature=${signature}`;
    const resp = await client.get(url);
    return resp.data;
}
async function testFuturesConnection(encApiKey, encApiSecret) {
    try {
        const data = await getFuturesAccount(encApiKey, encApiSecret);
        return { ok: true, data };
    }
    catch (err) {
        const msg = err?.response?.data || err?.message || String(err);
        return { ok: false, error: msg };
    }
}
