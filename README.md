<<<<<<< HEAD
# Next.js Google Auth UI

This project is a custom Next.js App Router login screen that matches the shared reference: blue gradient background, glassy white cards, role picker, and Google authentication.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file:

```env
AUTH_SECRET=replace-with-a-long-random-string
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

3. In Google Cloud Console, add these redirect URLs:

```text
http://localhost:3000/api/auth/callback/google
```

4. Start the app:

```bash
npm run dev
```

## Notes

- `/` is the custom sign-in page.
- `/dashboard` is protected and only opens for authenticated users.
- The selected role is passed into the post-login redirect so you can later connect it to profile provisioning or onboarding logic.
=======
# sgs-frontend
>>>>>>> a3bfc6de4ce2c5c2db30d33251c1fad417e2a1df
