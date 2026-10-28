import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const path = new URL("../.dev.vars", import.meta.url);
let source = await readFile(path, "utf8").catch(() => "");
const values = {
  DLIFE_AUTH_SECRET: randomBytes(32).toString("hex"),
  DLIFE_AUTH_URL: "http://127.0.0.1:5173",
  DLIFE_OWNER_SETUP: "enabled",
};
for (const [key, value] of Object.entries(values)) {
  if (!new RegExp("^" + key + "=", "m").test(source))
    source +=
      (source && !source.endsWith("\n") ? "\n" : "") + key + "=" + value + "\n";
}
await writeFile(path, source, { mode: 0o600 });
console.log("Local account configuration is ready. Secrets were not printed.");
