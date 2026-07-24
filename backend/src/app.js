import express from "express";
// Trigger restart once again
import cors from "cors";
import authRoute from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import lessonCardRoutes from "./routes/lessonCardRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import lessonAssessmentRoutes from "./routes/lessonAssessment.routes.js";
import videoAssessmentRoutes from "./routes/videoAssessment.routes.js";
import studentRoutes from "./routes/student.routes.js";
import ttsRoutes from "./routes/ttsRoutes.js";
import grammarTestRoutes from "./routes/grammarTestRoutes.js";


const app = express();

app.use(cors({
  origin: [
    "http://localhost:5500", 
    "http://127.0.0.1:5500", 
    "http://localhost:3000",
    "https://johns-website-chi.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));


app.get("/", (req, res) => {
  res.json({ message: "API is running!" });
});

app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/lesson-cards", lessonCardRoutes);
app.use("/api/video-tasks", videoRoutes);
app.use("/api/test-tasks", testRoutes);
app.use("/api/flashcard-tasks", flashcardRoutes);
app.use("/api/lesson-assessments", lessonAssessmentRoutes);
app.use("/api/video-assessments", videoAssessmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/grammar-tests", grammarTestRoutes);

app.use((error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  res.status(400).json({ message: error.message || "Request failed!" });
});


export default app;
