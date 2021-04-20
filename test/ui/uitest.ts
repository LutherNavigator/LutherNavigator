/*
 * Tests pages using three major browser engines: Chromium, Firefox, and
 * WebKit. The tests can be deployed using `npx ts-node uitest.ts` command.
 * These tests are when the `--emulation` argument is passed to `test.py`.
 *
 */
import { chromium, firefox, webkit } from "playwright";

const PAGEMAP = {
  "https://www.luthernavigator.com": "landing.png",
  "https://www.luthernavigator.com/about": "about.png",
  "https://www.luthernavigator.com/login": "login.png",
  "https://www.luthernavigator.com/password-reset": "password.png",
  "https://www.luthernavigator.com/post": "post.png",
  "https://www.luthernavigator.com/query": "query.png",
  "https://www.luthernavigator.com/register": "register.png",
  "https://www.luthernavigator.com/restaurant": "restaurant.png",
  "https://www.luthernavigator.com/terms": "terms.png",
};

(async () => {
  for (const browserType of [chromium, firefox, webkit]) {
    // Launch a browser
    const browser = await browserType.launch();

    // Create a context
    const context = await browser.newContext();

    // Create a page
    const page = await context.newPage();

    // Carry out actions for all urls
    for (let url in PAGEMAP) {
      // Go to a page
      await page.goto(url);

      // Take a screenshot
      await page.screenshot({
        path: `screenshots/${browserType.name()}/${PAGEMAP[url]}`,
      });
    }

    // Close a browser
    await browser.close();
  }
})();
