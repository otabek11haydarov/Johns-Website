import * as videoService from '../service/video.service.js';

export async function createVideoTaskController(req, res) {
    try {
        const { taskId, videoUrl, duration } = req.body;

        if (!taskId || !videoUrl) {
            return res.status(400).json({ error: "taskId and videoUrl are required!" });
        }

        const newVideoTask = await videoService.createVideoTask(taskId, { videoUrl, duration });

        return res.status(201).json({
            success: true,
            message: "Video task created successfully",
            data: newVideoTask
        });

    } catch (error) {
        if (error.code === 'P2003') {
            console.error("Validation Error: Invalid taskId provided.");
            return res.status(404).json({ error: "Task not found! Please provide a valid taskId." });
        }

        console.error("Error creating video task:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getVideoInfoController(req, res) {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: "Video URL is required" });
        }

        const ytMatch = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        const videoId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;

        if (videoId) {
            try {
                const ytRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    body: JSON.stringify({
                        videoId: videoId,
                        context: {
                            client: {
                                clientName: 'WEB',
                                clientVersion: '2.20240101.00.00'
                            }
                        }
                    })
                });

                if (ytRes.ok) {
                    const data = await ytRes.json();
                    const details = data.videoDetails;
                    if (details && details.lengthSeconds) {
                        const seconds = parseInt(details.lengthSeconds, 10);
                        const minutes = Math.max(1, Math.ceil(seconds / 60));
                        return res.json({
                            success: true,
                            videoId,
                            durationSeconds: seconds,
                            durationMinutes: minutes,
                            title: details.title || null
                        });
                    }
                }
            } catch (ytErr) {
                console.error("YouTube InnerTube API error:", ytErr);
            }
        }

        // Vimeo check
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch && vimeoMatch[1]) {
            const vimeoRes = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
            if (vimeoRes.ok) {
                const vData = await vimeoRes.json();
                if (vData.duration) {
                    const seconds = parseInt(vData.duration, 10);
                    const minutes = Math.max(1, Math.ceil(seconds / 60));
                    return res.json({
                        success: true,
                        durationSeconds: seconds,
                        durationMinutes: minutes,
                        title: vData.title || null
                    });
                }
            }
        }

        return res.status(404).json({ error: "Could not automatically determine duration for this video." });
    } catch (error) {
        console.error("Error in getVideoInfoController:", error);
        return res.status(500).json({ error: "Failed to fetch video details." });
    }
}

