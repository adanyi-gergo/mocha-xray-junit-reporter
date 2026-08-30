'use strict';

const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

const Base = Mocha.reporters.Base;

/**
 * Custom Mocha reporter for Xray-compatible JUnit XML
 */
function XrayJUnitReporter(runner, options) {
  Base.call(this, runner);
  
  var self = this;
  var tests = [];
  var suites = {};
  var currentSuite = null;
  var reporterOptions = options?.reporterOptions || {};
  
  // Get output file from options
  var output = reporterOptions.output || './junit.xml';

  runner.on('suite', function(suite) {
    if (suite.root) return;
    currentSuite = suite.fullTitle();
    if (!suites[currentSuite]) {
      suites[currentSuite] = {
        name: suite.fullTitle(),
        tests: [],
        timestamp: new Date().toISOString(),
        file: suite.file
      };
    }
  });

  runner.on('pass', function(test) {
    var testData = createTestData(test, 'passed', undefined, reporterOptions);
    suites[currentSuite].tests.push(testData);
  });

  runner.on('fail', function(test, err) {
    var testData = createTestData(test, 'failed', err, reporterOptions);
    suites[currentSuite].tests.push(testData);
  });

  runner.on('pending', function(test) {
    var testData = createTestData(test, 'skipped', undefined, reporterOptions);
    suites[currentSuite].tests.push(testData);
  });

  runner.on('end', function() {
    self.writeXml(suites, output);
  });
}

var ALLOWED_TAG_PREFIXES = ['@', '#', '+', ':', '~', '!'];

function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return value === true || value === 'true';
}

function resolveTagPrefix(value = '@') {
  return ALLOWED_TAG_PREFIXES.includes(value) ? value : '@';
}

function processTitle(title, reporterOptions) {
  var stripTags = parseBool(reporterOptions.stripTags, false);
  var saveTags = parseBool(reporterOptions.saveTags, false);

  if (!stripTags && !saveTags) {
    return { title: title, tags: null };
  }

  var tagPrefix = resolveTagPrefix(reporterOptions.tagPrefix);
  var tags = [];
  var kept = [];
  var parts = title.split(/\s+/);

  for (var part of parts) {
    if (part.indexOf(tagPrefix) === 0 && part.length > tagPrefix.length) {
      tags.push(part.slice(tagPrefix.length));
    } else if (part) {
      kept.push(part);
    }
  }

  return {
    title: stripTags ? kept.join(' ') : title,
    tags: tags.length ? tags : null
  };
}

function createTestData(test, status, err, reporterOptions) {
  var processed = processTitle(test.title, reporterOptions);
  var testData = {
    title: processed.title,
    fullTitle: test.fullTitle(),
    duration: test.duration || 0,
    status: status,
    properties: {}
  };

  // Extract custom properties from test context
  if (test.properties && Array.isArray(test.properties)) {
    test.properties.forEach(function(prop) {
      testData.properties[prop.name] = prop.value;
    });
  }

  if (parseBool(reporterOptions.saveTags, false) && processed.tags) {
    testData.properties.tags = processed.tags.join(',');
  }

  if (err) {
    testData.error = {
      message: err.message,
      stack: err.stack,
      type: err.name || 'Error'
    };
  }

  return testData;
}

XrayJUnitReporter.prototype.writeXml = function(suites, outputPath) {
  var totalTests = 0;
  var totalFailures = 0;
  var totalSkipped = 0;
  var totalTime = 0;

  var lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');

  Object.keys(suites).forEach(function(suiteName) {
    var suite = suites[suiteName];
    var suiteTests = 0;
    var suiteFailures = 0;
    var suiteSkipped = 0;
    var suiteTime = 0;

    suite.tests.forEach(function(test) {
      suiteTests++;
      totalTests++;
      var time = test.duration / 1000;
      suiteTime += time;
      totalTime += time;

      if (test.status === 'failed') {
        suiteFailures++;
        totalFailures++;
      }
      if (test.status === 'skipped') {
        suiteSkipped++;
        totalSkipped++;
      }
    });

    lines.push('  <testsuite' +
      ' name="' + escapeXml(suite.name) + '"' +
      ' timestamp="' + suite.timestamp + '"' +
      ' tests="' + suiteTests + '"' +
      ' failures="' + suiteFailures + '"' +
      ' skipped="' + suiteSkipped + '"' +
      ' time="' + suiteTime.toFixed(3) + '"' +
      (suite.file ? ' file="' + escapeXml(suite.file) + '"' : '') +
      '>');

    suite.tests.forEach(function(test) {
      var time = test.duration / 1000;
      
      lines.push('    <testcase' +
        ' name="' + escapeXml(test.title) + '"' +
        ' classname="' + escapeXml(suite.name) + '"' +
        ' time="' + time.toFixed(3) + '"' +
        '>');

      // Add properties with CDATA
      if (Object.keys(test.properties).length > 0) {
        lines.push('      <properties>');
        Object.keys(test.properties).forEach(function(propName) {
          var propValue = test.properties[propName];
          if (propName === 'tags') {
            lines.push('        <property name="tags" value="' + escapeXml(propValue) + '" />');
          } else {
            lines.push('        <property name="' + escapeXml(propName) + '">');
            lines.push('          <![CDATA[' + propValue + ']]>');
            lines.push('        </property>');
          }
        });
        lines.push('      </properties>');
      }

      // Add failure element if test failed
      if (test.error) {
        lines.push('      <failure' +
          ' message="' + escapeXml(test.error.message) + '"' +
          ' type="' + escapeXml(test.error.type) + '"' +
          '>');
        lines.push('        <![CDATA[' + test.error.stack + ']]>');
        lines.push('      </failure>');
      }

      // Add skipped element if test was skipped
      if (test.status === 'skipped') {
        lines.push('      <skipped/>');
      }

      lines.push('    </testcase>');
    });

    lines.push('  </testsuite>');
  });

  var xmlString = lines.join('\n');

  // Wrap in testsuites tag
  xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<testsuites' +
    ' name="Mocha Tests"' +
    ' tests="' + totalTests + '"' +
    ' failures="' + totalFailures + '"' +
    ' skipped="' + totalSkipped + '"' +
    ' time="' + totalTime.toFixed(3) + '"' +
    '>\n' +
    lines.slice(1).join('\n') + '\n' +
    '</testsuites>';

  // Ensure directory exists
  var dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, xmlString, 'utf8');
  console.log('\nXray JUnit report written to:', outputPath);
};

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

XrayJUnitReporter.parseBool = parseBool;
XrayJUnitReporter.processTitle = processTitle;
XrayJUnitReporter.resolveTagPrefix = resolveTagPrefix;
XrayJUnitReporter.ALLOWED_TAG_PREFIXES = ALLOWED_TAG_PREFIXES;
XrayJUnitReporter.escapeXml = escapeXml;

module.exports = XrayJUnitReporter;
