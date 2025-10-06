import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const testData = {
  test: true,
  timestamp: new Date().toISOString()
}

try {
  const docRef = await addDoc(collection(db, 'test'), testData)
  console.log('Success! Document written with ID:', docRef.id)
} catch (error) {
  console.error('Error:', error)
}
