<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Student Feedback Analysis System

This app uses Firebase Authentication and Firestore, so it runs as a frontend app with Firebase as the backend.

## Local setup

1. Run `npm install`
2. Create `.env` from `.env.example`
3. Fill in your Firebase web app config
4. Run `npm run dev`

## Firebase setup

Enable these Firebase products:

- Authentication with Email/Password
- Firestore Database

Apply the rules from [firestore.rules](C:/Users/pavit/Downloads/student-feedback-analysis-system%20(1)/firestore.rules) in your Firebase project.

Collections used by the app:

- `users`
- `feedbackForms`
- `responses`

## Deploy

Deploy as a normal Vite app.

- Build command: `npm run build`
- Output directory: `dist`

For Vercel, add all `VITE_FIREBASE_*` environment variables from `.env.example`.
