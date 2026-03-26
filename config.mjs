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
  function impl(parent, child, strategy, path) {
    function throwError(message) {
      throw new Error(`${message}: ${path.join(".")}`);
    }

    // parent: ??, child: sequence
    if (Array.isArray(child)) {
      if (strategy === "extends") {
        // Ensure we're extending an array
        if (!Array.isArray(parent)) {
          throwError("Cannot extend non-array with array");
        }
        return [...parent, ...child];
      } else if (strategy === "joins") {
        // Ensure we have array of map
        if (!child.every((p) => isMap(p) && p.id !== undefined)) {
          throwError(
            "Join must be performed from an array of maps containing `id`",
          );
        }
        // Ensure that we have array of non-map to join onto
        if (
          !(
            Array.isArray(parent) &&
            parent.every((p) => isMap(p) && p.id !== undefined)
          )
        ) {
          throwError(
            "Join must be performed onto an array of maps containing `id`",
          );
        }
        // Perform join
        const result = [...parent];
        for (let i = 0; i < child.length; i++) {
          const childItem = child.at(i);

          // First, are we joining or adding a new member
          const joinIndex = parent.findIndex((p) => p.id === childItem.id);
          if (joinIndex !== -1) {
            // Perform join and update parent
            result[joinIndex] = impl(
              parent[joinIndex],
              childItem,
              strategy[i],
              [...path, i],
            );
          } else {
            result.push(childItem);
          }
        }
        return result;
      } else {
        // Preserve new value
        return child;
      }
    }
    // parent: ??, child: map
    else if (isMap(parent)) {
      if (strategy === "replaces") {
        return child;
      } else {
        const result = { ...parent };
        for (const [key, value] of Object.entries(child)) {
          // TODO: ensure that strategy etc exist
          result[key] = impl(parent[key], value, strategy?.[key], [
            ...path,
            key,
          ]);
        }
        return result;
      }
    }
    // parent: ??, child: ??
    else {
      return child;
    }
  }
  return impl(parent, child, strategy, []);
}

