# AgentGate Frontend

The frontend application for **AgentGate**, an AI security gateway that helps control tool execution through risk assessment, policy enforcement, human approval, and audit logging.

Built with React, TypeScript, and Vite, the frontend provides the reviewer interface for signing in, reviewing pending approvals, and viewing security activity through the backend API.

## Live Application

- **Frontend:** https://agentgate-kappa.vercel.app/
- **Backend API:** https://agentgate-api-lua5.onrender.com

The frontend is deployed on Vercel and communicates with the NestJS backend hosted on Render.

---

## Overview

AgentGate's frontend provides a dashboard for interacting with the backend's reviewer and security workflows.

The interface is designed to let an authenticated reviewer access approval and audit functionality without exposing backend credentials in the browser.

### Key Features

- Reviewer login interface.
- Reviewer session status checking.
- Reviewer logout flow.
- Approval review interface.
- Security activity and audit views.
- API communication with the AgentGate backend.
- Environment-based API URL configuration.
- React and TypeScript-based component architecture.

The availability of individual dashboard features depends on the backend endpoints, reviewer permissions, and successful session authentication.

## Technology Stack

- **UI library:** React
- **Language:** TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS
- **API communication:** Fetch API
- **Deployment:** Vercel
- **Backend:** NestJS on Render

## Architecture

```text
Reviewer
   |
   v
React + TypeScript Dashboard
   |
   v
Frontend API Service
   |
   | HTTPS requests
   | Session credentials
   v
AgentGate Backend
   |
   +----> Reviewer Authentication
   |
   +----> Approval Management
   |
   +----> Audit Records
```

The frontend handles presentation and user interaction. Security decisions, credential validation, policy enforcement, and execution remain responsibilities of the backend.

## Project Structure

```text
frontend/
├── src/
│   ├── services/
│   │   └── api.ts
│   ├── App.tsx
│   └── ...
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

This is a high-level structure. Refer to the current source files for the complete list of components and services.

### API Service

The frontend API service is responsible for communicating with the backend.

It supports reviewer session operations, including:

- Login.
- Session status checks.
- Logout.
- Requests for approval and audit data.

Reviewer requests use browser credentials where required for server-side session authentication.

## Environment Variables

The frontend uses a Vite environment variable to identify the backend API.

### Local development

Create `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:3000
```

### Production

Configure the following variable in the Vercel project settings:

```dotenv
VITE_API_URL=https://agentgate-api-lua5.onrender.com
```

After changing an environment variable, trigger a new Vercel deployment so the frontend is rebuilt with the updated configuration.

### Important security note

Vite variables prefixed with `VITE_` are exposed to client-side code.

**Never store these values in frontend environment variables:**

- `REVIEWER_API_KEY`
- `REVIEWER_SESSION_SECRET`
- `MONGODB_URI`
- `GITHUB_TOKEN`

These secrets belong exclusively in the backend's private environment configuration.

## Local Development

### Prerequisites

- Node.js compatible with the project.
- npm.
- The AgentGate backend running locally or another accessible backend instance.

### 1. Install dependencies

From the repository root:

```bash
cd frontend
npm install
```

### 2. Configure the API URL

Create `.env.local` with:

```dotenv
VITE_API_URL=http://localhost:3000
```

Ensure the backend is configured to accept requests from the local frontend origin.

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173`

### 4. Build for production

```bash
npm run build
```

The production assets are generated in the `dist/` directory.

### 5. Preview the production build

```bash
npm run preview
```

## Deployment on Vercel

The frontend is deployed to Vercel.

Recommended project configuration:

- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Environment variable:** `VITE_API_URL`
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set the production API URL in Vercel's environment variable settings, then redeploy the frontend.

## Backend Connection and Authentication

The production frontend communicates with:

`https://agentgate-api-lua5.onrender.com`

Reviewer authentication uses backend-managed sessions rather than embedding a reviewer API key into the deployed JavaScript bundle.

The backend is responsible for setting and validating the session cookie. The frontend must include credentials on session-authenticated requests.

### Cross-origin considerations

The Vercel and Render default domains are on different sites. The backend must allow the exact frontend origin and support credentialed requests.

Production session cookies are configured for HTTPS and cross-site usage. However, some browsers restrict third-party cookies, which may prevent sessions from persisting across these domains.

Verify login, page refresh, and logout in the deployed browser. If sessions remain unreliable, consider using custom domains under the same parent domain or a same-origin proxy.

## Verification Checklist

After deployment, verify the following:

- [ ] The frontend loads successfully.
- [ ] The API URL points to the correct Render service.
- [ ] Reviewer login reaches the backend.
- [ ] Invalid