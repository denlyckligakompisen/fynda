import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const db = getFirestore(app);
const auth = getAuth(app);

async function test() {
  try {
    await signInAnonymously(auth);
    console.log('SIGNED IN ANONYMOUSLY');
    await setDoc(doc(db, 'analyses', 'test_id'), { test: 'data' });
    console.log('SUCCESS WRITE');
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
test();
