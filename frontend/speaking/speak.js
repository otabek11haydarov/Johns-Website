const audioButton = document.getElementById("audioButton");
const speakTextInput = document.getElementById("speakTextInput");
const loadingStatus = document.getElementById("loadingStatus");

// Ensure BASE_URL is correct for the backend
const API_URL = window.BASE_URL || "http://127.0.0.1:5000";

let currentAudio = null;

audioButton?.addEventListener("click", async () => {
  const text = speakTextInput.value.trim();
  
  if (!text) {
    alert("Iltimos, o'qilishi kerak bo'lgan matnni kiriting!");
    speakTextInput.focus();
    return;
  }

  // If already playing, stop it
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    audioButton.classList.remove("playing");
    audioButton.innerHTML = '<span class="icon">🎙️</span> Tinglash';
    return;
  }

  try {
    // UI State: Loading
    audioButton.disabled = true;
    audioButton.innerHTML = "Ovoz tayyorlanmoqda...";
    loadingStatus.style.display = "flex";

    const response = await fetch(`${API_URL}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, voice: "en_US-lessac-medium" }) // default Piper voice
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "TTS API xatosi yuz berdi");
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    currentAudio = new Audio(audioUrl);
    
    // UI State: Playing
    audioButton.disabled = false;
    audioButton.classList.add("playing");
    audioButton.innerHTML = '<span class="icon">🔊</span> O\'qilmoqda...';
    loadingStatus.style.display = "none";

    currentAudio.play();

    currentAudio.onended = () => {
      audioButton.classList.remove("playing");
      audioButton.innerHTML = '<span class="icon">🎙️</span> Tinglash';
      currentAudio = null;
      URL.revokeObjectURL(audioUrl);
    };

    currentAudio.onerror = () => {
      throw new Error("Audio faylni o'qishda xatolik yuz berdi.");
    };

  } catch (error) {
    console.error("TTS Xatosi:", error);
    alert("Xatolik: " + error.message);
    audioButton.disabled = false;
    audioButton.classList.remove("playing");
    audioButton.innerHTML = '<span class="icon">🎙️</span> Tinglash';
    loadingStatus.style.display = "none";
  }
});
