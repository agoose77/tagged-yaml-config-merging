import yaml from "js-yaml";
import traverse from "traverse";
import { readFileSync } from "node:fs";
import { SCHEMA } from "./schema.mjs";

function extendConfig(base, derived) {
  const baseRef = traverse(base);
  const mergedConfig = traverse(derived).map(function (item) {
    if (item.klass === "ExtendingArray") {
      const other = baseRef.get(this.path);
      console.log(this.path, other);
      return other ? item.extendFrom(other) : item;
    }
  });
  return mergedConfig;
}
function realiseExtendedConfig(config) {
  // After potentially more merges, realise the config
  traverse(config).map(function (item) {
    if (item.klass === "ExtendingArray") {
      return item.build();
    }
  });
  return config;
}
/////////////////
const parseOpts = {
  schema: SCHEMA,
};

const baseConfig = yaml.load(
  readFileSync("base.yml", { encoding: "utf-8" }),
  parseOpts,
);
const extendsConfig = yaml.load(
  readFileSync("extends.yml", { encoding: "utf-8" }),
  parseOpts,
);
const extendedConfig = realiseExtendedConfig(
  extendConfig(baseConfig, extendsConfig),
);

console.dir(extendedConfig, { depth: null });
