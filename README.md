# IR Data Monitor

The dashboard reads the `stocks` collection in Firestore and checks it every 1 minute, retaining up to 1,440 checks for a rolling 24-hour history. On dashboard load, it asks the server to compare the three mock stock records in `lib/stocks.ts` with Firestore and create or update only documents whose supplied fields differ. The Firestore document IDs are `HPQ`, `INTC`, and `IBM`.

## Metrics API

Use `GET /api/metrics` to retrieve the current uptime percentage and average latency over the rolling 24-hour monitoring window. The endpoint is read-only and allows cross-origin requests for use by other web apps:

```json
{
  "uptime": 99.93,
  "averageLatency": 691,
  "unit": "ms",
  "window": "24h",
  "totalChecks": 1440,
  "successfulChecks": 1439,
  "failedChecks": 1,
  "latestTimestamp": "2026-10-05T10:51:00.000Z",
  "databaseStatus": "operational"
}
```

The numbers above are an example; the endpoint calculates them from actual Firestore checks. `uptime` is the percentage of successful checks, and `averageLatency` is the mean check duration in milliseconds. The endpoint performs a check when requested, so it also works independently of the dashboard's one-minute polling. Checks are held in process memory and are reset when the server restarts or when requests reach a different server instance; for durable metrics across restarts or multiple instances, persist check records in a shared data store.

Create/enable Firestore in the service account's Firebase project and set `FIREBASE_SERVICE_ACCOUNT_JSON` to the service-account JSON in the server's environment (for local development, copy `.env.example` to `.env.local` and set the value there; `.env.local` is git-ignored). In `.env.local`, quote the entire JSON value so dotenv treats it as one multiline value. Keep the private key's `\n` sequences escaped inside its JSON string:

```env
FIREBASE_SERVICE_ACCOUNT_JSON='{
  "type": "service_account",
  "project_id": "ir-mobile-app-mock-data",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "YOUR_SERVICE_ACCOUNT_EMAIL",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "YOUR_CERTIFICATE_URL",
  "universe_domain": "googleapis.com"
}'
```

Replace the example values using the complete JSON downloaded from Firebase; do not leave required fields blank or include the `FIREBASE_SERVICE_ACCOUNT_JSON=` line inside the JSON. Grant the service account only the Firestore permissions it needs. The Firebase Admin SDK runs only on the server and bypasses Firestore Security Rules; never expose the service-account secret to the browser or commit it.

## Deploy to Vercel

1. Push this repository to GitHub. Keep `.env.local` and all real service-account credentials out of Git; `.env*` files are ignored except for the blank `.env.example` template.
2. In Vercel, choose **Add New Project**, import the GitHub repository, and keep the detected Next.js framework and default build settings. Vercel uses `next build` to build the app.
3. In the Vercel project's **Settings → Environment Variables**, add `FIREBASE_SERVICE_ACCOUNT_JSON` with the complete Firebase service-account JSON as its value. Add it for each environment you plan to use (Production, Preview, and/or Development). Do not prefix it with `NEXT_PUBLIC_`.
4. Enable Firestore in the Firebase project and grant the service account the required Firestore access. Redeploy after adding or changing environment variables.

The app can build without Firebase credentials, but Firestore-backed API requests return an error until `FIREBASE_SERVICE_ACCOUNT_JSON` is configured. The monitoring history is held in process memory, so it is not shared between Vercel instances and is reset when an instance restarts. Run `npm run typecheck` locally to check TypeScript before pushing.
