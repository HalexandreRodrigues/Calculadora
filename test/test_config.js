const assert = require('assert');
const cfg = require('../config.json');

assert(cfg && cfg.features, 'config.json must export features');
assert(cfg.features.claude_haiku_4_5 === true, 'claude_haiku_4_5 must be true in config.json for tests');
console.log('config.json feature flag is set as expected.');
