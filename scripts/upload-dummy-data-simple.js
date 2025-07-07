#!/usr/bin/env node

// Simple version for Firebase Emulator
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, writeBatch, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config (same as your client app)
const firebaseConfig = {
  apiKey: "AIzaSyDFhyzOhqxvULD8u6mYPTJZlcKyLOXmwXE",
  authDomain: "nu-sletter.firebaseapp.com",
  projectId: "nu-sletter",
  storageBucket: "nu-sletter.firebasestorage.app",
  messagingSenderId: "585489543813",
  appId: "1:585489543813:web:d2c254477fbdba17d72fec",
  measurementId: "G-BX1NQZVGQ8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator if specified
const useEmulator = process.argv.includes('--emulator');
if (useEmulator) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firestore Emulator');
  } catch (error) {
    console.log('⚠️  Could not connect to emulator, using production');
  }
}

// Function to convert ISO date strings to Firestore Timestamps
function convertDates(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Check if it's an ISO date string
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (isoDateRegex.test(obj)) {
      return Timestamp.fromDate(new Date(obj));
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDates);
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertDates(value);
    }
    return converted;
  }
  
  return obj;
}

// Function to upload a collection
async function uploadCollection(collectionName, documents) {
  console.log(`\nUploading ${documents.length} documents to collection: ${collectionName}`);
  
  for (let i = 0; i < documents.length; i += 500) {
    const batch = writeBatch(db);
    const batchDocs = documents.slice(i, i + 500);
    
    for (const document of batchDocs) {
      // Determine document ID
      let docId;
      if (document.id) {
        docId = document.id;
      } else if (document.uid) {
        docId = document.uid;
      } else {
        // Generate a random ID if no ID field is found
        docId = doc(collection(db, collectionName)).id;
      }
      
      // Remove the ID from the document data to avoid duplication
      const docData = { ...document };
      delete docData.id;
      delete docData.uid;
      
      // Convert date strings to Firestore Timestamps
      const convertedData = convertDates(docData);
      
      const docRef = doc(db, collectionName, docId);
      batch.set(docRef, convertedData);
    }
    
    try {
      await batch.commit();
      console.log(`  ✓ Uploaded batch of ${batchDocs.length} documents`);
    } catch (error) {
      console.error(`  ✗ Error uploading batch:`, error);
      throw error;
    }
  }
  
  console.log(`  ✓ Successfully uploaded all ${documents.length} documents to ${collectionName}`);
}

// Main function to read and upload data
async function uploadDummyData() {
  try {
    console.log('🚀 Starting dummy data upload...');
    
    if (useEmulator) {
      console.log('🔧 Using Firebase Emulator');
    } else {
      console.log('☁️  Using Production Firestore');
    }
    
    // Read the JSON file
    const jsonPath = path.join(__dirname, '..', 'bulk_dummy_data.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📄 Loaded data from: ${jsonPath}`);
    console.log(`📊 Found collections: ${Object.keys(data).join(', ')}`);
    
    // Upload each collection
    for (const [collectionName, documents] of Object.entries(data)) {
      if (Array.isArray(documents)) {
        await uploadCollection(collectionName, documents);
      } else {
        console.log(`⚠️  Skipping ${collectionName} - not an array`);
      }
    }
    
    console.log('\n🎉 All data uploaded successfully!');
    
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

// Add command line options
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
Upload Dummy Data to Firestore

Usage:
  node scripts/upload-dummy-data-simple.js [options]

Options:
  --help, -h       Show this help message
  --emulator       Use Firebase Emulator instead of production

Examples:
  node scripts/upload-dummy-data-simple.js              # Upload to production
  node scripts/upload-dummy-data-simple.js --emulator   # Upload to emulator

Note: This version uses the Firebase client SDK and your existing config.
For production uploads, make sure you're authenticated with Firebase CLI.
  `);
  process.exit(0);
}

// Run the upload
uploadDummyData();
