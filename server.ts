import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Upload Webhook Proxy - Using multer to capture the file
  app.post("/api/webhook/upload", upload.single('data'), async (req, res) => {
    const webhookUrl = process.env.VITE_UPLOAD_WEBHOOK;
    if (!webhookUrl) {
      return res.status(500).json({ error: "Upload webhook URL not configured" });
    }

    try {
      const { user_id } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided in field 'data'" });
      }

      console.log(`Proxying binary upload for user ${user_id} to: ${webhookUrl}`);

      // Create new FormData for the outgoing request
      const formData = new FormData();
      formData.append('user_id', user_id || '');
      
      // Convert buffer to Blob for the outgoing fetch
      const fileBlob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('data', fileBlob, file.originalname);

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
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
