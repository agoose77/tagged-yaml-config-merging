import { readFileSync } from "node:fs";
import { parseYaml, extend } from "./config.mjs";

if (process.argv.length < 4) {
  throw new Error("Insufficient number of args");
}

const base = process.argv[2];
const child = process.argv[3];

const [baseConfig] = parseYaml(readFileSync(base, { encoding: "utf-8" }));
const [extendsConfig, extendsStrategy] = parseYaml(
  readFileSync(child, { encoding: "utf-8" }),
);
const result = extend(baseConfig, extendsConfig, extendsStrategy);
console.dir(result, { depth: null });
