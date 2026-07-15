import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const DEFAULT_VOICE = process.env.PIPER_DEFAULT_VOICE || "en_GB-alan-medium";
const DEFAULT_PIPER_BIN = process.env.PIPER_BIN || "piper";
const DEFAULT_TEXT_LIMIT = Number(process.env.TTS_TEXT_LIMIT || 500);
const DEFAULT_VOICE_PATH = process.env.PIPER_VOICE_PATH
  ? path.resolve(process.cwd(), process.env.PIPER_VOICE_PATH)
  : path.resolve(process.cwd(), "voices");
const DEFAULT_CACHE_PATH = process.env.TTS_CACHE_PATH
  ? path.resolve(process.cwd(), process.env.TTS_CACHE_PATH)
  : path.resolve(process.cwd(), "uploads", "tts-cache");
const DEFAULT_FALLBACK_SCRIPT = path.resolve(
  process.cwd(),
  "src",
  "scripts",
  "gtts_fallback.py",
);
const DEFAULT_WINDOWS_TTS_SCRIPT = path.resolve(
  process.cwd(),
  "src",
  "scripts",
  "windows_tts.ps1",
);
const SUPPORTED_VOICES = new Set([
  "en_GB-alan-low",
  "en_GB-alan-medium",
  "en_US-amy-medium",
  "en_US-ryan-high",
]);

const inflightSyntheses = new Map();

function buildVoicePaths(voice) {
  return {
    modelPath: path.join(DEFAULT_VOICE_PATH, `${voice}.onnx`),
    configPath: path.join(DEFAULT_VOICE_PATH, `${voice}.onnx.json`),
  };
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildCacheKey(text, voice) {
  return crypto
    .createHash("sha256")
    .update(`${voice}:${text.trim()}`)
    .digest("hex");
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
    });

    if (options.input) {
      child.stdin.write(options.input);
    }

    child.stdin.end();
  });
}

async function runPiper({ text, voice, outputPath }) {
  const { modelPath, configPath } = buildVoicePaths(voice);

  if (!(await fileExists(modelPath))) {
    throw new Error(
      `Piper voice model not found at ${modelPath}. Check PIPER_VOICE_PATH and deploy the ${voice}.onnx file.`,
    );
  }

  const args = ["--model", modelPath, "--output_file", outputPath];

  if (await fileExists(configPath)) {
    args.push("--config", configPath);
  }

  await runCommand(DEFAULT_PIPER_BIN, args, {
    cwd: process.cwd(),
    input: `${text.trim()}\n`,
  });
}

async function runGttsFallback({ text, outputPath }) {
  const pythonBin = process.env.PYTHON_BIN || "python";
  const fallbackScript = process.env.GTTS_FALLBACK_SCRIPT
    ? path.resolve(process.cwd(), process.env.GTTS_FALLBACK_SCRIPT)
    : DEFAULT_FALLBACK_SCRIPT;

  if (!(await fileExists(fallbackScript))) {
    throw new Error("gTTS fallback script is not available.");
  }

  await runCommand(pythonBin, [fallbackScript, outputPath], {
    cwd: process.cwd(),
    input: `${text.trim()}\n`,
  });
}

async function runWindowsTtsFallback({ text, voice, outputPath }) {
  const scriptPath = process.env.WINDOWS_TTS_SCRIPT
    ? path.resolve(process.cwd(), process.env.WINDOWS_TTS_SCRIPT)
    : DEFAULT_WINDOWS_TTS_SCRIPT;

  if (!(await fileExists(scriptPath))) {
    throw new Error("Windows TTS fallback script is not available.");
  }

  await runCommand(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-OutputPath",
      outputPath,
      "-Voice",
      voice,
      "-Text",
      text.trim(),
    ],
    {
      cwd: process.cwd(),
    },
  );
}

async function synthesizeInternal(text, voice) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Text is required for speech synthesis.");
  }

  if (!SUPPORTED_VOICES.has(voice)) {
    throw new Error(`Unsupported voice: ${voice}.`);
  }

  if (normalizedText.length > DEFAULT_TEXT_LIMIT) {
    throw new Error(`Text must be ${DEFAULT_TEXT_LIMIT} characters or fewer.`);
  }

  await ensureDirectory(DEFAULT_CACHE_PATH);

  const cacheKey = buildCacheKey(normalizedText, voice);
  const wavOutputPath = path.join(DEFAULT_CACHE_PATH, `${cacheKey}.wav`);
  const mp3OutputPath = path.join(DEFAULT_CACHE_PATH, `${cacheKey}.mp3`);

  if (await fileExists(wavOutputPath)) {
    return {
      outputPath: wavOutputPath,
      cacheHit: true,
      voice,
      engine: "piper",
      contentType: "audio/wav",
    };
  }

  if (await fileExists(mp3OutputPath)) {
    return {
      outputPath: mp3OutputPath,
      cacheHit: true,
      voice,
      engine: "gtts",
      contentType: "audio/mpeg",
    };
  }

  try {
    await runPiper({ text: normalizedText, voice, outputPath: wavOutputPath });
    return {
      outputPath: wavOutputPath,
      cacheHit: false,
      voice,
      engine: "piper",
      contentType: "audio/wav",
    };
  } catch (piperError) {
    console.error("Piper synthesis failed, attempting Windows TTS fallback:", piperError.message);

    try {
      await runWindowsTtsFallback({ text: normalizedText, voice, outputPath: wavOutputPath });
      return {
        outputPath: wavOutputPath,
        cacheHit: false,
        voice,
        engine: "windows-tts",
        contentType: "audio/wav",
      };
    } catch (windowsError) {
      console.error("Windows TTS fallback failed, attempting gTTS fallback:", windowsError.message);

      try {
      await runGttsFallback({ text: normalizedText, outputPath: mp3OutputPath });
      return {
        outputPath: mp3OutputPath,
        cacheHit: false,
        voice,
        engine: "gtts",
        contentType: "audio/mpeg",
      };
      } catch (fallbackError) {
        throw new Error(
          `TTS is temporarily unavailable. Piper error: ${piperError.message}. Windows fallback error: ${windowsError.message}. gTTS fallback error: ${fallbackError.message}`,
        );
      }
    }
  }
}

export async function synthesizeSpeech(text, voice = DEFAULT_VOICE) {
  const selectedVoice = voice || DEFAULT_VOICE;
  const cacheKey = buildCacheKey(text, selectedVoice);

  if (!inflightSyntheses.has(cacheKey)) {
    inflightSyntheses.set(
      cacheKey,
      synthesizeInternal(text, selectedVoice).finally(() => {
        inflightSyntheses.delete(cacheKey);
      }),
    );
  }

  return inflightSyntheses.get(cacheKey);
}

export function getTtsConfig() {
  return {
    defaultVoice: DEFAULT_VOICE,
    supportedVoices: [...SUPPORTED_VOICES],
    voicePath: DEFAULT_VOICE_PATH,
    cachePath: DEFAULT_CACHE_PATH,
    textLimit: DEFAULT_TEXT_LIMIT,
  };
}
