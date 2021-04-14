require("dotenv").config();
import { setupDB } from "@/db";
import { log } from "@/libraries/Log";
import { seed } from "@/seedData";

async function main(): Promise<void> {
  try {
    await setupDB();
    await seed();
    log.info("SEED DONE");
    process.exit();
  } catch (err) {
    log.error("ERROR EXECUTING SEED:", err);
    process.exit();
  }
}

main();
