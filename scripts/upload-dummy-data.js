#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin SDK
let admin;
try {
  // Try to load service account key from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin = initializeApp({
      credential: cert(serviceAccount),
      projectId: 'nu-sletter'
    });
    console.log('✓ Using service account from environment variable');
  } else {
    throw new Error('No service account found in environment');
  }
} catch (error) {
  console.log('Service account key not found in environment. Trying default credentials...');
  console.log('Make sure you have GOOGLE_APPLICATION_CREDENTIALS environment variable set');
  console.log('or run: firebase login && firebase projects:list');
  
  // Alternative: Use default credentials (requires Firebase CLI login)
  admin = initializeApp({
    projectId: 'nu-sletter'
  });
}

const db = getFirestore(admin);

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
  
  const batch = db.batch();
  let batchCount = 0;
  const batchSize = 500; // Firestore batch limit
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    
    // Remove the ID from the document data to avoid duplication
    const docData = { ...doc };
    
    // Determine document ID
    let docId;
    if (doc.id) {
      docId = doc.id;
      delete docData.id;
    } else if (doc.uid) {
      docId = doc.uid;
      delete docData.uid;
    } else {
      // Generate a random ID if no ID field is found
      docId = db.collection(collectionName).doc().id;
    }
    
    // Convert date strings to Firestore Timestamps
    const convertedData = convertDates(docData);
    
    const docRef = db.collection(collectionName).doc(docId);
    batch.set(docRef, convertedData);
    batchCount++;
    
    // Commit batch if we reach the limit or it's the last document
    if (batchCount === batchSize || i === documents.length - 1) {
      try {
        await batch.commit();
        console.log(`  ✓ Uploaded batch of ${batchCount} documents`);
        
        // Create a new batch for the next set of documents
        if (i < documents.length - 1) {
          const newBatch = db.batch();
          batchCount = 0;
        }
      } catch (error) {
        console.error(`  ✗ Error uploading batch:`, error);
        throw error;
      }
    }
  }
  
  console.log(`  ✓ Successfully uploaded all ${documents.length} documents to ${collectionName}`);
}

// Main function to read and upload data
async function uploadDummyData() {
  try {
    console.log('🚀 Starting dummy data upload...');
    
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
  node scripts/upload-dummy-data.js [options]

Options:
  --help, -h     Show this help message

Setup:
  1. Download your service account key from Firebase Console:
     - Go to Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save as 'serviceAccountKey.json' in project root
     
  2. Or set up default credentials:
     - Run: firebase login
     - Run: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

Example:
  node scripts/upload-dummy-data.js
  `);
  process.exit(0);
}

// Run the upload
uploadDummyData();
