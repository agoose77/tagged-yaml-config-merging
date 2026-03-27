import { readFileSync } from "node:fs";
import { parseYaml, extend } from "./config.mjs";

const [baseConfig] = parseYaml(readFileSync("base.yml", { encoding: "utf-8" }));
const [extendsConfig, extendsStrategy] = parseYaml(
  readFileSync("child.yml", { encoding: "utf-8" }),
);
console.dir(extendsStrategy, {depth:null});
const result = extend(baseConfig, extendsConfig, extendsStrategy);
console.dir(result, {depth:null});
