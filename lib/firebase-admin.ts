import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const firebaseProjectId = 'ir-mobile-app-mock-data'

function loadServiceAccount(): ServiceAccount {
  const serializedAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serializedAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured')
  }

  let account: unknown
  try {
    account = JSON.parse(serializedAccount)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON')
  }

  if (
    typeof account !== 'object' ||
    account === null ||
    !('project_id' in account) ||
    typeof account.project_id !== 'string' ||
    !('client_email' in account) ||
    typeof account.client_email !== 'string' ||
    !('private_key' in account) ||
    typeof account.private_key !== 'string'
  ) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing required service-account fields')
  }
  if (account.project_id !== firebaseProjectId) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON must belong to project ${firebaseProjectId}`)
  }

  return {
    projectId: account.project_id,
    clientEmail: account.client_email,
    privateKey: account.private_key,
  }
}

export function getAdminFirestore() {
  const appName = 'ir-data-monitor'
  const app = getApps().find((existingApp) => existingApp.name === appName)
    ?? initializeApp({ credential: cert(loadServiceAccount()), projectId: firebaseProjectId }, appName)

  return getFirestore(app)
}
