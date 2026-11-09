# Selenium JavaScript Broken Link Checker

A small QA automation project that uses Selenium WebDriver and JavaScript (Node.js) to count working, broken, and unverified hyperlinks on a webpage.

By default, the script checks links on the [Wikipedia India page](https://en.wikipedia.org/wiki/India).

## Features

- Opens the target webpage in Google Chrome using Selenium WebDriver.
- Collects hyperlinks from `<a href>` elements.
- Keeps only HTTP/HTTPS links and removes duplicate URLs and fragments (`#section`).
- Sends HTTP `HEAD` requests, with `GET` fallback when needed.
- Checks a limited number of links concurrently.
- Categorizes links as working, broken, or unknown.
- Prints broken-link URLs and a summary in the terminal.

## Prerequisites

- [Node.js](https://nodejs.org/) (a current supported LTS version)
- [Google Chrome](https://www.google.com/chrome/)
- [Visual Studio Code](https://code.visualstudio.com/) (optional)

> Recent Selenium versions include Selenium Manager, which normally configures the matching ChromeDriver automatically. You generally do not need to download ChromeDriver manually.

## Project Structure

```text
selenium-link-checker/
├── brokenLinks.js
├── package.json
├── package-lock.json   # created by npm install
└── README.md
```

## Installation

### Option 1: npm (recommended)

Open a terminal in the project folder and run:

```bash
npm init -y
npm install --save-dev selenium-webdriver
```

If your project already contains a `package.json` with Selenium listed, just run:

```bash
npm install
```

### Option 2: Yarn

```bash
yarn add --dev selenium-webdriver
```

### Option 3: pnpm

```bash
pnpm add --save-dev selenium-webdriver
```

> Install dependencies using one package manager for a given project.

## Verify the Installation

```bash
node --version
npm --version
npm list selenium-webdriver
```

## Run the Script

Save the link-checking code as `brokenLinks.js` in the project folder, then run:

```bash
node brokenLinks.js
```

Chrome should open the Wikipedia India page. The link checks run through Node.js, and results appear in your terminal.

## Configuration

Edit these constants at the top of `brokenLinks.js`:

```javascript
const PAGE_URL = 'https://en.wikipedia.org/wiki/India';
const MAX_LINKS = 50;       // Set to Infinity for all unique links
const CONCURRENCY = 3;     // Number of URLs checked in parallel
const TIMEOUT_MS = 10000;  // Request timeout, in milliseconds
const USER_AGENT = 'QA-LinkChecker/1.0 (your-email@example.com)';
```

First run: Use `MAX_LINKS = 50` to test a small sample. Change it to `Infinity` if you want to check all unique HTTP/HTTPS links discovered on the page.

Before checking Wikipedia: Replace `your-email@example.com` with genuine contact information in your User-Agent, and respect the website's automated-access policies and rate limits. Avoid raising `CONCURRENCY` unnecessarily.

## Sample Terminal Output

The values below are illustrative only, not live results from Wikipedia.

```text
Opening website...
Page Title: India - Wikipedia
Total Anchor Links: 1200
Unique Links to Check: 50
Checked 25/50
Checked 50/50

========== BROKEN LINKS ==========
1. [404] https://example.com/missing-page

========== FINAL REPORT ==========
Website: https://en.wikipedia.org/wiki/India
Total Anchor Links: 1200
Unique Links Checked: 50
Working Links: 46
Broken Links: 1
Unknown Links: 3
==================================
```

## How Link Status Is Classified

| HTTP Result | Classification | Explanation |
| --- | --- | --- |
| 200–399 | Working | Success or a successfully followed redirect |
| 404, 500, and most other 4xx/5xx results | Broken | Request received an error response |
| 401, 403, 408, 429, 503 | Unknown | Authentication, blocked requests, rate limits, or temporary unavailability |
| Timeout or network error | Unknown | The link could not be reliably verified |

A `403 Forbidden` response does not prove that a webpage is broken. Also, a successful HTTP response doesn't guarantee the page content is correct.

## Counting Rules

- Total Anchor Links: All elements with an `href` attribute found on the page.
- Unique Links Checked: Distinct HTTP/HTTPS URLs checked, up to `MAX_LINKS`.
- Working Links: URLs returning a successful status (200–399).
- Broken Links: URLs classified as error responses.
- Unknown Links: URLs that couldn't be verified with confidence.

The three result categories add up to Unique Links Checked.

They do not necessarily add up to Total Anchor Links because some anchors are duplicates or use non-HTTP schemes such as `mailto:`.

## Common Troubleshooting

### Cannot find module 'selenium-webdriver'

Run the following command inside your project folder:

```bash
npm install
```

Verify that you're executing the script from the correct folder.

### Chrome Doesn't Open

- Verify that Google Chrome is installed.
- Update Chrome if necessary.
- Check your Node.js version.
- Verify Selenium installation.
- Make sure ChromeDriver is compatible with Chrome.

### Many URLs Return 403 or 429

The website may restrict automated requests or rate-limit traffic.

- Reduce concurrent requests.
- Test fewer URLs.
- Follow the website's access policies.
- Treat these results as unknown rather than automatically broken.

### Script Execution Is Slow

External websites may respond slowly or time out.

Start with:

```javascript
const MAX_LINKS = 50;
```

Once the script works correctly, increase the limit.

## QA Interview Explanation

### Why Use Selenium and fetch() Together?

Selenium WebDriver is used to open webpages, locate web elements, and extract hyperlinks.

JavaScript's `fetch()` method is used to send HTTP requests and retrieve response status codes.

Selenium alone cannot determine whether a hyperlink returns HTTP 404 or HTTP 500.

Combining Selenium and JavaScript HTTP requests allows us to:

1. Extract all hyperlinks from a webpage.
2. Remove duplicate links.
3. Validate HTTP response codes.
4. Identify working links.
5. Identify broken links.
6. Handle blocked or unverified links.
7. Generate a summary report.

## Useful References

- [Selenium Downloads](https://www.selenium.dev/downloads/)
- [Selenium JavaScript API](https://www.selenium.dev/selenium/docs/api/javascript/)
- [Selenium Manager Documentation](https://www.selenium.dev/documentation/selenium_manager/)
- [Wikimedia User-Agent Policy](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy)

## License

This example project is intended for learning and QA practice.
