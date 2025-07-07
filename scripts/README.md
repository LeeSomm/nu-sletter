# Dummy Data Upload Scripts

This directory contains scripts to upload your dummy data from `bulk_dummy_data.json` to Firestore.

## Scripts Available

### 1. Admin Upload Script
- **File**: `upload-dummy-data.js`
- **Uses**: Firebase Admin SDK
- **Best for**: Production deployments, server-side operations

## Quick Start

### Option 2: Upload to Production

1. Make sure you're logged into Firebase CLI:
   ```bash
   firebase login
   ```

2. Upload data to production:
   ```bash
   npm run upload-dummy-data
   ```

## Data Structure

The script expects your JSON file to have this structure:

```json
{
  "collectionName1": [
    { "id": "doc1", "field1": "value1" },
    { "uid": "doc2", "field2": "value2" }
  ],
  "collectionName2": [
    { "id": "doc3", "field3": "value3" }
  ]
}
```

### Key Features:

- **Automatic ID handling**: Uses `id` or `uid` field as document ID, generates random ID if neither exists
- **Date conversion**: Automatically converts ISO date strings to Firestore Timestamps
- **Batch uploads**: Handles large datasets efficiently with batched writes
- **Error handling**: Provides clear error messages and progress updates

## Advanced Setup (Admin SDK)

If you want to use the Admin SDK script for production:

1. Download your service account key:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in your project root

2. Run the admin script:
   ```bash
   npm run upload-dummy-data:admin
   ```

## NPM Scripts

```bash
# Upload using simple script (production)
npm run upload-dummy-data

# Upload to Firebase emulator
npm run upload-dummy-data:emulator

# Upload using admin SDK
npm run upload-dummy-data:admin
```

## Troubleshooting

### "Permission denied" errors
- Make sure you're logged in: `firebase login`
- Check your Firestore security rules
- For admin SDK, ensure service account key is valid

### "Emulator connection failed"
- Start the emulator: `firebase emulators:start --only firestore`
- Check emulator is running on localhost:8080

### "Module not found" errors
- Make sure dependencies are installed: `npm install`
- Check that Node.js supports ES modules (Node 14+)

## Data Overview

Your `bulk_dummy_data.json` contains:
- **users**: User accounts with preferences and newsletter memberships
- **questions**: Questions for newsletters with metadata
- **userResponses**: User responses to questions
- **newsletters**: Newsletter configurations
- **sessions**: Newsletter session data
- **questionAssignments**: Question-to-user assignments

Each collection will be uploaded as a separate Firestore collection with the same name.
