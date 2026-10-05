# Changelog

All notable changes to this project are documented in this file.

## [1.0.0] - 2026-10-05

### Added

- Delivered the initial **IR Data Monitor** web application using Next.js, React, TypeScript, Tailwind CSS, and Recharts.
- Added a responsive API health dashboard with summary cards for uptime, average latency, most recent check, and Firestore status.
- Added uptime and response-latency charts, including failed-check counts and a rolling view of monitoring results.
- Added a Firestore stock-collection table showing each document's symbol, company, sector, price, and price change.
- Added a manual refresh action and automatic status refresh every minute.
- Added the `/api/status` endpoint:
  - `GET` reads and validates stock documents from Firestore, measures request latency, and returns database status, stock data, and monitoring metrics.
  - `POST` seeds or updates the sample stock documents using a Firestore batch, writing only records whose supplied fields are missing or differ.
- Added sample stock records for HP Inc. (`HPQ`), Intel Corporation (`INTC`), and IBM (`IBM`).
- Added server-side Firebase Admin SDK initialization from `FIREBASE_SERVICE_ACCOUNT_JSON`, with validation for required service-account fields and the expected Firebase project.
- Added setup instructions for configuring Firestore and the service-account credential, including guidance to keep credentials out of source control and the browser.
- Added application metadata, light/dark theme icons, and production-only Vercel Analytics integration.

### Notes

- Monitoring checks are held in process memory and capped at 1,440 entries (a nominal 24-hour window at one check per minute). They are not persisted and will reset when the server process restarts.
- The dashboard requires a valid Firestore service account to read status and seed stock data.
