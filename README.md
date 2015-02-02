# broccoli-dsl

Simple DSL for broccoli inspired by gobble

## Quick start

```bash
npm install broccoli-dsl --save-dev
```

```javascript
// Brocfile.js

var dsl = require('broccoli-dsl');

module.exports = dsl([
  dsl('src').transform('6to5', {
    runtime: true
  }).transform('concat'),
  dsl('public')
]);
```

```bash
broccoli build
```
