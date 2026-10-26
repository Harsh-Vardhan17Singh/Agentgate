# AgentGate Backend

The backend service for **AgentGate**, a security gateway that evaluates AI-agent tool requests before allowing execution.

Built with NestJS and TypeScript, the backend coordinates tool registration, risk assessment, policy enforcement, human approvals, execution, authentication, and audit logging.

## Live API

- **Production API:** https://agentgate-api-lua5.onrender.com
- **Frontend:** https://agentgate-kappa.vercel.app/

The API is hosted on Render, with MongoDB Atlas configured for persistence. Successful deployment does not by itself verify every endpoint or external integration.

---

## Overview

AgentGate introduces a centralized security layer between an AI agent and the tools it can invoke.

Every request passes through a security workflow that checks the tool registration, calculates risk, evaluates policy, and determines whether to block the request, allow execution, or require human approval.

The backend also provides reviewer authentication, approval management, execution services, and audit logging.

## Core Features

- Tool registration and operation validation.
- Risk assessment and policy evaluation.
- Blocking of unknown or unsupported operations.
- Critical-risk blocking.
- Human approval and rejection workflows.
- Protection against duplicate approval and rejection transitions.
- Centralized execution service.
- Simulated execution for supported mock operations.
- GitHub API integration for supported repository operations.
- Audit lifecycle integration.
- Reviewer login, logout, and session verification.
- MongoDB integration and persistent reviewer sessions.

## Architecture

```text
Incoming Tool Request
        |
        v
Gateway Service
        |
        v
Tool Registration Check
        |
        v
Risk Service
        |
        v
Policy Service
        |
        v
Final Security Decision
        |
   +----+-------------------+
   |            |           |
   v            v           v
  BLOCK       APPROVAL     ALLOW
              REQUIRED
                 |
                 v
          Reviewer Decision
             /       \
            v         v
         APPROVE    REJECT
            |         |
            v         v
         Execute     Stop
            |
            v
      Execution Service
            |
       +----+-----+
       |          |
       v          v
    GitHub     Simulated
     API       Execution

 Gateway / Approval / Execution
                |
                v
           Audit Service
                |
                v
             MongoDB
```

## Backend Modules

| Module | Responsibility |
|---|---|
| `GatewayModule` | Orchestrates the security decision workflow. |
| `ToolsModule` | Validates registered tools and supported operations. |
| `RiskModule` | Calculates operation risk. |
| `PolicyModule` | Evaluates security policies. |
| `ApprovalModule` | Manages approval and rejection workflows. |
| `ExecutionModule` | Coordinates execution of eligible operations. |
| `AuditModule` | Records security and execution lifecycle events. |
| `AuthModule` | Provides reviewer authentication and protected routes. |

### Gateway Decision Flow

**Main file:** `src/gateway/gateway.service.ts`

The gateway coordinates the security pipeline:

1. Validate the requested tool and operation.
2. Calculate risk for the request.
3. Evaluate the applicable policy.
4. Apply the critical-risk override.
5. Determine the final decision.
6. Block, execute, or create an approval request as appropriate.
7. Record relevant lifecycle events through the audit system.

The gateway separates security decisions from execution logic so that external operations cannot simply bypass the policy layer.

## Reviewer Authentication

The backend provides the following reviewer session endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/reviewer/login` | Authenticate a reviewer and establish a session. |
| `POST` | `/reviewer/logout` | Destroy the reviewer session. |
| `GET` | `/reviewer/session` | Check the current authentication state. |

Approval and audit routes are protected by reviewer authentication. Agent management routes are also protected where the reviewer guard is applied.

Authentication uses a backend-configured reviewer key and server-side sessions. The session cookie is HTTP-only, and production cookie settings are configured for HTTPS.

### Approval and Audit Endpoints

The backend includes routes for:

- Listing pending approvals.
- Approving an eligible request.
- Rejecting an eligible request.
- Retrieving audit records.

Consult the corresponding controllers for the exact route parameters and response formats.

## Execution Safety

Approval state and execution state are tracked separately.

### Approval states

- `PENDING`
- `APPROVED`
- `REJECTED`

### Execution states

- `NOT_EXECUTED`
- `EXECUTING`
- `EXECUTED`
- `FAILED`
- `UNKNOWN`

The implementation includes protection against duplicate approval transitions and a centralized execution-claim mechanism.

When an execution outcome is uncertain, the operation is not automatically retried. This is important because a remote service may have completed an action even if the backend did not receive a successful response.

**Note:** Simulated operations are not real external actions. GitHub operations require a valid token and the necessary repository permissions.

---

## Technology Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Runtime:** Node.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Configuration:** `@nestjs/config`
- **Authentication:** Express Session
- **Session store:** Connect Mongo
- **External API:** GitHub REST API
- **Testing:** Jest and TypeScript tooling
- **Hosting:** Render

## Project Structure

```text
backend/
├── src/
│   ├── approval/
│   ├── audit/
│   ├── auth/
│   ├── execution/
│   ├── gateway/
│   ├── policy/
│   ├── risk/
│   ├── tools/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── package.json
├── tsconfig.json
└── README.md
```

This structure summarizes the principal modules. Refer to the source files for the complete implementation.

---

## Environment Variables

Create a local `.env` file in the backend directory for development. Configure production values in the Render dashboard.

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime environment, such as `development` or `production`. |
| `PORT` | Port used by the server; Render provides this in deployment. |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `REVIEWER_API_KEY` | Secret used to authenticate reviewers. |
| `REVIEWER_SESSION_SECRET` | Strong secret used to sign session cookies. |
| `FRONTEND_ORIGIN` | Exact allowed frontend origin. |
| `GITHUB_TOKEN` | Token for supported GitHub operations. |
| `GITHUB_OWNER` | GitHub account or organization that owns the repository. |
| `GITHUB_REPOSITORY` | Target repository name. |

Example development configuration:

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=<your-mongodb-connection-string>
REVIEWER_API_KEY=<your-reviewer-key>
REVIEWER_SESSION_SECRET=<your-strong-session-secret>
FRONTEND_ORIGIN=http://localhost:5173
GITHUB_TOKEN=<your-github-token>
GITHUB_OWNER=<your-github-owner>
GITHUB_REPOSITORY=Agentgate
```

