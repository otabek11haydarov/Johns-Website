import app from "./app.js";
import "dotenv/config";
import pool from "./config/db.js";

const result = await pool.query("SELECT NOW()");
console.log(result.rows);


const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`App is running on port: ${PORT}`);
});
