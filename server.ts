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

  // API Route: Translation powered by Gemini API
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, sourceLang, targetLang, tone } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Testo mancante" });
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
