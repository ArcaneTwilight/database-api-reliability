# IR Data Monitor

The dashboard reads the `stocks` collection in Firestore and checks it every 1 minute, retaining up to 1,440 checks for a rolling 24-hour history. On dashboard load, it asks the server to compare the three mock stock records in `lib/stocks.ts` with Firestore and create or update only documents whose supplied fields differ. The Firestore document IDs are `HPQ`, `INTC`, and `IBM`.

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
