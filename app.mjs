import { readFileSync } from "node:fs";
import { parseYaml, extend } from "./config.mjs";

const [baseConfig] = parseYaml(readFileSync("base.yml", { encoding: "utf-8" }));
const [extendsConfig, extendsStrategy] = parseYaml(
  readFileSync("extends.yml", { encoding: "utf-8" }),
);
const result = extend(baseConfig, extendsConfig, extendsStrategy);
console.log(result);
