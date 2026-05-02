import express from "express";
import cors from "cors";
import authRoute from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


app.get("/", (req, res) => {
  res.json({ message: "API is running!" });
});

app.use("/api/auth", authRoute);
app.use("/api/books", bookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);

app.use((error, req, res, next) => {
  if (!error) {
    next();
    return;
  }

  res.status(400).json({ message: error.message || "Request failed!" });
});


export default app;
