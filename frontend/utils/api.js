(function attachJohnsApi(global) {
  // BASE_URL is provided by shared/config.js loaded before this script
  const DEFAULT_VOICE = "en_GB-alan-medium";

  async function speakText(text, voice = DEFAULT_VOICE) {
    const response = await fetch(`${BASE_URL}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.message || "Voice playback is unavailable right now.");
      }

      throw new Error("Voice playback is unavailable right now.");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      audioUrl,
      contentType,
      cacheStatus: response.headers.get("x-tts-cache") || "MISS",
      engine: response.headers.get("x-tts-engine") || "piper",
      revoke() {
        URL.revokeObjectURL(audioUrl);
      },
    };
  }

  global.JohnsApi = {
    BASE_URL,
    DEFAULT_VOICE,
    speakText,
  };
})(window);
