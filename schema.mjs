import yaml from "js-yaml";

class ExtendingArray {
  klass = "ExtendingArray";

  constructor(data) {
    this.data = data;
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
    return new ExtendingArray(data);
  },

  instanceOf: ExtendingArray,

  represent: function (obj) {
    return obj.erase();
  },
});

class JoiningArray {
  klass = "JoiningArray";

  constructor(data) {
    this.data = data;
  }

  erase() {
    return this.data;
  }
}

const JoinsYamlType = new yaml.Type("!joins", {
  kind: "sequence",

  resolve: function (data) {
    return true;
  },

  construct: function (data) {
    return new JoiningArray(data);
  },

  instanceOf: JoiningArray,

  represent: function (obj) {
    return obj.erase();
  },
});

class ReplacingMap {
  klass = "ReplacingMap";

  constructor(data) {
    this.data = data;
  }

  erase() {
    return this.data;
  }
}

const ReplacesYamlType = new yaml.Type("!replaces", {
  kind: "mapping",

  resolve: function (data) {
    return true;
  },

  construct: function (data) {
    return new ReplacingMap(data);
  },

  instanceOf: ReplacingMap,

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
