require("dotenv").config();

import { log } from "@/libraries/Log";
import { setupDB } from "@/db";
import { seed } from "@/seedData";

export const handler = async () => {
  try {
    await setupDB();
    await seed();
    log.info("SEED DONE");
  } catch (err) {
    log.error("ERROR EXECUTING SEED:", err.message);
    return false;
  }
  return true;
};
