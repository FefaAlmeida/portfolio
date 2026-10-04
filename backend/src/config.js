import path from "node:path";
export function configuration(env = process.env) {
  const production = env.NODE_ENV === "production";
  const config = {
    production,
    port: Number(env.PORT || 3001),
    publicUrl: env.PUBLIC_URL || "http://localhost:3000",
    adminUrl: env.ADMIN_URL || env.PUBLIC_URL || "http://localhost:3000",
    database: path.resolve(env.DATABASE_PATH || "./data/portfolio.sqlite"),
    backupDir: path.resolve(env.BACKUP_DIR || "./data/backups"),
    backupSchedule: env.BACKUP_SCHEDULE || "0 3 * * *",
    s3: {
      endpoint: env.S3_ENDPOINT || "http://localhost:19000",
      region: env.S3_REGION || "us-east-1",
      bucket: env.S3_BUCKET || "portfolio",
      accessKeyId: env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: env.S3_SECRET_ACCESS_KEY || "",
    },
    operationsToken: env.OPERATIONS_TOKEN || "",
    geminiApiKey: env.GEMINI_API_KEY || "",
    i18nSyncToken: env.I18N_SYNC_TOKEN || "",
    i18nGatewayUrl: env.I18N_GATEWAY_URL || "",
    i18nUsdBrlRate: Number(env.I18N_USD_BRL_RATE || 7),
  };
  if (!Number.isFinite(config.i18nUsdBrlRate) || config.i18nUsdBrlRate <= 0)
    throw new Error("I18N_USD_BRL_RATE deve ser uma cotação positiva.");
  if (config.i18nSyncToken && config.i18nSyncToken.length < 32)
    throw new Error("I18N_SYNC_TOKEN deve ter pelo menos 32 caracteres.");
  if (config.i18nGatewayUrl && !config.i18nGatewayUrl.startsWith("https://"))
    throw new Error("I18N_GATEWAY_URL deve usar HTTPS.");
  if (
    production &&
    (!env.PUBLIC_URL ||
      !config.publicUrl.startsWith("https://") ||
      config.operationsToken.length < 32)
  )
    throw new Error(
      "PUBLIC_URL HTTPS e OPERATIONS_TOKEN de pelo menos 32 caracteres são obrigatórios.",
    );
  if (new URL(config.publicUrl).origin !== config.publicUrl)
    throw new Error(
      "PUBLIC_URL deve conter apenas a origem, sem caminho ou barra final.",
    );
  if (new URL(config.adminUrl).origin !== config.adminUrl || (production && !config.adminUrl.startsWith("https://")))
    throw new Error("ADMIN_URL deve conter uma origem HTTPS válida em produção.");
  return config;
}
