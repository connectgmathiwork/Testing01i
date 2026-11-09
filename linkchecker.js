const { Builder, Browser } = require('selenium-webdriver');

const PAGE_URL = 'https://en.wikipedia.org/wiki/India';

// Change this to 50 for a quick test, or Infinity to check every link.
const MAX_LINKS = Infinity;

// Keep concurrent requests low to avoid overloading websites.
const CONCURRENCY = 3;
const TIMEOUT_MS = 10000;

// Replace with your actual contact email when checking Wikipedia.
const USER_AGENT = 'QA-LinkChecker/1.0 (your-email@example.com)';

// Send an HTTP request and return its status code.
async function getStatus(url, method = 'HEAD') {
    const response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
            'User-Agent': USER_AGENT
        }
    });

    // Avoid downloading large response bodies.
    if (response.body) {
        await response.body.cancel();
    }

    return response.status;
}

// Check whether a URL is working, broken, or unverified.
async function checkLink(url) {
    let status;

    try {
        status = await getStatus(url, 'HEAD');

        // Some websites don't support HEAD requests.
        if ([403, 404, 405, 501].includes(status)) {
            status = await getStatus(url, 'GET');
        }

    } catch (error) {
        try {
            // Try GET if HEAD fails.
            status = await getStatus(url, 'GET');
        } catch (getError) {
            return {
                url,
                status: 'N/A',
                result: 'UNKNOWN',
                reason: getError.message
            };
        }
    }

    if (status >= 200 && status < 400) {
        return { url, status, result: 'WORKING' };
    }

    // These responses don't reliably prove a link is broken.
    if ([401, 403, 408, 429, 503].includes(status)) {
        return { url, status, result: 'UNKNOWN' };
    }

    if (status >= 400) {
        return { url, status, result: 'BROKEN' };
    }

    return { url, status, result: 'UNKNOWN' };
}

// Main Selenium automation.
async function main() {

    let driver;

    try {
        driver = await new Builder()
            .forBrowser(Browser.CHROME)
            .build();

        console.log('Opening website...');

        await driver.get(PAGE_URL);

        console.log('Page Title:', await driver.getTitle());

        // Find all anchor elements and extract their href values.
        const allLinks = await driver.executeScript(() => {
            return Array.from(
                document.querySelectorAll('a[href]')
            ).map(link => link.href);
        });

        console.log('Total Anchor Links:', allLinks.length);

        // Keep HTTP/HTTPS links only and remove URL fragments.
        const validLinks = [];

        for (const link of allLinks) {
            try {
                const url = new URL(link);

                if (url.protocol === 'http:' ||
                    url.protocol === 'https:') {

                    url.hash = '';
                    validLinks.push(url.href);
                }
            } catch (error) {
                // Ignore invalid URLs.
            }
        }

        // Remove duplicate URLs.
        const uniqueLinks = [
            ...new Set(validLinks)
        ].slice(0, MAX_LINKS);

        console.log('Unique Links to Check:', uniqueLinks.length);

        const results = [];
        let nextIndex = 0;

        // Process links using a limited number of workers.
        async function worker() {
            while (nextIndex < uniqueLinks.length) {

                const url = uniqueLinks[nextIndex++];

                const result = await checkLink(url);

                results.push(result);

                if (results.length % 25 === 0) {
                    console.log(
                        `Checked ${results.length}/${uniqueLinks.length}`
                    );
                }
            }
        }

        await Promise.all(
            Array.from(
                { length: Math.min(CONCURRENCY, uniqueLinks.length) },
                () => worker()
            )
        );

        // Categorize results.
        const workingLinks = results.filter(
            item => item.result === 'WORKING'
        );

        const brokenLinks = results.filter(
            item => item.result === 'BROKEN'
        );

        const unknownLinks = results.filter(
            item => item.result === 'UNKNOWN'
        );

        // Print broken link details.
        console.log('\n========== BROKEN LINKS ==========');

        brokenLinks.forEach((link, index) => {
            console.log(
                `${index + 1}. [${link.status}] ${link.url}`
            );
        });

        // Print final summary.
        console.log('\n========== FINAL REPORT ==========');

        console.log('Website:', PAGE_URL);
        console.log('Total Anchor Links:', allLinks.length);
        console.log('Unique Links Checked:', results.length);
        console.log('Working Links:', workingLinks.length);
        console.log('Broken Links:', brokenLinks.length);
        console.log('Unknown Links:', unknownLinks.length);

        console.log('==================================');

    } catch (error) {
        console.error('Automation Error:', error.message);
        process.exitCode = 1;

    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

main();