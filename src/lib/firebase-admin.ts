import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Robust cleanup to strip leading/trailing quotes and replace literal newlines
    const cleanedKey = privateKey
      .replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: cleanedKey,
      }),
    });
  } else {
    // Fallback/Mock initialization during build time using a syntactically valid RSA PEM private key to bypass OpenSSL crashes
    const validDummyKey = [
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2e1Rskbb6PhaY\nskAwjWMjf7Fjj/Yf02tLrqCCsOLVWEU6yQfX7+gH32cbQ9yF8eDhpxVvkmuQv6m5\nKeF8rCnpMjRnRgMtihNfuu3P5COHBdOyZvHDhobNR9ewwE6hIva6GhkhX+5TnGtR\nklJVAbJzt212AnbsBPjw3CxZJHTews7pL+cLowk9tSjzLQXCE/B09MYRFEcLOiWf\nsFuoF8KLQnLb8nsAfnSyeF6CpllJrUkKb/yVfdR9+iV2q/O6T1+LkASoqWtn3+0b\nxh9yvpMotMCT2oO6slBMthfV7E47Cq1k6eOSHR+3e2GYx1zZUvmxMU1VzzNpvgt+\nyFT9LG73AgMBAAECggEAHOMIGcm1XAbRH+nzxFvVakywAZFMBny62vexXA7xUZGQ\nH/6r2bCWHAzu7v9+nMuN7Fq9R3S3x2m3zeKF2e0NE2fJqOGJ5j8Z0wkt1T+Jqjmv\naenm8qtMkpmBWO8QY2y7/vjbqo9blGvKB1cw5lkG7U+Hqes49SLSX5qTAKeHQq3y\nkfPLlQWdJ94byoz92Xi1fVwX6mJI9TMIhiNDaZajvR89al4HIS93L+3cMiuSkJpU\nW90T/ZkgXlxbBxOXHF9wsvLdGraOck7AxB6GepUMu+3FYsGIUG3ROrdxJEpj5qCS\nBeVgwI7OtnPn1BCD0xqQ7HRdUZoZMtpeiCC2Tl5UzQKBgQDZByq4iS0Q3wsLJOHv\nf4yH3kMnHPE5oVSbxVGYFU0lP+IWvDRhVUmW82etg5/Gg3l1ZrfZFwTJ7aI2W6DN\ncoLAZnaP6aO37tMFhQbd+VidjQzmqulWkqgReNckQTLSRqQI7tT58NRh997goUNM\nOU+CG/CQfMAE4fns8wcnKI2M/QKBgQDXQBA5KWm9KRMFpOrN2XH6ftewY0KEn434\neIXviYMVUucwH85ALr0tz1NQLfouJEHX8/qrHuZ0eRsJYxtIbsxcXMRGCGeGUb/H\nQRcDXMLeYE9eOKwCFemO7LpGNvrlL0DvGCSde1fvVAitCepmCadZ8l9g3o0+Uvhp\nDgmK7kFoAwKBgQCXWbApUUDkayfAddA6vbC7b/1U4ZI4ppHisBDfBrvuJkb9o/LD\njj7rzoOXNhvOzRF/FktQUgU87UQatHvHyvv0QYCdjEpok10GlGbdlm5+MUe19asU\nfOJIjQU8e1t92VW8BRLx20nBqKL99HiCR9Vy3xk9KkKfJRiubi2m2Vkd4QKBgCfk\ndZ1CcZhfLmlTYTj5XchhDbRhEQjnUTaFj70PLT4ceUBQBLecce81h2lKvB0lFxbg\n3sosFeXsM/iPZ5ULA9DyWGXqVNVt/S7+fzdeT7dK/iqmMirIyNp2QSeWNPWYxl4J\niW+uVmPCnUEEn259x4hCBS88z8yHMAa4VUhsU67lAoGAZ4HPWcI+rOx4yMK/ZB39\nCc4WbaiDXueI1b4CjHjJl01fChGwGxzn/BtFu1HI1WgxAcq+025YgwLuad98iJEz\nD8wofgBc+BHTw0Sp1yALJ5b5Y5pimxBommfWUXg5UrIq4Two4NGmUagAEFvTB256\n8pAhOFeovT5itGaUjVFmjas=\n-----END PRIVATE KEY-----\n"
    ].join("\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "masjid-agullia",
        clientEmail: "firebase-adminsdk-fbsvc@masjid-agullia.iam.gserviceaccount.com",
        privateKey: validDummyKey,
      }),
    });
  }
}

export const adminMessaging = admin.messaging();
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export { admin };
