/**
 * Oxford Dictionary & Fallback Dictionary Service
 * Johns LMS — Smart Flashcard Builder
 */

export async function fetchWordDefinition(word) {
  const cleanWord = (word || "").trim().toLowerCase();

  if (!cleanWord) {
    return createEmptyFallback(word);
  }

  const appId = process.env.OXFORD_APP_ID;
  const appKey = process.env.OXFORD_APP_KEY;

  // 1. Try Oxford Dictionary API if credentials exist
  if (appId && appKey) {
    try {
      const url = `https://od-api.oxforddictionaries.com/api/v2/entries/en-gb/${encodeURIComponent(cleanWord)}`;
      const response = await fetch(url, {
        headers: {
          app_id: appId,
          app_key: appKey,
          Accept: "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = parseOxfordData(data, word);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn(`[Oxford API] Failed for word '${cleanWord}':`, err.message);
    }
  }

  // 2. Fallback to Free Dictionary API
  try {
    const freeUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
    const freeResponse = await fetch(freeUrl);

    if (freeResponse.ok) {
      const freeData = await freeResponse.json();
      const parsedFree = parseFreeDictionaryData(freeData, word);
      if (parsedFree) return parsedFree;
    }
  } catch (err) {
    console.warn(`[Free Dictionary API] Failed for word '${cleanWord}':`, err.message);
  }

  // 3. Graceful Fallback if word was not found anywhere
  return createEmptyFallback(word);
}

function parseOxfordData(data, originalWord) {
  try {
    const results = data.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    const firstResult = results[0];
    const firstLexicalEntry = firstResult?.lexicalEntries?.[0];
    if (!firstLexicalEntry) return null;

    const partOfSpeech = (firstLexicalEntry.lexicalCategory?.text || "").toLowerCase();
    
    // Pronunciation extraction across lexical entry or root pronunciations
    let pronunciation = "";
    const pronunciations = firstLexicalEntry.pronunciations || 
                          firstLexicalEntry.entries?.[0]?.pronunciations || 
                          firstResult.pronunciations;
    if (Array.isArray(pronunciations) && pronunciations.length > 0) {
      const sp = pronunciations.find(p => p.phoneticSpelling)?.phoneticSpelling || pronunciations[0]?.phoneticSpelling;
      if (sp) pronunciation = `/${sp}/`;
    }

    // Definition extraction
    let definition = "";
    const firstEntry = firstLexicalEntry.entries?.[0];
    if (firstEntry && Array.isArray(firstEntry.senses) && firstEntry.senses.length > 0) {
      const firstSense = firstEntry.senses[0];
      definition = firstSense.definitions?.[0] || firstSense.shortDefinitions?.[0] || "";
    }

    if (!definition) {
      definition = findFirstDefinition(data);
    }

    if (!definition) return null;

    // Traverse complete response tree for example sentence (Priority: sense.examples -> subsense.examples -> nested)
    const exampleSentence = extractFirstExampleSentence(data);

    const parsedResult = {
      word: originalWord,
      pronunciation,
      partOfSpeech,
      definition,
      exampleSentence: exampleSentence || null,
      example: exampleSentence || "",
      found: true,
      warning: false,
      noExampleProvided: !exampleSentence
    };

    console.log(`[Oxford Parser] Parsed '${originalWord}':`, {
      word: parsedResult.word,
      pronunciation: parsedResult.pronunciation,
      partOfSpeech: parsedResult.partOfSpeech,
      definition: parsedResult.definition,
      exampleSentence: parsedResult.exampleSentence
    });

    return parsedResult;
  } catch (err) {
    console.error(`[Oxford Parser] Error parsing '${originalWord}':`, err);
    return null;
  }
}

/**
 * Traverses complete response tree: results -> lexicalEntries -> entries -> senses -> subsenses -> examples
 */
function extractFirstExampleSentence(data) {
  if (!data || !Array.isArray(data.results)) return null;

  for (const result of data.results) {
    if (!Array.isArray(result.lexicalEntries)) continue;

    for (const lexicalEntry of result.lexicalEntries) {
      if (!Array.isArray(lexicalEntry.entries)) continue;

      for (const entry of lexicalEntry.entries) {
        if (!Array.isArray(entry.senses)) continue;

        // Priority 1: sense.examples
        for (const sense of entry.senses) {
          if (Array.isArray(sense.examples) && sense.examples.length > 0) {
            const text = extractExampleText(sense.examples[0]);
            if (text) return text;
          }
        }

        // Priority 2: subsense.examples
        for (const sense of entry.senses) {
          if (Array.isArray(sense.subsenses)) {
            for (const subsense of sense.subsenses) {
              if (Array.isArray(subsense.examples) && subsense.examples.length > 0) {
                const text = extractExampleText(subsense.examples[0]);
                if (text) return text;
              }
            }
          }
        }

        // Priority 3: Deep search any nested example objects
        for (const sense of entry.senses) {
          const nested = findNestedKey(sense, "examples");
          if (nested) return nested;
        }
      }
    }
  }

  return null;
}

function findFirstDefinition(data) {
  if (!data || !Array.isArray(data.results)) return "";
  for (const r of data.results) {
    if (!Array.isArray(r.lexicalEntries)) continue;
    for (const le of r.lexicalEntries) {
      if (!Array.isArray(le.entries)) continue;
      for (const e of le.entries) {
        if (!Array.isArray(e.senses)) continue;
        for (const s of e.senses) {
          if (Array.isArray(s.definitions) && s.definitions.length > 0) return s.definitions[0];
          if (Array.isArray(s.shortDefinitions) && s.shortDefinitions.length > 0) return s.shortDefinitions[0];
        }
      }
    }
  }
  return "";
}

function extractExampleText(exampleObj) {
  if (!exampleObj) return null;
  if (typeof exampleObj === "string") return exampleObj.trim();
  if (typeof exampleObj === "object" && exampleObj.text) {
    return String(exampleObj.text).trim();
  }
  return null;
}

function findNestedKey(obj, targetKey) {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const res = findNestedKey(item, targetKey);
      if (res) return res;
    }
    return null;
  }

  for (const key of Object.keys(obj)) {
    if (key === targetKey && Array.isArray(obj[key])) {
      for (const item of obj[key]) {
        const text = extractExampleText(item);
        if (text) return text;
      }
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      const res = findNestedKey(obj[key], targetKey);
      if (res) return res;
    }
  }

  return null;
}

function parseFreeDictionaryData(data, originalWord) {
  try {
    if (!Array.isArray(data) || !data.length) return null;
    const item = data[0];
    const meaning = item.meanings?.[0];
    const defObj = meaning?.definitions?.[0];

    const word = originalWord;
    const definition = defObj?.definition || "";
    const exampleSentence = extractFreeDictionaryExample(data);
    const pronunciation = item.phonetics?.find(p => p.text)?.text || item.phonetic || "";
    const partOfSpeech = (meaning?.partOfSpeech || "").toLowerCase();

    if (!definition) return null;

    const parsedResult = {
      word,
      definition,
      exampleSentence: exampleSentence || null,
      example: exampleSentence || "",
      pronunciation,
      partOfSpeech,
      found: true,
      warning: false,
      noExampleProvided: !exampleSentence
    };

    console.log(`[FreeDict Parser] Parsed '${originalWord}':`, {
      word: parsedResult.word,
      pronunciation: parsedResult.pronunciation,
      partOfSpeech: parsedResult.partOfSpeech,
      definition: parsedResult.definition,
      exampleSentence: parsedResult.exampleSentence
    });

    return parsedResult;
  } catch (err) {
    return null;
  }
}

function extractFreeDictionaryExample(data) {
  if (!Array.isArray(data)) return null;

  for (const item of data) {
    if (!Array.isArray(item.meanings)) continue;
    for (const meaning of item.meanings) {
      if (!Array.isArray(meaning.definitions)) continue;
      for (const defObj of meaning.definitions) {
        if (defObj.example && typeof defObj.example === "string" && defObj.example.trim()) {
          return defObj.example.trim();
        }
        if (Array.isArray(defObj.examples) && defObj.examples.length > 0) {
          const exText = extractExampleText(defObj.examples[0]);
          if (exText) return exText;
        }
      }
    }
  }
  return null;
}

function createEmptyFallback(word) {
  return {
    word: word || "",
    definition: "No definition found.",
    exampleSentence: null,
    example: "",
    pronunciation: "",
    partOfSpeech: "",
    found: false,
    warning: true,
    noExampleProvided: true
  };
}

