import app from "./app.js";
import "dotenv/config";
import prisma from "./config/db.js";

try {
  const result = await prisma.$queryRaw`SELECT NOW()`;
  console.log("Database connection successful:", result);
} catch (error) {
  console.error("Database connection failed:", error);
}


const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`App is running on port: ${PORT}`);
});
