# Nu-sletter Development Instructions

## Project Overview

**Name:** Nu-sletter
**Purpose:** A newsletter service that allows users to create and manage their own newsletters, invite subscribers, and automatically generate issues based on responses to a set of questions.

## Core Functionality

### User Authentication
- Firebase Authentication with Email/Password and Google OAuth.
- Users can sign up, log in, and manage their accounts.

### Newsletter Management
- Users can create multiple, distinct newsletters.
- Each newsletter has a unique name, a prompt for the AI, and an owner.
- Users can edit and delete the newsletters they own.

### Subscriber Management
- Newsletter owners can add and remove subscribers for each of their newsletters.
- Subscribers can view newsletter issues.

### Question Management
- Each newsletter has its own set of questions.
- Newsletter owners can add and delete questions for their newsletters.

### Response Collection
- Subscribers can submit responses to the questions for a specific newsletter issue.

### Newsletter Generation
- Newsletter owners can trigger the generation of a new issue.
- The system uses the Google Generative AI API to create a summary based on the collected responses and the newsletter's prompt.
- The generated content is saved as a new issue in the newsletter's subcollection.

## Technical Implementation

### Tech Stack
- **Frontend:** SvelteKit with Svelte 5 (using runes)
- **Backend:** SvelteKit server-side functions
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Vercel, Netlify, or Firebase Hosting

### Database Schema

#### Users Collection
```javascript
// Enhanced Users Collection
{
  uid: string,
  email: string,
  displayName: string,
  createdAt: timestamp,
  isActive: boolean,
  isAdmin: boolean,
  preferences: {
    emailNotifications: boolean,
    timezone: string
  },
  newsletterMemberships: {
    [newsletterId: string]: {
      joinedAt: timestamp,
      isActive: boolean,
      answeredQuestions: string[] // move here from root level
    }
  }
}
```

#### Questions Collection
```javascript
// Enhanced Questions Collection  
{
  id: string,
  text: string,
  source: 'user' | 'admin' | 'llm',
  createdBy: string,
  newsletterId: string, // required field
  createdAt: timestamp,
  usageCount: number,
  isActive: boolean,
  category?: string,
  tags?: string[] // for better categorization
}
```

#### User Responses Collection
```javascript
// Enhanced User Responses Collection
{
  id: string,
  newsletterId: string, // required field
  sessionId: string,
  userId: string,
  questionId: string,
  response: string,
  submittedQuestion?: string, // optional if they submit a question
  submittedAt: timestamp,
  wordCount: number,
  isPublic: boolean // privacy control
}
```

#### Newsletters Collection
```javascript
// Enhanced Newsletters Collection
{
  id: string,
  name: string,
  description: string,
  prompt: string,
  owners: string[],
  moderators: string[], // additional role
  settings: {
    isPublic: boolean,
    requireApproval: boolean,
    maxMembers?: number,
    questionSubmissionRequired: boolean
  },
  createdAt: timestamp,
  isActive: boolean
}
```

#### Sessions Collection
```javascript
// Redesigned Sessions Collection
{
  id: string, // UUID instead of date-based
  newsletterId: string,
  weekIdentifier: string, // e.g., "2024-W01" for queries
  weekStart: timestamp,
  weekEnd: timestamp,
  status: 'active' | 'pending' | 'completed',
  newsletterSent: boolean,
  participantCount: number, // denormalized for efficiency
  createdAt: timestamp,
  generatedNewsletter?: string
}
```

#### Question Assignments Collection
```javascript
// New: Question Assignments Collection
{
  id: string,
  sessionId: string,
  newsletterId: string,
  userId: string,
  questionId: string,
  assignedAt: timestamp,
  answered: boolean
}
```

### Security Considerations
- Firebase Security Rules are implemented to protect data based on ownership and subscription.
- All user inputs should be validated server-side.
- Admin-level functionality is not yet implemented.

### Future Enhancement Ideas
- Automated issue generation and email distribution.
- A more robust system for managing "active" issues for responses.
- Rich text editor for responses and issue content.
- User preferences and notification settings.
- Analytics dashboard for newsletter engagement.
- Integration with calendar apps for reminders.
- Social features (liking responses, comments).
