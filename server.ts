import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Simple in-memory rate limit for the translate route: max 20 requests per IP per minute
  const RATE_WINDOW_MS = 60_000;
  const RATE_MAX = 20;
  const hits = new Map<string, { count: number; start: number }>();
  const rateLimited = (ip: string) => {
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now - entry.start > RATE_WINDOW_MS) {
      hits.set(ip, { count: 1, start: now });
      return false;
    }
    entry.count += 1;
    return entry.count > RATE_MAX;
  };

  const MAX_TEXT_LENGTH = 5000;
  const ALLOWED_LANGS = new Set(["auto", "it", "en", "es", "fr", "de", "pt", "ru", "zh", "ja", "ko", "ar", "nl", "pl", "sv", "tr", "el"]);

  // API Route: Translation powered by Gemini API
  app.post("/api/translate", async (req, res) => {
    try {
      if (rateLimited(req.ip || "unknown")) {
        return res.status(429).json({ error: "Troppe richieste, riprova tra un minuto" });
      }

      const { text, sourceLang, targetLang, tone } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Testo mancante" });
      }
      if (text.length > MAX_TEXT_LENGTH) {
        return res.status(413).json({ error: `Testo troppo lungo (max ${MAX_TEXT_LENGTH} caratteri)` });
      }
      if (!ALLOWED_LANGS.has(sourceLang) || !ALLOWED_LANGS.has(targetLang) || targetLang === "auto") {
        return res.status(400).json({ error: "Lingua non valida" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY non configurata" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Sei un traduttore professionista madrelingua. 
Traduci il seguente testo.
Lingua Origine: ${sourceLang === "auto" ? "Rileva automaticamente" : sourceLang}
Lingua Destinazione: ${targetLang}
Tono di voce richiesto: ${tone || "Naturale/Standard"}

Testo da tradurre:
"""
${text}
"""

Fornisci unicamente la traduzione finale senza commenti, introduzioni o virgolette aggiuntive.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const translation = response.text?.trim() || text;
      res.json({ translation });
    } catch (error: any) {
      console.error("Errore nella traduzione Gemini API:", error);
      res.status(500).json({ error: "Errore durante la traduzione con IA" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware in development vs Static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
