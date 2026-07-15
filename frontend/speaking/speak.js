const audioButton = document.getElementById("audioButton");
const audioPrompt = document.getElementById("speakingPrompt");
const audioStatus = document.getElementById("audioStatus");

let currentAudio = null;
let currentAudioUrl = null;

function updateButtonState(label, disabled = false) {
  if (!audioButton) {
    return;
  }

  audioButton.textContent = label;
  audioButton.disabled = disabled;
}

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  updateButtonState("Play prompt");
}

async function playPromptAudio() {
  if (!audioButton || !audioPrompt || !audioStatus) {
    return;
  }

  if (!window.JohnsApi?.speakText) {
    audioStatus.textContent = "Backend audio xizmati ulanmagan.";
    return;
  }

  const text = audioPrompt.textContent?.trim();

  if (!text) {
    audioStatus.textContent = "Prompt text topilmadi.";
    return;
  }

  if (currentAudio) {
    stopSpeaking();
    audioStatus.textContent = "Playback stopped.";
    return;
  }

  updateButtonState("Preparing audio...", true);
  audioStatus.textContent = "Server is generating audio...";

  try {
    const result = await window.JohnsApi.speakText(text);
    currentAudioUrl = result.audioUrl;
    currentAudio = new Audio(result.audioUrl);

    currentAudio.addEventListener("ended", () => {
      stopSpeaking();
      audioStatus.textContent = "Playback finished.";
    });

    currentAudio.addEventListener("error", () => {
      stopSpeaking();
      audioStatus.textContent = "Audio could not be played.";
    });

    await currentAudio.play();
    updateButtonState("Stop audio");
    audioStatus.textContent =
      result.engine === "piper"
        ? "Playing backend Piper audio."
        : result.engine === "windows-tts"
          ? "Playing backend Windows TTS audio."
          : "Playing backend fallback audio.";
    audioButton.disabled = false;
  } catch (error) {
    stopSpeaking();
    audioStatus.textContent = error.message || "Backend audio generation failed.";
  }
}

audioButton?.addEventListener("click", playPromptAudio);

window.addEventListener("beforeunload", stopSpeaking);
