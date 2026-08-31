'use strict';

const assert = require('assert');
const XrayJUnitReporter = require('../index.js');
const escapeXml = XrayJUnitReporter.escapeXml;

describe('escapeXml', function () {
  it('should escape xml special characters @unit', function () {
    assert.strictEqual(
      escapeXml('a & b < c > d " e \' f'),
      'a &amp; b &lt; c &gt; d &quot; e &apos; f'
    );
  });

  it('should return empty string for falsy input @unit', function () {
    assert.strictEqual(escapeXml(''), '');
    assert.strictEqual(escapeXml(null), '');
    assert.strictEqual(escapeXml(undefined), '');
  });
});
