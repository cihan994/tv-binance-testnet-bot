import express from "express";
import axios from "axios";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Çevre değişkenleri (Render Environment Variables'tan geliyor)
const BINANCE_KEY = process.env.BINANCE_KEY;
const BINANCE_SECRET = process.env.BINANCE_SECRET;

// HEALTH CHECK için GET /
app.get("/", (req, res) => {
  res.status(200).send("Binance Testnet webhook endpoint ayakta.");
});

// TradingView webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    console.log("TradingView body:", body);

    const { symbol, side, type, quantity } = body;

    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({ error: "Eksik alan var" });
    }

    const timestamp = Date.now().toString();

    const params = new URLSearchParams({
      symbol,
      side: side.toUpperCase(),
      type,
      quantity: quantity.toString(),
      timestamp,
    });

    const signature = crypto
      .createHmac("sha256", BINANCE_SECRET)
      .update(params.toString())
      .digest("hex");

    params.append("signature", signature);

    const url =
      "https://testnet.binancefuture.com/fapi/v1/order?" + params.toString();

    const binanceRes = await axios.post(url, null, {
      headers: {
        "X-MBX-APIKEY": BINANCE_KEY,
      },
    });

    console.log("Binance cevabı:", binanceRes.data);

    return res.json({
      ok: true,
      binance: binanceRes.data,
    });
  } catch (err) {
    console.error("Hata:", err.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: err.response?.data || err.message,
    });
  }
});

// Render'da PORT env var'ını mutlaka kullan
const port = process.env.PORT || 10000;

app.listen(port, "0.0.0.0", () => {
  console.log("Sunucu ayakta, port:", port);
});
