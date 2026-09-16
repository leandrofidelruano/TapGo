import { basename, extname, join } from "path";
import { createHash } from "crypto";
import { tapgoTempFolder } from "../../../common/helpers/tapgo-helpers";
import { replaceWhitespace } from "../../../common/helpers/string-helpers";

export const applicationIconLocation = join(tapgoTempFolder, "application-icons");
export const powershellScriptFilePath = join(tapgoTempFolder, "generate-icons.ps1");

export function getApplicationIconFilePath(applicationFilePath: string): string {
    const hash = createHash("md5").update(`${applicationFilePath}`).digest("hex");
    const fileName = `${replaceWhitespace(
        basename(applicationFilePath).replace(extname(applicationFilePath), "").toLowerCase(),
        "-",
    )}-${hash}`;
    return `${join(applicationIconLocation, fileName)}.png`;
}
