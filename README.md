# Mocha Xray JUnit Reporter

A Mocha reporter that generates Xray-compatible JUnit XML with proper CDATA sections for test properties. Perfect for integrating automated tests with Jira Xray test management.

## Installation

```bash
npm install mocha-xray-junit-reporter --save-dev
```

## Quick Start

### Basic Usage

Update your `package.json`:

```json
{
  "scripts": {
    "test": "mocha --reporter mocha-xray-junit-reporter --reporter-options output=./junit.xml ./test/**/*.test.js"
  }
}
```

### Writing Tests with Properties

Add custom properties to your tests for Xray integration:

```javascript
describe("User Authentication", function () {
  it("should successfully login with valid credentials", async function () {
    // Add test properties for Xray
    this.test.properties = [
      { 
        name: "test_description", 
        value: "PROJ-123 | Verifies that users can login with valid credentials" 
      },
      { 
        name: "test_type", 
        value: "Automated" 
      },
      {
        name: "priority",
        value: "High"
      }
    ];
    
    // Your test code
    const result = await login(username, password);
    expect(result.success).to.be.true;
  });
});
```

### Multiple Reporters

Use with other reporters (e.g., HTML report):

```bash
npm install mocha-multi-reporters mochawesome --save-dev
```

Create `reporter-config.json`:

```json
{
  "reporterEnabled": "mocha-xray-junit-reporter, mochawesome",
  "mocha-xray-junit-reporter": {
    "output": "junit.xml"
  },
  "mochawesome": {
    "reportDir": "html-report",
    "reportFilename": "index.html"
  }
}
```

Update test script:

```json
{
  "scripts": {
    "test": "mocha --reporter mocha-multi-reporters --reporter-options configFile=reporter-config.json ./test/**/*.test.js"
  }
}
```

## Output Format

The reporter generates JUnit XML with proper CDATA sections:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Mocha Tests" tests="1" failures="0" skipped="0" time="0.025">
  <testsuite name="User Authentication" timestamp="2026-01-28T10:30:00.000Z" tests="1" failures="0" skipped="0" time="0.025">
    <testcase name="should successfully login with valid credentials" classname="User Authentication" time="0.025">
      <properties>
        <property name="test_description">
          <![CDATA[PROJ-123 | Verifies that users can login with valid credentials]]>
        </property>
        <property name="test_type">
          <![CDATA[Automated]]>
        </property>
        <property name="priority">
          <![CDATA[High]]>
        </property>
      </properties>
    </testcase>
  </testsuite>
</testsuites>
```

## Configuration Options

Reporter options can be passed via `--reporter-options`:

| Option | Description | Default |
|--------|-------------|---------|
| `output` | Path to output XML file | `./junit.xml` |

Example:

```bash
mocha --reporter mocha-xray-junit-reporter --reporter-options output=./test-results/results.xml
```

## Xray Integration Tips

### Common Properties for Xray

- `test_description` - Test description (use format: `TICKET-ID | Description`)
- `test_type` - Test type (e.g., "Automated", "Manual")
- `test_key` - Existing Xray test key
- `requirement` - Requirement ticket ID
- `priority` - Test priority

## Troubleshooting

### Properties Not Showing in Xray

Make sure you're using the JUnit import endpoint in Xray, not the standard JUnit parser. Properties in CDATA sections require the Xray-specific importer.

### Special Characters in Properties

All property values are automatically wrapped in CDATA sections, so special characters (like `<`, `>`, `&`) are handled correctly.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Author

Created for the testing community to simplify Xray integration with Mocha tests.

## Related Projects

- [Mocha](https://mochajs.org/) - JavaScript test framework
- [Xray](https://www.getxray.app/) - Test management for Jira
- [Mochawesome](https://github.com/adamgruber/mochawesome) - HTML reporter for Mocha
