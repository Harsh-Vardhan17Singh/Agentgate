# AgentGate — AI Security Gateway

**A security gateway for AI agents that controls tool execution through risk assessment, policy enforcement, human approval, and audit logging.**

[![Backend](https://img.shields.io/badge/Backend-NestJS-red)](https://nestjs.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)](https://vite.dev/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-green)](https://www.mongodb.com/atlas)
[![Deployment](https://img.shields.io/badge/Deployment-Render%20%2B%20Vercel-purple)](https://render.com/)

## Live Application

- **Frontend:** https://agentgate-kappa.vercel.app/
- **Backend API:** https://agentgate-api-lua5.onrender.com

The backend and frontend have been deployed.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [How AgentGate Works](#how-agentgate-works)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Gateway Decision Flow](#gateway-decision-flow)
- [Approval and Execution Lifecycle](#approval-and-execution-lifecycle)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Security Design](#security-design)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Current Limitations](#current-limitations)
- [Future Improvements](#future-improvements)

---

## Overview

AI agents can interact with external tools to create issues, manage branches, access services, and perform other actions. Giving an agent direct access to these tools can introduce risks when requests are unsafe, unauthorized, or incorrectly interpreted.



Instead of executing every request immediately, AgentGate checks whether the requested tool and operation are registered, evaluates the associated risk, applies security policies, and determines whether the request should be allowed, blocked, or sent for human approval.

The goal is to make AI tool execution more controlled, observable, and accountable.

## Problem Statement

Direct AI-agent access to external tools can create several security concerns:

- Unauthorized tool usage.
- Destructive or high-risk operations.
- Insufficient human oversight.
- Duplicate or conflicting approval actions.
- Limited visibility into execution decisions.
- Difficulty investigating actions after execution.

AgentGate addresses these concerns by introducing a centralized security decision layer before tool execution.

## How AgentGate Works

Every incoming tool request passes through the gateway before execution is considered.

1. **Tool registration:** Verify that the requested tool and operation are registered.
2. **Risk assessment:** Calculate the risk associated with the operation and its target.
3. **Policy evaluation:** Evaluate the request against configured security policies.
4. **Final decision:** Determine whether the request is allowed, blocked, or requires approval.
5. **Approval workflow:** For approval-required requests, wait for an authorized reviewer.
6. **Execution:** Execute an allowed operation through the execution service.
7. **Audit logging:** Record relevant decisions and lifecycle events.

The gateway is designed to prevent unapproved or blocked requests from reaching the execution layer.

## Core Features

### 1. Tool Registration and Validation

- Validates registered tools and supported operations.
- Blocks unknown tools and unsupported operations.
- Prevents requests from bypassing the gateway's registration checks.

### 2. Risk Assessment

- Calculates a risk level for tool operations.
- Uses the risk result as an input to the final security decision.
- Applies a critical-risk override that blocks critical-risk requests.

### 3. Policy Enforcement

- Evaluates requests against configured policies.
- Supports automatic allow, block, and approval-required decisions.
- Keeps security decisions centralized in the gateway.

### 4. Human Approval Workflow

- Creates approval records for requests requiring reviewer intervention.
- Supports approval and rejection.
- Prevents duplicate approval or rejection transitions.
- Prevents execution after a request has been rejected.
- Executes eligible requests after approval.

### 5. Centralized Execution

- Routes approved operations through a centralized execution service.
- Separates security decisions from the actual execution logic.
- Includes simulated execution for supported mock operations.
- Includes a GitHub API integration for supported repository operations.

**Important:** A simulated operation demonstrates the gateway workflow but does not perform a real external action. Real integrations require valid credentials, appropriate permissions, and successful external API responses.

### 6. Audit Logging

- Records security decisions and execution lifecycle events.
- Integrates audit events with gateway, approval, and execution workflows.
- Provides visibility into relevant actions for investigation and review.

### 7. Reviewer Authentication

- Provides reviewer login, logout, and session-check endpoints.
- Validates the reviewer key on the backend.
- Uses server-side sessions stored in MongoDB.
- Regenerates the session after successful login to mitigate session fixation.
- Protects approval and audit endpoints with reviewer authentication.

---

## Architecture

```text
                 AI Agent / Client
                        |
                        v
                AgentGate Gateway
                        |
              Tool Registration Check
                        |
                        v
                  Risk Service
                        |
                        v
                 Policy Service
                        |
                        v
                Final Decision
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
        BLOCK     REQUIRE APPROVAL    ALLOW
          |             |             |
          v             v             |
       Stop Request     v             |
                  Reviewer Decision    |
                    /         \        |
                   v           v      |
                APPROVE      REJECT    |
                   |           |      |
                   +----+------+      |
                        |             |
                        v             v
                  Execution Service
                        |
              +---------+---------+
              |                   |
              v                   v
        GitHub Integration   Simulated Tools
              |
              v
         External GitHub API

       Gateway / Approval / Execution
                        |
                        v
                   Audit Service
                        |
                        v
                    MongoDB
```

The architecture separates the gateway's security decisions from tool execution. Approval and audit functionality are implemented as separate backend modules.

### Deployed Architecture

```text
Browser
   |
   v
Vercel
React + Vite Frontend
   |
   | HTTPS + session credentials
   v
Render
NestJS Backend
   |
   +------> MongoDB Atlas
   |        Application data
   |        Reviewer sessions
   |
   +------> GitHub API
            Supported repository operations
```

The frontend communicates with the backend using the configured `VITE_API_URL`. Reviewer secrets remain on the backend.

---

## Gateway Decision Flow

The gateway orchestration is implemented in:

`backend/src/gateway/gateway.service.ts`

```text
Incoming Tool Request
        |
        v
Tool Registration Check
        |
        v
Risk Calculation
        |
        v
Policy Evaluation
        |
        v
Critical Risk Override
        |
        v
Final Decision
        |
   +----+-------------------+
   |            |           |
   v            v           v
  BLOCK       REQUIRE      ALLOW
              APPROVAL
   |            |           |
   v            v           v
  Stop       Wait for     Execute
             Reviewer
                |
           +----+----+
           |         |
           v         v
        APPROVE    REJECT
           |         |
           v         v
        Execute     Stop
```

The final decision depends on the registered tool, calculated risk, configured policy, and critical-risk override.

Critical-risk operations are blocked even if a policy would otherwise allow them.

---

## Approval and Execution Lifecycle

Approval records and execution status are treated separately so that the system can track both the review decision and what happened during execution.

### Approval Status

- `PENDING` — awaiting a reviewer decision.
- `APPROVED` — approved by an authorized reviewer.
- `REJECTED` — rejected by an authorized reviewer.

### Execution Status

- `NOT_EXECUTED` — execution has not started.
- `EXECUTING` — execution is in progress.
- `EXECUTED` — execution completed successfully.
- `FAILED` — execution failed.
- `UNKNOWN` — the final outcome cannot be confirmed safely.

### Lifecycle

```text
PENDING
   |
   +----> REJECTED
   |         |
   |         v
   |     No Execution
   |
   +----> APPROVED
             |
             v
          EXECUTING
             |
        +----+------+
        |           |
        v           v
     EXECUTED     FAILED

Uncertain execution outcome
             |
             v
          UNKNOWN
```

The implementation includes duplicate-transition protection and an execution-claim mechanism. Uncertain outcomes are not automatically retried because the external action may already have occurred.

This avoids blindly repeating potentially destructive operations when the system cannot establish whether the first attempt succeeded.

---

## Technology Stack

| Component | Technology |
|---|---|
| Backend framework | NestJS |
| Backend language | TypeScript |
| Runtime | Node.js |
| Frontend | React |
| Frontend tooling | Vite |
| Styling | Tailwind CSS |
| Database | MongoDB Atlas |
| Database integration | Mongoose |
| Reviewer sessions | Express Session |
| Session storage | Connect Mongo |
| External integration | GitHub REST API |
| Backend hosting | Render |
| Frontend hosting | Vercel |
| Version control | Git and GitHub |
| Automated testing | Jest and ts-jest |

---

## Project Structure

```text
Agentgate/
├── backend/
│   ├── src/
│   │   ├── approval/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── execution/
│   │   ├── gateway/
│   │   ├── policy/
│   │   ├── risk/
│   │   ├── tools/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

This is a high-level representation of the project. Individual files may change as implementation evolves.

---

## Security Design

AgentGate incorporates several security controls:

- **Centralized decisions:** Tool requests pass through the gateway before execution.
- **Tool registration:** Unknown tools and operations are rejected.
- **Risk-based decisions:** Risk assessment informs allow, block, and approval-required outcomes.
- **Critical-risk override:** Critical-risk requests are blocked.
- **Reviewer authentication:** Sensitive reviewer routes require an authenticated session.
- **Session regeneration:** Successful login regenerates the session identifier.
- **HTTP-only cookies:** Browser JavaScript cannot directly read the session cookie.
- **Secure production cookies:** Production cookies use HTTPS and cross-site cookie settings.
- **Origin validation:** Browser-session state-changing requests are checked against the configured frontend origin.
- **Input validation:** NestJS validation rejects unexpected request properties where configured.
- **Execution-state protection:** Duplicate approval/rejection transitions are guarded, and uncertain execution outcomes are not automatically retried.
- **Secret separation:** Backend credentials are configured on the server rather than exposed as frontend variables.

### Security Limitations

These controls are part of the implementation, not a guarantee that the entire application is production-secure.

Deployment should include end-to-end checks for browser cookie behavior, CORS, CSRF protections, session expiration, authorization boundaries, database permissions, and external API credentials.

Vercel and Render's default domains are cross-site. Browser restrictions on third-party cookies can affect reviewer session persistence even when cookies are configured correctly.

---

## Environment Variables

Configure environment variables in the hosting provider's dashboard. Do not commit real secrets to Git.

### Backend — Render

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Set to `production` for deployment. |
| `PORT` | Port supplied by Render. The application reads this value when available. |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `REVIEWER_API_KEY` | Secret used to authenticate reviewer login. |
| `REVIEWER_SESSION_SECRET` | Strong, separate secret used to sign session cookies. |
| `FRONTEND_ORIGIN` | Exact origin of the deployed frontend, without a trailing slash. |
| `GITHUB_TOKEN` | Token used by the GitHub integration. |
| `GITHUB_OWNER` | GitHub account or organization owning the target repository. |
| `GITHUB_REPOSITORY` | Target repository name, without the owner or full URL. |

Example non-secret configuration:

```text
NODE_ENV=production
FRONTEND_ORIGIN=https://agentgate-kappa.vercel.app
GITHUB_OWNER=<your-github-owner>
GITHUB_REPOSITORY=Agentgate
```

The example is for documentation only. Set the actual values privately in Render.

Generate a strong session secret and use a different secret for the reviewer API key. Do not reuse exposed or previously shared secrets.

The GitHub token should have only the permissions required by the supported operations.

### Frontend — Vercel

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Public base URL of the deployed backend API. |

Example:

```text
VITE_API_URL=https://agentgate-api-lua5.onrender.com
```

Vite variables prefixed with `VITE_` are included in the frontend bundle. They must never contain reviewer keys, session secrets, database credentials, or private GitHub tokens.

After changing a Vite environment variable, trigger a new frontend build and deployment.

---

## Local Development

### Prerequisites

- Node.js compatible with the project.
- npm.
- A MongoDB instance or MongoDB Atlas database.
- Git.
- A GitHub token if testing real GitHub operations.

### 1. Clone the repository

```bash
git clone https://github.com/Harsh-Vardhan17Singh/Agentgate.git
cd Agentgate
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a local `.env` file containing the required backend variables. Use private local credentials and do not commit the file.

Example structure:

```text
NODE_ENV=development
PORT=3000
MONGODB_URI=<your-mongodb-connection-string>
REVIEWER_API_KEY=<your-local-reviewer-key>
REVIEWER_SESSION_SECRET=<your-local-session-secret>
FRONTEND_ORIGIN=http://localhost:5173
GITHUB_TOKEN=<your-github-token>
GITHUB_OWNER=<your-github-owner>
GITHUB_REPOSITORY=Agentgate
```

Replace placeholders with your own values. Generate separate secrets for local development and production.

### 3. Start the backend

```bash
npm run start:dev
```

The backend uses port `3000` by default unless another port is configured.

### 4. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```text
VITE_API_URL=http://localhost:3000
```

Do not add backend secrets to this file.

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173`

---

## Testing

The backend automated test suite was verified during the deployment work.

Latest recorded local results:

```text
Test Suites: 12 passed, 12 total
Tests:       43 passed, 43 total
```

TypeScript validation also completed without errors:

```bash
npx tsc --noEmit
```

The NestJS production build completed successfully:

```bash
npm run build
```

Run the tests locally from the backend directory:

```bash
npm test -- --runInBand
```

The backend's Jest script enables Node's VM modules support for the current ESM configuration.

**Testing note:** These results describe the recorded local test run. They do not establish that every production integration, browser session, or external GitHub operation has passed an end-to-end test.

---

## Deployment

AgentGate uses Vercel for the frontend, Render for the backend, and MongoDB Atlas for persistence.

### Backend — Render

The backend service uses:

- **Root directory:** `backend`
- **Build command:** `npm install --include=dev && npm run build`
- **Start command:** `npm run start:prod`

Configure all required backend environment variables before startup.

### Frontend — Vercel

The frontend project uses:

- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Environment variable:** `VITE_API_URL`

Set `VITE_API_URL` to the real Render backend URL and redeploy after changing it.

### MongoDB Atlas

The backend uses MongoDB for application persistence and reviewer session storage.

Use a dedicated database user with limited permissions. Restrict network access to appropriate trusted sources whenever the hosting plan and network configuration permit it.

Avoid leaving a broad IP allowlist in place without assessing the exposure and available alternatives.

### Post-deployment verification

After deploying, verify:

1. The backend starts successfully.
2. The frontend loads.
3. The frontend sends requests to the expected backend URL.
4. Reviewer login succeeds with the correct key.
5. The reviewer session persists across page refreshes.
6. Logout invalidates the previous session.
7. Approval and audit routes reject unauthenticated requests.
8. Approval, rejection, and execution behavior match the configured policies.
9. GitHub operations work with the intended repository permissions.
10. CORS and browser cookie behavior work in the target browsers.

---

## Current Limitations

AgentGate is an actively developed security gateway. The following points should be considered when evaluating its current capabilities:

- Some tool operations use simulated execution rather than real external actions.
- Real GitHub operations depend on token validity, repository permissions, and GitHub API availability.
- Browser session persistence across the deployed Vercel and Render domains requires end-to-end verification.
- MongoDB connectivity and session persistence should be verified in the deployed environment.
- Unit-test success does not replace security testing or production monitoring.
- Uncertain external execution outcomes require careful handling and must not be blindly retried.

These limitations are documented to distinguish implemented behavior from assumptions about production readiness.

---

## Future Improvements

Potential next steps include:

- End-to-end tests for login, logout, and session persistence.
- Stronger production CSRF protections and browser compatibility checks.
- More comprehensive integration tests for real tool execution.
- Improved operational monitoring and structured security event analysis.
- Additional tool adapters behind the existing gateway and policy enforcement layer.
- Deployment-specific network restrictions and database hardening.

Future work should preserve the central security principle: **all tool execution must remain subject to AgentGate's registration, risk, policy, and approval controls.**

---

## Project Goal

AgentGate demonstrates how AI-agent tool access can be controlled using a centralized security gateway with risk assessment, policy enforcement, human oversight, and auditability.

The project prioritizes a clear, testable security workflow over unnecessary infrastructure complexity.

**AI agents should not receive unrestricted tool access. Their actions should be evaluated, controlled, and observable.**
