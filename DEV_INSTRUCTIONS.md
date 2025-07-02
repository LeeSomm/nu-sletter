# Nu-sletter Development Instructions

## Project Overview

**Name:** Nu-sletter  
**Purpose:** A weekly newsletter service for long-distance friends to stay connected through shared questions and responses.
**Side Note:** "Nu-sletter" is a play on words for Sigma Nu, which was my friends and my fraternity in college.

## Current Status (as of 2025-07-02)

- **Phase 1 (Core Setup):** Mostly complete. SvelteKit project is set up, Firebase is configured, and basic authentication is implemented. The database schema is defined, but security rules need to be finalized.
- **Phase 2 (Question System):** Not started.
- **Phase 3 (Newsletter Generation):** In progress. The core LLM integration for generating newsletter summaries is functional using the Google Generative AI API. The next steps are to build out the email templating and sending mechanism.
- **`src/lib/server/newsletter.ts`:** This file now successfully uses the `@google/genai` library to generate a newsletter summary from a list of responses. The previous implementation using the deprecated `google/generative-ai` has been updated.

## Core Functionality

### User Authentication
- Implement Firebase Authentication with two methods:
  - Email/password authentication
  - Google OAuth integration
- Create login/signup pages with proper error handling
- Implement authentication state management throughout the app

### Weekly Question System
- Each user receives a unique question every week
- Users have until Sunday (end of week) to submit their response
- Questions are drawn from three sources:
  1. User-submitted questions from previous weeks
  2. Hard-coded questions (admin-curated)
  3. LLM-generated questions
- Implement question assignment logic to ensure uniqueness per user per week

### User Question Submission
- Users must submit their own question each week alongside their response
- Submitted questions enter the question pool for future weeks
- Include validation to ensure question quality and appropriateness

### Newsletter Generation & Distribution
- Every Monday, automatically:
  1. Collect all responses from the previous week
  2. Generate newsletter summary using LLM integration
  3. Email newsletter to all participants
- Implement fallback handling for users who didn't respond

### Question Database Management
- Store questions with metadata (source type, creation date, usage count)
- Implement question rotation to avoid repetition
- Admin interface for managing hard-coded questions

## Technical Implementation

### Tech Stack
- **Frontend:** SvelteKit with Svelte 5 (using runes)
- **Backend:** SvelteKit server-side functions
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Consider Vercel, Netlify, or Firebase Hosting

### Database Schema

#### Users Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  createdAt: timestamp,
  isActive: boolean,
  preferences: {
    emailNotifications: boolean,
    timezone: string
  }
}
```

#### Questions Collection
```javascript
{
  id: string,
  text: string,
  source: 'user' | 'admin' | 'llm',
  createdBy: string, // uid if user-submitted
  createdAt: timestamp,
  usageCount: number,
  isActive: boolean,
  category?: string
}
```

#### Weekly Sessions Collection
```javascript
{
  id: string, // e.g., "2024-W01"
  weekStart: timestamp,
  weekEnd: timestamp,
  status: 'active' | 'collecting' | 'completed',
  newsletterSent: boolean,
  participants: string[] // array of uids
}
```

#### User Responses Collection
```javascript
{
  id: string,
  sessionId: string,
  userId: string,
  questionId: string,
  response: string,
  submittedQuestion: string,
  submittedAt: timestamp,
  wordCount: number
}
```

#### Newsletters Collection
```javascript
{
  id: string,
  sessionId: string,
  content: string, // HTML content
  summary: string, // LLM-generated summary
  generatedAt: timestamp,
  sentAt: timestamp,
  recipients: string[]
}
```

### Key Features to Implement

#### Authentication Flow
- Create authentication store using Svelte runes
- Implement route protection for authenticated users
- Handle authentication state persistence

#### Question Assignment Algorithm
- Weekly cron job (or scheduled function) to assign questions
- Ensure each user gets a unique question they haven't answered before
- Balance question sources (user/admin/LLM generated)

#### Response Collection System
- Form for users to submit their weekly response
- Include character/word limits and validation
- Show deadline countdown and submission status

#### LLM Integration
- Integrate with Google Generative AI API for:
  - Newsletter summary generation
  - Question generation when pool is low
- Implement proper error handling and fallbacks

#### Email System
- Integrate with email service (SendGrid, Resend, or similar)
- Create HTML email templates for newsletters
- Handle email delivery failures and bounces

#### Admin Dashboard
- Interface for managing questions
- View weekly participation rates
- Manual newsletter generation/resending capabilities

### Development Phases

#### Phase 1: Core Setup
- ✅ Set up SvelteKit project with Svelte 5
- ✅ Configure Firebase project and initialize SDK
- ✅ Implement basic authentication
- 🟡 Create database schema and security rules (Schema defined, rules need implementation)

#### Phase 2: Question System
- ⬜ Build question management system
- ⬜ Implement weekly question assignment
- ⬜ Create response submission interface
- ⬜ Set up basic user dashboard

#### Phase 3: Newsletter Generation
- 🟡 Integrate LLM service for content generation (Core summary generation is working)
- ⬜ Build email template system
- ⬜ Implement automated newsletter creation and sending
- ⬜ Add email service integration

#### Phase 4: Polish & Features
- ⬜ Create admin dashboard
- ⬜ Add user preferences and settings
- ⬜ Implement proper error handling and logging
- ⬜ Add analytics and monitoring

### Environment Variables Needed
```
const firebaseConfig = 

GOOGLE_API_KEY=
EMAIL_SERVICE_API_KEY=
EMAIL_FROM_ADDRESS=

ADMIN_EMAIL=
```

### Security Considerations
- Implement Firebase Security Rules for Firestore
- Validate all user inputs server-side
- Rate limit question submissions and responses
- Protect admin endpoints with proper authentication
- Sanitize user content before including in newsletters

### Deployment Checklist
- Set up CI/CD pipeline
- Configure environment variables
- Set up monitoring and error tracking
- Configure email service and verify sending domain
- Test automated weekly processes
- Set up backup procedures for user data

### Future Enhancement Ideas
- Mobile app version
- Rich text editor for responses
- Photo sharing capabilities
- Question categories and themes
- Analytics dashboard for engagement
- Integration with calendar apps for reminders
- Social features (liking responses, comments)

## Getting Started

1. Initialize SvelteKit project with TypeScript
2. Install and configure Firebase SDK
3. Set up basic authentication flow
4. Create initial database structure
5. Build minimal viable product with core question/response cycle
6. Gradually add newsletter generation and email features

Remember to test thoroughly with a small group of friends before full deployment!