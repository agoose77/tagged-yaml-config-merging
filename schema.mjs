import yaml from "js-yaml";

export class TaggedValue {
  constructor(strategy, data) {
    this.data = data;
    this.tag = strategy;
  }

  erase() {
    return this.data;
  }
}

const ExtendsYamlType = new yaml.Type("!extends", {
  kind: "sequence",

  resolve: function (data) {
    return true;
  },

  construct: function (data) {
    return new TaggedValue("extends", data);
  },

  instanceOf: TaggedValue,

  represent: function (obj) {
    return obj.erase();
  },
});

const JoinsYamlType = new yaml.Type("!joins", {
  kind: "sequence",

  resolve: function (data) {
    return true;
  },

  construct: function (data) {
    return new TaggedValue("joins", data);
  },

  instanceOf: TaggedValue,

  represent: function (obj) {
    return obj.erase();
  },
});

const ReplacesYamlType = new yaml.Type("!replaces", {
  kind: "mapping",

  resolve: function (data) {
    return true;
  },

  construct: function (data) {
    return new TaggedValue("replaces", data);
  },

  instanceOf: TaggedValue,

  represent: function (obj) {
    return obj.erase();
  },
});

const SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  ExtendsYamlType,
  JoinsYamlType,
  ReplacesYamlType,
]);
export { SCHEMA };
