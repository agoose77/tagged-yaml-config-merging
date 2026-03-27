# Config merging using tags

A simple demo of tagged config merging.

## Usage

```shell
node app.mjs base.yml child.yml
```

### extends

```yaml
foo: 
  - 1
  - 2
---
foo: !extends
  - 3
  - 4
```
becomes
```yaml
foo:   
  - 1
  - 2
  - 3
  - 4
```

### joins

```yaml
authors: 
  - id: a
    name: a
  - id: b
    name: b
---
authors: !joins
  - id: a
    roles: 
      - Author
```
becomes
```yaml
authors: 
  - id: a
    name: a
    roles: 
      - Author
  - id: b
    name: b
```

### replaces

```yaml
foo:
  a: 1
  b: 2
---
foo: !replaces
  c: 10
  d: 20
```
becomes
```yaml
foo:
  c: 10
  d: 20
```

### merges (default)

```yaml
foo:
  a: 1
  b: 2
---
foo:
  c: 10
  d: 20
```
becomes
```yaml
foo:
  a: 1
  b: 2
  c: 10
  d: 20
```

### replaces (default)

```yaml
foo:
  - 1
  - 2
---
foo:
  - 10
  - 20
```
becomes
```yaml
foo:
  - 10
  - 20
```
