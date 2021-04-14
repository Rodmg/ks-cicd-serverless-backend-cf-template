require("dotenv").config();

import { log } from "@/libraries/Log";
import { setupDBClearData } from "@/db";
import { seed } from "@/seedData";

export const handler = async () => {
  try {
    await setupDBClearData();
    await seed();
    log.info("CLEAR AND SEED DONE");
  } catch (err) {
    log.error("ERROR EXECUTING CLEAR AND SEED:", err.message);
    return false;
  }
  return true;
};
