/* eslint-disable mocha/no-global-tests */
/* eslint-disable no-console */
import { test, expect } from "@playwright/test";

test("run browser mocha tests", async ({ page }) => {
  console.log("Running browser mocha tests");
  await page.goto("/");
  const timeout = 50000;
  const progressEl = await page.waitForSelector("#completed-status", { timeout });
  await progressEl.waitForElementState("stable", { timeout });
  const progressClass = await progressEl.getAttribute("class");
  const message = await progressEl.innerText();
  expect(progressClass, message).toBe("passed");
});
