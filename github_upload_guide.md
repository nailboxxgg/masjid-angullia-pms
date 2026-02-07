# GitHub Upload Guide: masjid-angullia-pms

This document classifies the files in your project into three categories: **Safe to Upload**, **Sensitive (Must Exclude)**, and **Suspicious/Redundant**.

## 🔴 Sensitive Files (DO NOT UPLOAD)
These files contain keys, secrets, or configuration that could compromise your security if exposed.

- `.env.local`: Contains your actual Firebase and SMS API keys.
- `.env`: (If it exists) Any file starting with `.env`.
- `node_modules/`: Large library folder (automatically ignored).
- `.next/`: Build artifacts (automatically ignored).
- `*.pem`: Private keys (if any).

## 🟢 Safe to Upload
These files contain your application logic, structure, and dependencies.

- `src/`: All your components, logic, and pages.
- `public/`: Assets like images and icons.
- `package.json` & `package-lock.json`: Your project's dependency list.
- `tsconfig.json`: TypeScript configuration.
- `next.config.ts`: Next.js configuration.
- `.gitignore`: Instructions for Git on what to ignore.
- `.env.local.example`: A template for environment variables (placeholders only).
- `README.md`: Documentation.

## 🟡 Suspicious / Redundant Files
These files look like leftovers or nested repositories that should be investigated or removed.

- `masjid-angullia/`: This folder contains another `.git` folder. It appears to be a nested repository or a mistake. Unless you have a specific reason for it, you should probably delete it or ensure it doesn't contain sensitive data.

## Security Best Practices
1. **Never hardcode keys**: Always use `process.env.VARIABLE_NAME`.
2. **Double-check .gitignore**: Ensure it contains `.env*`.
3. **Use .env.local.example**: Provide this file with empty values so others know what variables are needed.
