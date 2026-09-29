import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testIgnore: /admin-host\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:3100",
    actionTimeout: 10000,
    storageState: {
      cookies: [
        {
          name: "portfolio-visitor-locale",
          value: "pt-BR",
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node ../backend/test/browser-server.js",
      url: "http://127.0.0.1:3101/api/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --port 3100",
      url: "http://localhost:3100/admin",
      env: { API_URL: "http://127.0.0.1:3101" },
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
