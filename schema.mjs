import yaml from "js-yaml";

class ExtendingArray {
  klass = "ExtendingArray";

  constructor(data) {
    this.data = data;
  }

  extendFrom(other) {
    if (Array.isArray(other)) {
      return new ExtendingArray([...other, ...this.data]);
    } else {
      return new ExtendingArray([...other.data, ...this.data]);
    }
  }
  build() {
    return this.data;
  }
}

const ExtendsYamlType = new yaml.Type("!extends", {
  // Loader must parse sequence nodes only for this type (i.e. arrays in JS terminology).
  // Other available kinds are 'scalar' (string) and 'mapping' (object).
  // http://www.yaml.org/spec/1.2/spec.html#kind//
  kind: "sequence",

  // Loader must check if the input object is suitable for this type.
  resolve: function (data) {
    return true;
  },

  // If a node is resolved, use it to create a Point instance.
  construct: function (data) {
    return new ExtendingArray(data);
  },

  // Dumper must process instances of Point by rules of this YAML type.
  instanceOf: ExtendingArray,

  // Dumper must represent Point objects as three-element sequence in YAML.
  represent: function (obj) {
    return [...obj.build()];
  },
});
const SCHEMA = yaml.DEFAULT_SCHEMA.extend([ExtendsYamlType]);
export { SCHEMA };
