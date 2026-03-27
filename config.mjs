import yaml from "js-yaml";
import traverse from "traverse";
import { SCHEMA, TaggedValue } from "./schema.mjs";

const parseOpts = {
  schema: SCHEMA,
};

/**
 * Lazily set a value at a given path in an object.
 * Paths may contain strings for object keys, or numbers
 * for array indices.
 *
 * @param object the object to modify
 * @param path a tuple containing path components
 * @param value the value to set
 */
function setValueByPath(object, path, value) {
  let dest = object;
  let prevItem = undefined;
  let prevDest = undefined;
  for (const item of path) {
    // If the destination for this key is unset,
    // we choose its type and set the value in its parent
    if (dest === undefined) {
      if (typeof item === "number") {
        prevDest[prevItem] = dest = [];
      } else {
        prevDest[prevItem] = dest = {};
      }
    }

    // Update references
    prevDest = dest;
    dest = dest[item];
    prevItem = item;
  }
  // Set the terminal value
  prevDest[path.at(-1)] = value;
}

/**
 * Parse YAML into JS types
 *
 * YAML may include tags that are recorded and returned
 *
 * @param content content to parse into js
 */
export function parseYaml(content) {
  const tags = {};
  const config = yaml.load(content, parseOpts);

  // After potentially more merges, realise the config
  function eraseTags(value, path) {
    if (value instanceof TaggedValue) {
      const { tag } = value;
      // Erase the tag type
      value = value.erase();
      // Replace config value with erased value
      setValueByPath(config, path, value);
      // Record tags in node-based scheme of the form
      // { value: ..., children: [] } or  { value: ..., children: {} }
      const tagsPath = path.flatMap((item) => ["children", item]);
      setValueByPath(tags, tagsPath, { value: tag });
    }

    // Recurse into maps
    if (isMap(value)) {
      for (const [childKey, childValue] of Object.entries(value)) {
        eraseTags(childValue, [...path, childKey]);
      }
    }
    // Recurse into sequences
    else if (Array.isArray(value)) {
      value.forEach((elem, i) => eraseTags(elem, [...path, i]));
    }
    return value;
  }
  eraseTags(config, []);

  return [config, tags];
}

/**
 * Helper function to determine if YAML-loaded value is a mapping
 *
 * @param object value to test
 */
function isMap(object) {
  return typeof object === "object" && !Array.isArray(object);
}

/**
 * Extend one record with another using a particular merging strategy
 *
 * @param parent parent object
 * @param child child object
 * @param strategy object with tree structure matching tag annotations of document,
 *                 of the form { value: ..., children: [] } or  { value: ..., children: {} }
 */
export function extend(parent, child, strategy) {
  function impl(parent, child, strategy, path) {
    function throwError(message) {
      throw new Error(`${message}: ${path.join(".")}`);
    }

    const strategyValue = strategy?.value;

    // parent: ??, child: sequence
    if (Array.isArray(child)) {
      if (strategyValue === "extends") {
        // Ensure we're extending an array
        if (!Array.isArray(parent)) {
          throwError("Cannot extend non-array with array");
        }
        return [...parent, ...child];
      } else if (strategyValue === "joins") {
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
              strategy?.children?.[i],
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
      if (strategyValue === "replaces") {
        return child;
      } else {
        // Merge from child into parent
        const result = { ...parent };
        for (const [key, value] of Object.entries(child)) {
          result[key] = impl(parent[key], value, strategy?.children?.[key], [
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
