const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Dynamically parse .env file to populate environment variables
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index !== -1) {
          const key = trimmed.substring(0, index).trim();
          const value = trimmed.substring(index + 1).trim().replace(/(^['"]|['"]$)/g, '');
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn('Warning: Could not parse .env file:', err.message);
}

// Initialize the app with default credentials (will load from process.env.GOOGLE_APPLICATION_CREDENTIALS)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "innerorbit-bc8ce"
});

const db = admin.firestore();

async function cleanFirestore() {
  console.log("Starting Firestore cleanup for invalid User IDs...");
  
  const publicProfilesRef = db.collection('publicProfiles');
  const snapshot = await publicProfilesRef.get();
  
  if (snapshot.empty) {
    console.log("No public profiles found.");
    return;
  }

  let deletedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const userId = data.userId;
    
    if (userId) {
      let hasDouble = false;
      for (let i = 0; i < userId.length - 1; i++) {
        if (userId[i] === userId[i+1]) {
          hasDouble = true;
          break;
        }
      }
      
      if (hasDouble) {
        console.log(`Found invalid profile: ${doc.id} with userId: ${userId}`);
        
        // Delete from publicProfiles
        await db.collection('publicProfiles').doc(doc.id).delete();
        
        // Delete from users
        await db.collection('users').doc(doc.id).delete();
        
        // Delete from Auth
        try {
          await admin.auth().deleteUser(doc.id);
          console.log(`Deleted user ${doc.id} from Auth.`);
        } catch (authErr) {
          console.log(`Failed to delete user ${doc.id} from Auth: ${authErr.message}`);
        }
        
        deletedCount++;
      }
    }
  }
  
  console.log(`Cleanup complete. Deleted ${deletedCount} invalid profiles.`);
}

cleanFirestore().catch(console.error);
