import { fetchWordDefinition } from "../service/oxfordDictionaryService.js";

/**
 * Concurrency Limiter Pool (Max 5 simultaneous API calls)
 */
async function asyncPool(concurrencyLimit, items, asyncFn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => asyncFn(item));
    results.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean, clean);

    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

export async function bulkLookupWords(req, res, next) {
  try {
    const { words } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: "Word list is required." });
    }

    // Sanitize and deduplicate word list while preserving original case
    const sanitizedWords = [];
    const seen = new Set();

    for (const rawWord of words) {
      if (typeof rawWord !== "string") continue;
      // Strip leading digits/numbering like "1. ", "2) " etc.
      const clean = rawWord.trim().replace(/^[0-9]+[\.\)]\s*/, "").replace(/^[^\w\s]+|[^\w\s]+$/g, "").trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        sanitizedWords.push(clean);
      }
    }

    if (sanitizedWords.length === 0) {
      return res.status(400).json({ error: "No valid words provided after sanitization." });
    }

    // Process with max 5 concurrent requests
    const CONCURRENCY_LIMIT = 5;
    const results = await asyncPool(CONCURRENCY_LIMIT, sanitizedWords, (word) =>
      fetchWordDefinition(word)
    );

    const generated = results.filter((r) => r.found).length;
    const failed = results.filter((r) => !r.found).length;

    res.json({
      total: sanitizedWords.length,
      generated,
      failed,
      cards: results
    });
  } catch (error) {
    next(error);
  }
}
