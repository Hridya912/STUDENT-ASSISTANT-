# Grok Student Assistant

A beginner-friendly, cloud-hosted student Q&A website powered by the Grok API, deployed on Vercel, and delivered through Vercel's CDN.

## Project overview

**Project title:** AI-Powered Cloud-Based Student Assistant Using Grok API and Vercel CDN

Students enter a question in a simple web interface. The browser sends that question to a server-side Vercel Function. The function securely calls the xAI Grok Responses API and returns the generated answer to the browser.

Vercel's CDN delivers the static frontend files (HTML, CSS, and JavaScript) from its distributed network. The AI request itself is dynamic and is processed by the serverless function; it is not treated as a static CDN asset.

## Main features

- Ask questions in a clean chat-style interface.
- Receive AI-generated answers from Grok.
- Show loading, error, and empty states.
- Responsive layout for desktop and mobile.
- Dark visual theme: near-black background, white text, and restrained violet/blue gradients.
- API key stored on the server as an environment variable, never in browser code.
- Static frontend assets delivered through Vercel's CDN.

## Technology stack

| Technology | Role |
|---|---|
| HTML | Page structure |
| CSS | Responsive dark interface and gradients |
| JavaScript | Chat interaction in the browser |
| xAI Grok Responses API | Generates answers |
| Vercel Functions | Secure server-side API proxy |
| Vercel CDN | Delivers static website assets globally |
| GitHub (optional) | Source control and automatic deployment |

## Architecture at a glance

```text
Student's browser
      |
      | Loads HTML / CSS / JavaScript
      v
Vercel CDN  --------------------> Static frontend files
      |
      | POST /api/chat (question)
      v
Vercel Function (server-side)
      |
      | HTTPS request with XAI_API_KEY
      v
xAI Grok Responses API
      |
      | Generated answer
      v
Vercel Function
      |
      | JSON response
      v
Student's browser (renders answer)
```

## Project structure

```text
grok-student-assistant/
├── index.html
├── style.css
├── script.js
├── api/
│   └── chat.js
├── README.md
├── build.md
├── frontend.md
└── flow.md
```

The four Markdown documents explain the project and implementation. The actual application source files (`index.html`, `style.css`, `script.js`, and `api/chat.js`) must be created as described in `build.md`.

## Prerequisites

- A computer with Node.js installed (for local development tooling, if desired).
- A Vercel account.
- An xAI account with API access and an API key.
- A GitHub account (optional, but useful for deployment through Git).

API access and model availability may depend on the xAI account, billing, and current model catalogue. Check the xAI console before choosing a model.

## Quick start

1. Create the project files using the instructions in [`build.md`](build.md).
2. Add your xAI API key as the environment variable `XAI_API_KEY`.
3. Run locally using Vercel CLI, or deploy the project to Vercel.
4. Open the deployed URL and ask a test question.

See [`build.md`](build.md) for detailed steps and commands.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHridya912%2FSTUDENT-ASSISTANT-&env=XAI_API_KEY&envDescription=xAI%20API%20key%20from%20console.x.ai)

1. Go to https://vercel.com/new and import the `STUDENT-ASSISTANT-` GitHub repo.
2. Framework preset: **Other**. Leave Build Command, Output Directory and Install Command empty.
3. Under **Environment Variables** add:

   | Name | Value | Required |
   |------|-------|----------|
   | `XAI_API_KEY` | your key from https://console.x.ai | Yes |
   | `XAI_MODEL` | e.g. `grok-4.6` | No (defaults to `grok-4.6`) |

4. Click **Deploy**. Every push to `main` redeploys automatically.

If you add or change an environment variable later, redeploy (Deployments → ⋯ → Redeploy) for it to take effect.

**Routes after deploy:** `/` landing page · `/app` (or `/chat`) assistant · `/api/chat` serverless function.

### Run locally

```bash
cp .env.example .env.local   # then put your real XAI_API_KEY in it
npm run dev                  # http://localhost:3000
```

## Security and responsible use

- **Never** put the xAI API key in `script.js`, HTML, a public GitHub repository, or any variable prefixed with `NEXT_PUBLIC_` / `VITE_`.
- Keep the key in Vercel Project Settings → Environment Variables as `XAI_API_KEY`.
- Validate input on the server, limit its length, and return safe error messages.
- For a public production app, add rate limiting, abuse protection, and suitable usage limits. A simple classroom demo may not include these, but it should not be left unrestricted on a public URL.
- Do not send personal, confidential, medical, or other sensitive information to the demo.
- AI answers can be inaccurate. Students should verify important information.

## Scope and limitations

This is an educational prototype, not a full learning-management system. It does not include user accounts, chat history storage, a database, file uploads, or guaranteed factual correctness. Add those only if the assignment requires them.

## Useful official documentation

- [xAI API overview](https://docs.x.ai/overview)
- [xAI Responses API guidance](https://docs.x.ai/developers/model-capabilities/text/best-practices)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel CDN](https://vercel.com/docs/cdn)

## CAT-3 report mapping

1. **Problem Statement:** Students need a convenient way to ask study-related questions and receive explanations.
2. **Design / Diagram:** Use the architecture in [`flow.md`](flow.md).
3. **Flow of the Tool:** Explain the browser → Vercel Function → Grok API → browser sequence.
4. **Outcome:** A cloud-deployed AI assistant whose static frontend is delivered through Vercel's CDN.
