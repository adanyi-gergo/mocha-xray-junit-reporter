'use strict';

const assert = require('assert');
const XrayJUnitReporter = require('../index.js');
const parseBool = XrayJUnitReporter.parseBool;

describe('parseBool', function () {
  it('should return default for undefined @unit', function () {
    assert.strictEqual(parseBool(undefined, false), false);
    assert.strictEqual(parseBool(undefined, true), true);
  });

  it('should return default for null and empty string @unit', function () {
    assert.strictEqual(parseBool(null, false), false);
    assert.strictEqual(parseBool('', true), true);
  });

  it('should treat boolean true as true @unit', function () {
    assert.strictEqual(parseBool(true, false), true);
  });

  it('should treat string "true" as true @unit', function () {
    assert.strictEqual(parseBool('true', false), true);
  });

  it('should treat other values as false @unit', function () {
    assert.strictEqual(parseBool(false, true), false);
    assert.strictEqual(parseBool('false', true), false);
    assert.strictEqual(parseBool('yes', true), false);
  });
});