Replace the placeholders with your own values. Do not commit real credentials or paste them into public issues.

**Security requirements:**

- Keep all backend secrets out of the frontend.
- Generate a strong, unique session secret.
- Use a separate reviewer API key.
- Give the GitHub token only the permissions it needs.
- Use a database account with limited privileges.
- Restrict database network access where practical.

---

## Local Development

### Prerequisites

- A compatible Node.js version.
- npm.
- MongoDB Atlas or another configured MongoDB instance.
- Git.
- A GitHub token if testing real GitHub operations.

### 1. Install dependencies

From the repository root:

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create the backend `.env` file and set the required values described above.

### 3. Start in development mode

```bash
npm run start:dev
```

The application defaults to port `3000` unless configured otherwise.

### 4. Build for production

```bash
npm run build
```

### 5. Start the production build

```bash
npm run start:prod
```

### 6. Run tests

```bash
npm test -- --runInBand
```

For the current ESM-based project, use the test command configured in `package.json`. If Jest reports ESM loading errors, fix the test configuration rather than assuming the tests passed.

Additional scripts, including coverage or end-to-end tests, depend on the scripts defined in `package.json`.

---

## Deployment on Render

The backend is deployed as a Render web service.

Recommended service configuration:

- **Root directory:** `backend`
- **Build command:** `npm install --include=dev && npm run build`
- **Start command:** `npm run start:prod`

Configure the required environment variables in Render before starting the service.

### Frontend connection

The deployed frontend uses:

```text
VITE_API_URL=https://agentgate-api-lua5.onrender.com
```

The backend uses:

```text
FRONTEND_ORIGIN=https://agentgate-kappa.vercel.app
```

`FRONTEND_ORIGIN` must be the exact origin of the deployed frontend, without a trailing slash.

After changing environment variables, redeploy the relevant service.

### Production verification

After deployment, verify:

1. The backend starts and connects to MongoDB.
2. Reviewer login succeeds with the correct key.
3. The session persists after refreshing the frontend.
4. Logout invalidates the session.
5. Protected routes reject unauthenticated requests.
6. Approval and rejection transitions behave correctly.
7. Execution outcomes and audit events are recorded as expected.
8. GitHub operations work with the configured permissions.
9. Browser cookie behavior and CORS work on the deployed domains.

Vercel and Render default domains are cross-site, so browser restrictions on third-party cookies may affect session persistence. Verify this in the target browser before treating the reviewer authentication flow as production-ready.

---

## Testing and Verification

Previously recorded local verification included:

- TypeScript compilation with no reported errors.
- A successful NestJS production build.
- A reported test run of 12 suites and 43 tests passing.

These are historical local results, not a guarantee that every test currently passes or that all deployed integrations work.

Before a release, run the build and test commands against the current code and perform end-to-end checks against the deployed services.

## Current Limitations

- Some supported operations use simulated execution.
- Real GitHub actions depend on token permissions and API availability.
- Production session persistence needs browser-level verification.
- A successful build does not prove that every external integration works.
- Security testing is still necessary for authentication, CSRF protection, authorization, and deployment configuration.

## Security Principle

**No tool execution should bypass AgentGate's registration, risk assessment, policy enforcement, and approval requirements.**

The backend is designed to make AI-agent actions controlled, auditable, and safer to operate.

---

## License

Add the project's chosen license here if one has been selected.
