'use strict';

const assert = require('assert');
const XrayJUnitReporter = require('../index.js');
const processTitle = XrayJUnitReporter.processTitle;

describe('processTitle', function () {
  it('should leave title unchanged when stripTags is false @unit', function () {
    var result = processTitle('should login @smoke', { stripTags: false });
    assert.strictEqual(result.title, 'should login @smoke');
    assert.strictEqual(result.tags, null);
  });

  it('should extract tags without stripping when only saveTags is true @unit', function () {
    var result = processTitle('should login @smoke @regression', { saveTags: true });
    assert.strictEqual(result.title, 'should login @smoke @regression');
    assert.deepStrictEqual(result.tags, ['smoke', 'regression']);
  });

  it('should strip a single appended tag @unit', function () {
    var result = processTitle('should login @smoke', { stripTags: true });
    assert.strictEqual(result.title, 'should login');
    assert.deepStrictEqual(result.tags, ['smoke']);
  });

  it('should strip multiple appended tags @unit', function () {
    var result = processTitle('should login @smoke @regression', { stripTags: true });
    assert.strictEqual(result.title, 'should login');
    assert.deepStrictEqual(result.tags, ['smoke', 'regression']);
  });

  it('should strip three or more appended tags @unit', function () {
    var result = processTitle('should login @smoke @regression @api @nightly', { stripTags: true });
    assert.strictEqual(result.title, 'should login');
    assert.deepStrictEqual(result.tags, ['smoke', 'regression', 'api', 'nightly']);
  });

  it('should preserve tag order for multiple appended tags @unit', function () {
    var result = processTitle('should export report @z-last @a-first @m-middle', { stripTags: true });
    assert.strictEqual(result.title, 'should export report');
    assert.deepStrictEqual(result.tags, ['z-last', 'a-first', 'm-middle']);
  });

  it('should expose multiple appended tags for xray label joining @unit', function () {
    var result = processTitle('should sync issues @smoke @regression', { stripTags: true });
    assert.strictEqual(result.title, 'should sync issues');
    assert.strictEqual(result.tags.join(','), 'smoke,regression');
  });

  it('should ignore bare prefix token among appended tags @unit', function () {
    var result = processTitle('should login @ @smoke', { stripTags: true });
    assert.strictEqual(result.title, 'should login @');
    assert.deepStrictEqual(result.tags, ['smoke']);
  });

  it('should not strip words containing prefix mid-token @unit', function () {
    var result = processTitle('email@smoke should login @smoke', { stripTags: true });
    assert.strictEqual(result.title, 'email@smoke should login');
    assert.deepStrictEqual(result.tags, ['smoke']);
  });

  it('should support custom tagPrefix on appended tags @unit', function () {
    var result = processTitle('should login #smoke', { stripTags: true, tagPrefix: '#' });
    assert.strictEqual(result.title, 'should login');
    assert.deepStrictEqual(result.tags, ['smoke']);
  });

  it('should accept each whitelisted tagPrefix @unit', function () {
    var resolveTagPrefix = XrayJUnitReporter.resolveTagPrefix;
    var allowed = XrayJUnitReporter.ALLOWED_TAG_PREFIXES;

    for (var prefix of allowed) {
      var tagToken = prefix + 'smoke';
      var title = 'should login ' + tagToken;
      var result = processTitle(title, { stripTags: true, tagPrefix: prefix });
      assert.strictEqual(resolveTagPrefix(prefix), prefix);
      assert.strictEqual(result.title, 'should login');
      assert.deepStrictEqual(result.tags, ['smoke']);
    }
  });

  it('should fall back to default tagPrefix when value is not whitelisted @unit', function () {
    var result = processTitle('should login @smoke', { stripTags: true, tagPrefix: '$$' });
    assert.strictEqual(XrayJUnitReporter.resolveTagPrefix('$$'), '@');
    assert.strictEqual(result.title, 'should login');
    assert.deepStrictEqual(result.tags, ['smoke']);
  });

  it('should ignore non-whitelisted prefix tokens in titles @unit', function () {
    var result = processTitle('should login $$smoke', { stripTags: true, tagPrefix: '$$' });
    assert.strictEqual(result.title, 'should login $$smoke');
    assert.strictEqual(result.tags, null);
  });

  it('should return empty title when only appended tags remain @unit', function () {
    var result = processTitle('@smoke @api', { stripTags: true });
    assert.strictEqual(result.title, '');
    assert.deepStrictEqual(result.tags, ['smoke', 'api']);
  });
});
