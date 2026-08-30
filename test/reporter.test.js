"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const XrayJUnitReporter = require("../index.js");
const processTitle = XrayJUnitReporter.processTitle;

describe("XrayJUnitReporter", function () {
  var outputPath;

  beforeEach(function () {
    outputPath = path.join(
      __dirname,
      "../test-results/reporter-integration.xml",
    );
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  });

  it("should write xray-compatible junit xml with stripped appended tags @integration", function () {
    var processed = processTitle("passes with clean title @fixture", {
      stripTags: true,
      saveTags: true,
    });
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    assert.ok(fs.existsSync(outputPath));
    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(xml, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(xml, /<testsuites name="Mocha Tests"/);
    assert.match(xml, /<testcase name="passes with clean title"/);
    assert.match(xml, /<property name="tags" value="fixture"\s*\/>/);
    assert.doesNotMatch(xml, /@fixture/);
  });

  it("should write multiple tags as comma-separated xray value @integration @example", function () {
    var processed = processTitle(
      "passes with clean title @smoke @regression @api",
      {
        stripTags: true,
        saveTags: true,
      },
    );
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(
      xml,
      /<property name="tags" value="smoke,regression,api"\s*\/>/,
    );
    assert.doesNotMatch(xml, /@smoke/);
    assert.doesNotMatch(xml, /@regression/);
    assert.doesNotMatch(xml, /@api/);
  });

  it("should save tags without stripping title when only saveTags is true @integration", function () {
    var processed = processTitle(
      "passes with tags in title @smoke @regression",
      { saveTags: true },
    );
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(
      xml,
      /<testcase name="passes with tags in title @smoke @regression"/,
    );
    assert.match(xml, /<property name="tags" value="smoke,regression"\s*\/>/);
  });

  it("should escape special xml characters in titles and tag values @integration", function () {
    var processed = processTitle(
      'verify "login" & <redirect> @smoke&regression',
      {
        stripTags: true,
        saveTags: true,
      },
    );
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: 'Suite with "quotes" & <symbols>',
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(xml, /name="verify &quot;login&quot; &amp; &lt;redirect&gt;"/);
    assert.match(xml, /value="smoke&amp;regression"\s*\/>/);
    assert.match(
      xml,
      /testsuite name="Suite with &quot;quotes&quot; &amp; &lt;symbols&gt;"/,
    );
  });

  it("should escape unstripped titles that still contain tag tokens @integration", function () {
    var processed = processTitle(
      'verify "login" & <redirect> @smoke&regression @tag"two"',
      {
        saveTags: true,
      },
    );
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.strictEqual(
      processed.title,
      'verify "login" & <redirect> @smoke&regression @tag"two"',
    );
    assert.match(
      xml,
      /name="verify &quot;login&quot; &amp; &lt;redirect&gt; @smoke&amp;regression @tag&quot;two&quot;"/,
    );
    assert.match(xml, /value="smoke&amp;regression,tag&quot;two&quot;"\s*\/>/);
  });

  it("should write junit xml with hash tag prefix @integration", function () {
    var processed = processTitle("passes with clean title #smoke #regression", {
      stripTags: true,
      saveTags: true,
      tagPrefix: "#",
    });
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(xml, /<testcase name="passes with clean title"/);
    assert.match(xml, /<property name="tags" value="smoke,regression"\s*\/>/);
    assert.doesNotMatch(xml, /#smoke/);
    assert.doesNotMatch(xml, /#regression/);
  });

  it("should write junit xml with plus tag prefix @integration", function () {
    var processed = processTitle("passes with clean title +api +nightly", {
      stripTags: true,
      saveTags: true,
      tagPrefix: "+",
    });
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(xml, /<property name="tags" value="api,nightly"\s*\/>/);
    assert.doesNotMatch(xml, /\+api/);
  });

  it("should keep hash tags in title when only saveTags is true @integration", function () {
    var processed = processTitle("passes with tags in title #auth #negative", {
      saveTags: true,
      tagPrefix: "#",
    });
    var reporter = Object.create(XrayJUnitReporter.prototype);
    var suites = {
      "Reporter fixture": {
        name: "Reporter fixture",
        timestamp: "2026-01-28T10:30:00.000Z",
        tests: [
          {
            title: processed.title,
            duration: 1,
            status: "passed",
            properties: { tags: processed.tags.join(",") },
          },
        ],
      },
    };
    this.test.properties = [
      {
        name: "test_description",
        value: "This is a test description",
      },
    ];

    reporter.writeXml(suites, outputPath);

    var xml = fs.readFileSync(outputPath, "utf8");
    assert.match(
      xml,
      /<testcase name="passes with tags in title #auth #negative"/,
    );
    assert.match(xml, /<property name="tags" value="auth,negative"\s*\/>/);
  });
});
