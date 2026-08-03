const audioButton = document.getElementById("audioButton");
const speakTextInput = document.getElementById("speakTextInput");
const loadingStatus = document.getElementById("loadingStatus");

// Ensure BASE_URL is correct for the backend
const API_URL = window.BASE_URL || "http://127.0.0.1:5000";

let currentAudio = null;

// ── Load Speaking Task data from Backend ──
const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get("lessonId");
const taskId = urlParams.get("taskId");

async function loadSpeakingData() {
  if (!lessonId) return;

  try {
    const res = await fetch(`${API_URL}/api/lessons/${lessonId}`);
    if (!res.ok) return;

    const json = await res.json();
    const lesson = json.data || json;

    if (lesson && lesson.tasks && Array.isArray(lesson.tasks)) {
      // Find the matching speaking task by taskId or by type
      let speakingTask = null;

      if (taskId) {
        const matchedTask = lesson.tasks.find(t => t.id === taskId);
        if (matchedTask && matchedTask.speakingTask) {
          speakingTask = matchedTask.speakingTask;
        }
      }

      // Fallback: find first SPEAKING type task
      if (!speakingTask) {
        const firstSpeaking = lesson.tasks.find(t => t.type === "SPEAKING" && t.speakingTask);
        if (firstSpeaking) {
          speakingTask = firstSpeaking.speakingTask;
        }
      }

      if (speakingTask && speakingTask.prompt) {
        speakTextInput.value = speakingTask.prompt;
      }
    }
  } catch (err) {
    console.warn("Speaking task ma'lumotlarini yuklashda xatolik:", err);
  }
}

loadSpeakingData();

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
      body: JSON.stringify({ text }) // backend will use default voice
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

