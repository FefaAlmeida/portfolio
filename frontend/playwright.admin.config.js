import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: /admin-host\.spec\.js/,
  use: { ...base.use, storageState: { cookies: [], origins: [] } },
  webServer: base.webServer.map((server) => ({
    ...server,
    url: server.url.replace("/admin", "/api/health"),
    env: {
      ...server.env,
      PUBLIC_URL: "http://localhost:3100",
      ADMIN_URL: "http://admin.localhost:3100",
    },
  })),
});
