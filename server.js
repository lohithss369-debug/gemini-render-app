import express from "express";
import compression from "compression";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(compression());
app.use(express.json());

// Login route
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.APP_PASSWORD) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: "Invalid password" });
});

// Serve login page as default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use(express.static("public"));

// Proxy route for Gemini
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, password } = req.body;
    if (password !== process.env.APP_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "(no reply)";
    res.json({ reply: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
