import path from "path";
import { synthesizeSpeech } from "../service/tts.service.js";

const dailyUsage = new Map();

function getDailyLimit() {
  return Number(process.env.DAILY_TTS_LIMIT || 50);
}

function getClientKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return (ip || req.ip || "unknown").toString();
}

function incrementUsage(clientKey) {
  const today = new Date().toISOString().slice(0, 10);
  const record = dailyUsage.get(clientKey);

  if (!record || record.date !== today) {
    dailyUsage.set(clientKey, { date: today, count: 1 });
    return 1;
  }

  record.count += 1;
  return record.count;
}

export async function synthesizeTtsController(req, res) {
  try {
    const { text, voice } = req.body ?? {};

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "text is required and must be a non-empty string." });
    }

    const usageCount = incrementUsage(getClientKey(req));
    const dailyLimit = getDailyLimit();

    if (usageCount > dailyLimit) {
      return res.status(429).json({
        message: `Daily TTS limit reached. You can make up to ${dailyLimit} requests per day.`,
      });
    }

    const result = await synthesizeSpeech(text, voice);

    res.setHeader("Content-Type", result.contentType || "audio/wav");
    res.setHeader("X-TTS-Cache", result.cacheHit ? "HIT" : "MISS");
    res.setHeader("X-TTS-Engine", result.engine || "piper");
    res.setHeader("X-TTS-Voice", result.voice);

    return res.sendFile(path.resolve(result.outputPath));
  } catch (error) {
    console.error("Error synthesizing TTS audio:", error);
    return res.status(500).json({ message: error.message || "TTS request failed." });
  }
}
