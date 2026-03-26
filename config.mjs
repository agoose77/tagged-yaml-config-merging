import yaml from "js-yaml";
import traverse from "traverse";
import { SCHEMA } from "./schema.mjs";

const parseOpts = {
  schema: SCHEMA,
};

export function parseYaml(content) {
  const config = yaml.load(content, parseOpts);

  const strategy = {};
  const strategyRef = traverse(strategy);

  // After potentially more merges, realise the config
  traverse(config).forEach(function (item) {
    switch (item.klass) {
      case "JoiningArray": {
        // Store record of extends
        strategyRef.set(this.path, "joins");
        // Erase custom type
        this.update(item.erase());
        break;
      }

      case "ExtendingArray": {
        // Store record of extends
        strategyRef.set(this.path, "extends");
        // Erase custom type
        this.update(item.erase());
        break;
      }
      case "ReplacingMap": {
        // Store record of extends
        strategyRef.set(this.path, "replaces");
        // Erase custom type
        this.update(item.erase());
      }
    }
  });

  return [config, strategy];
}

function isMap(object) {
  return typeof object === "object" && !Array.isArray(object);
}

export function extend(parent, child, strategy) {
  const parentRef = traverse(parent);
  const strategyRef = traverse(strategy);

  traverse(child).forEach(function (item) {
    const parentItem = parentRef.get(this.path);
    const setParentItemAndExit = (value) => {
      // Set value
      parentRef.set(this.path, value);
      // Stop traversing
      this.update(item, true);
    };

    if (Array.isArray(item)) {
      const itemStrategy = strategyRef.get(this.path);

      // Array? - Array (extends)
      if (itemStrategy === "extends") {
        // Extend parent array (or set if undefined)
        // TODO: throw if not array on LHS?
        setParentItemAndExit([...parentItem, ...item]);
      } else if (itemStrategy === "joins") {
        if (
          Array.isArray(parentItem) &&
          parentItem.every((p) => isMap(p)) &&
          item.every((p) => isMap(p))
        ) {
          for (const newMember of item) {
            const id = item.id;
            if (id === undefined) {
              continue;
            }
            const joinMember = parentItem.find((p) => p.id === id);
            if (joinMember === undefined) {
              continue;
            }
            Object.assign(joinMember, newMember);
          }
        } else {
          setParentItemAndExit(parentItem);
        }
      }
      // Array? - Array (replace)
      else {
        setParentItemAndExit(item);
      }
    } else if (isMap(item)) {
      const itemStrategy = strategyRef.get(this.path);

      // Map? - Map (replace)
      if (itemStrategy === "replaces") {
        setParentItemAndExit(item);
      }
      // Map - Map (extend)
      else if (isMap(parentItem)) {
        // Continue recursion
        return;
      }
      // Non-Map - Map (replace)
      else {
        setParentItemAndExit(item);
      }
    } else {
      setParentItemAndExit(item);
    }
  });
  return parent;
}
