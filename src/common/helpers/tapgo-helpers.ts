import { join } from "path";
import { homedir } from "os";

export const tapgoTempFolder = join(homedir(), ".tapgo");
export const logFilePath = join(tapgoTempFolder, "debug.log");
