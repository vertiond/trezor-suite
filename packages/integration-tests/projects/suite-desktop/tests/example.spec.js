const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');

let window, electronApp;

test.beforeAll(async () => {
  // Launch Electron app.

  electronApp = await electron.launch({
    cwd: '../suite-desktop',
    args: ['./dist/app.js'],
  });

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath();
  });

});

test('window has correct title', async () => {
  // await new Promise((resolve) => setTimeout(() => { resolve() }, 10000))
  window = await electronApp.firstWindow();

  const title = await window.title();
  expect(title).toBe('Trezor Suite');
})

test.afterAll(async () => {
  // Exit app.
  await electronApp.close();
});
