# Google Authentication Setup

The application uses Google OpenID Connect to verify users, then stores its own
30-day sessions in MySQL. Google passwords and tokens are never stored.

## Google Cloud configuration

1. Create a Google Cloud project and open **Google Auth Platform**.
2. Configure the audience as **External** and add your Google account as a test
   user.
3. Create an OAuth client with application type **Web application**.
4. Add this authorized redirect URI for local development:

   ```text
   http://localhost:4200/api/auth/google/callback
   ```

5. Copy the generated client ID and client secret into the environment file.

Only the `openid`, `email`, and `profile` scopes are requested.

## Docker Compose

Create the local environment file and fill in the Google credentials:

```bash
cp .env.example .env
```

Authentication changes the user schema. The existing local database is
disposable, so reset it once before starting this version:

```bash
docker compose down --volumes
docker compose up --build
```

Open `http://localhost:4200/signin` and select **Continue with Google**.

## API development

For NestJS outside Compose, copy `api/.env.example` to `api/.env`, fill in the
same Google credentials, and start MySQL and the API:

```bash
docker compose up -d db
cd api
npm run start:dev
```

## Production

Use the deployed HTTPS URLs for `GOOGLE_CALLBACK_URL` and `WEB_URL`, and add the
exact callback to the Google OAuth client. HTTPS automatically enables the
`Secure` flag on authentication cookies. Never commit either `.env` file or the
Google client secret.
