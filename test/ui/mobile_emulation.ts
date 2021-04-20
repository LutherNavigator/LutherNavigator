/*
 * The code performs mobile device emulation and accesses pages using three
 * major browser engines: Chromium, Firefox, and WebKit. The tests can be
 * deployed using `npx ts-node mobile_emulation.ts` command. However, it is
 * already automated so that every times tests are run with the `--emulation`
 * argument, these tests also get executed.
 *
 */
import { chromium, firefox, webkit, devices } from "playwright";

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

// Devices to test
const device_names = [
  "iPhone SE 280-320px",
  "iPhone X 375-425px",
  "iPad 768 px",
  "iPad mini landscape",
  "Google Nexus 6P landscape",
  "Google Pixel 2 XL",
  "Samsung Galaxy S5",
  "Amazon Kindle Fire HDX",
];

(async () => {
  for (const browserType of [chromium, firefox, webkit]) {
    for (const device_name of device_names) {
      // A mobile device to be tested
      const device = devices[device_name];

      // Launch a browser
      const browser = await browserType.launch();

      // Create a context
      const context = await browser.newContext({ ...device });

      // Create a page
      const page = await context.newPage();

      // Carry out actions for all urls
      for (let url in PAGEMAP) {
        // Go to a page
        await page.goto(url);

        // Take a screenshot
        await page.screenshot({
          path: `screenshots/mobile/${device_name.replace(
            / /g,
            "_"
          )}/${browserType.name()}/${PAGEMAP[url]}`,
        });
      }

      // Close a browser
      await browser.close();
    }
  }
})();
