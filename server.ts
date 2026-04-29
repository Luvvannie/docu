import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Upload Webhook Proxy
  app.post("/api/webhook/upload", async (req, res) => {
    const webhookUrl = process.env.VITE_UPLOAD_WEBHOOK;
    if (!webhookUrl) {
      return res.status(500).json({ error: "Upload webhook URL not configured" });
    }

    try {
      console.log(`Proxying upload to: ${webhookUrl}`);
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error) {
      console.error("Proxy Upload Error:", error);
      res.status(500).json({ error: "Failed to reach upload webhook", details: String(error) });
    }
  });

  // API Route for Chat Webhook Proxy
  app.post("/api/webhook/chat", async (req, res) => {
    const webhookUrl = process.env.VITE_CHAT_WEBHOOK;
    if (!webhookUrl) {
      return res.status(500).json({ error: "Chat webhook URL not configured" });
    }

    try {
      console.log(`Proxying chat to: ${webhookUrl}`);
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error) {
      console.error("Proxy Chat Error:", error);
      res.status(500).json({ error: "Failed to reach chat webhook", details: String(error) });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
