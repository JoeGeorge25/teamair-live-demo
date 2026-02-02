import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  try {
    // --- CORS (allow Buildy + your site)
    const origin = req.headers.origin || "";
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel env vars" });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Token validity windows
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();      // 30 min
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString(); // 1 min to connect

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: "v1alpha" },
        liveConnectConstraints: {
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            responseModalities: ["AUDIO"],
            temperature: 0.4
          }
        }
      }
    });

    // token.name is what client uses
    return res.status(200).json({ token: token.name });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
