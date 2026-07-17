import { app } from "./app.js";
import { config } from "./config.js";
import { db } from "./database.js";

async function start() {
  await db.query("SELECT 1");
  app.listen(config.PORT, () => {
    console.log(`Lumio API listening on http://localhost:${config.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start Lumio API", error);
  process.exit(1);
});
