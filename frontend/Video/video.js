const nextButton = document.getElementById("nextButton");
const videoBox = document.getElementById("videoBox");
const videoIframe = document.getElementById("videoIframe");
const videoTitleEl = document.getElementById("videoTitle");

// Extract YouTube videoId from any link format
const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Build embed URL from any video URL
const getEmbedUrl = (url) => {
  if (!url) return null;

  // Direct video files (.mp4, .webm, .ogg)
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return { isNative: true, url };
  }

  // YouTube — extract videoId and build embed iframe URL
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return {
      isNative: false,
      isYoutube: true,
      videoId,
      url: `https://www.youtube.com/embed/${videoId}?rel=0&iv_load_policy=3`
    };
  }

  // Handle vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return { isNative: false, url: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  return { isNative: false, url };
};

const renderVideo = (rawUrl, title) => {
  if (title && videoTitleEl) {
    videoTitleEl.textContent = title;
  }
  if (!rawUrl || !videoBox) return;

  const result = getEmbedUrl(rawUrl);
  if (!result) return;

  if (result.isNative) {
    // Native video file (.mp4 etc.)
    videoBox.innerHTML = `
      <video controls autoplay class="native-video-player" style="width:100%; height:100%; object-fit:contain; background:#000;">
        <source src="${result.url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
    const vEl = videoBox.querySelector('video');
    if (vEl) {
      vEl.addEventListener('timeupdate', () => {
        if (vEl.duration > 0) {
          const pct = Math.min(100, Math.round((vEl.currentTime / vEl.duration) * 100));
          if (pct > videoWatchedPercentage) {
            videoWatchedPercentage = pct;
            window.parent.postMessage({ type: 'VIDEO_PROGRESS', percentage: pct, lessonId }, '*');
            if (lessonId) localStorage.setItem(`video_progress_${lessonId}`, pct);
            updateVideoStatusUI(pct);
          }
        }
      });
    }
  } else if (result.isYoutube && result.videoId) {
    // YouTube embed via API for custom overlay
    videoBox.style.position = 'relative'; // Make sure the overlay positions correctly
    videoBox.innerHTML = `
      <div class="click-blocker-top"></div>
      <div class="logo-blocker"></div>
      <div id="youtube-player"></div>
      <div class="custom-overlay" id="ytOverlay">
          <h3>Dars to'xtatildi</h3>
          <button class="play-btn" id="ytResumeBtn">Davom etish ▶</button>
      </div>
    `;

    document.getElementById('ytResumeBtn').addEventListener('click', () => {
        if (window.ytPlayer && typeof window.ytPlayer.playVideo === 'function') {
            window.ytPlayer.playVideo();
        }
        document.getElementById('ytOverlay').style.display = 'none';
    });

    if (window.YT && window.YT.Player) {
        initYouTubePlayer(result.videoId);
    } else {
        window.pendingYouTubeVideoId = result.videoId;
        // Load API if not loaded
        if (!document.getElementById('yt-api-script')) {
            const tag = document.createElement('script');
            tag.id = 'yt-api-script';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }
  } else {
    // Generic embed (Vimeo etc.) — update existing iframe src
    if (videoIframe) videoIframe.src = result.url;
  }
};

// Check query params for dynamic video URL or lessonId
const params = new URLSearchParams(window.location.search);
const rawVideoUrl = params.get("videoUrl") || params.get("url");
const lessonId = params.get("lessonId") || params.get("id");

async function loadBackendVideo() {
  // 1. Direct video URL parameter
  if (rawVideoUrl) {
    renderVideo(rawVideoUrl);
    return;
  }

  // 2. Fetch via lessonId if provided
  const baseUrl = typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:5000";
  const token = localStorage.getItem("token");

  try {
    if (lessonId) {
      const res = await fetch(`${baseUrl}/api/lessons/${lessonId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const lesson = json.data || json;
        if (lesson && lesson.tasks) {
          const vTask = lesson.tasks.find((t) => t.type === "VIDEO" || t.videoTask);
          const url = vTask?.videoTask?.videoUrl || vTask?.config?.videoUrl;
          if (url) {
            renderVideo(url, lesson.title);
            return;
          }
        }
      }
    }

    // 3. Fallback to student dashboard API
    if (token) {
      const dashRes = await fetch(`${baseUrl}/api/students/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        const cl = dashJson.data?.currentLesson;
        if (cl && cl.videoUrl) {
          renderVideo(cl.videoUrl, cl.title);
          return;
        }
      }
    }
  } catch (err) {
    console.error("Backend video fetch error:", err);
  }

  // If iframe already has static src, format it
  if (videoIframe && videoIframe.src) {
    const fixed = getEmbedUrl(videoIframe.src);
    if (fixed && !fixed.isNative && fixed.url) {
      videoIframe.src = fixed.url;
    }
  }
}

loadBackendVideo();

nextButton?.addEventListener("click", () => {
  if (!videoBox) return;
  videoBox.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0.985)", opacity: 0.82 },
      { transform: "scale(1)", opacity: 1 },
    ],
    {
      duration: 220,
      easing: "ease-in-out",
    }
  );
});

// Progress tracking
let videoWatchedPercentage = 0;
let watchProgressInterval = null;

function updateVideoStatusUI(pct) {
  const statusEl = document.getElementById('videoWatchedStatus');
  if (statusEl) {
    if (pct >= 80) {
      statusEl.textContent = `✅ Video ${pct}% ko'rildi (Keyingi task ochildi!)`;
      statusEl.style.color = '#10b981';
      statusEl.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
    } else {
      statusEl.textContent = `⏱️ Video ko'rildi: ${pct}% / 80% talab qilinadi`;
      statusEl.style.color = '#f59e0b';
      statusEl.style.border = '1px solid rgba(245, 158, 11, 0.4)';
      statusEl.style.background = 'rgba(245, 158, 11, 0.15)';
    }
  }
}

function trackVideoProgress(player) {
  if (watchProgressInterval) clearInterval(watchProgressInterval);
  watchProgressInterval = setInterval(() => {
    if (player && typeof player.getDuration === 'function' && typeof player.getCurrentTime === 'function') {
      const duration = player.getDuration();
      const current = player.getCurrentTime();
      if (duration > 0) {
        const pct = Math.min(100, Math.round((current / duration) * 100));
        if (pct > videoWatchedPercentage) {
          videoWatchedPercentage = pct;
          window.parent.postMessage({ type: 'VIDEO_PROGRESS', percentage: pct, lessonId }, '*');
          if (lessonId) localStorage.setItem(`video_progress_${lessonId}`, pct);
          updateVideoStatusUI(pct);
        }
      }
    }
  }, 1000);
}

// YouTube API Initialization
window.initYouTubePlayer = function(videoId) {
    window.ytPlayer = new YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
            'rel': 0,            // Limit related videos to same channel
            'modestbranding': 1, // Hide YouTube logo
            'controls': 1,       // Keep controls
            'iv_load_policy': 3  // Hide video annotations and cards
        },
        events: {
            'onStateChange': function(event) {
                const overlay = document.getElementById('ytOverlay');
                
                // If PAUSED or ENDED
                if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                    if (overlay) overlay.style.display = 'flex';
                } 
                // If PLAYING
                else if (event.data === YT.PlayerState.PLAYING) {
                    if (overlay) overlay.style.display = 'none';
                    trackVideoProgress(window.ytPlayer);
                }
            }
        }
    });
};

window.onYouTubeIframeAPIReady = function() {
    if (window.pendingYouTubeVideoId) {
        window.initYouTubePlayer(window.pendingYouTubeVideoId);
        window.pendingYouTubeVideoId = null;
    }
};
