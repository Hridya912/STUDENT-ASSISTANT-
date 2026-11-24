# BUILD.md — Build and Deployment Guide

This guide describes how to create and deploy the Grok Student Assistant using plain HTML, CSS, JavaScript, a Vercel Function, and the xAI Grok Responses API.

## 1. How the application is organised

- `index.html`: the page structure.
- `style.css`: visual design and responsive layout.
- `script.js`: reads the user's question, calls `/api/chat`, and displays the answer.
- `api/chat.js`: server-side Vercel Function. It reads `XAI_API_KEY` and calls xAI.
- Vercel CDN: serves the static frontend assets.
- Vercel Function: handles the dynamic AI request.

## 2. Create the project folder

Create a folder named `grok-student-assistant` and add this structure:

```text
grok-student-assistant/
├── index.html
├── style.css
├── script.js
└── api/
    └── chat.js
```

The `api` folder must be at the project root for Vercel's file-based function detection in this setup.

## 3. Create the frontend

Create `index.html`, `style.css`, and `script.js`.

Use the design requirements in [`FRONTEND.md`](FRONTEND.md). The frontend should send a JSON request to `/api/chat` with this shape:

```json
{
  "message": "Explain cloud computing in simple words."
}
```

It should expect a response similar to:

```json
{
  "answer": "Cloud computing means using computing services over the internet..."
}
```

If the request fails, show a short, user-friendly error message.

## 4. Create the Vercel Function

Create `api/chat.js`:

```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const message =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ error: "Please enter a question." });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      error: "Please keep your question under 2,000 characters."
    });
  }

  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "The AI service is not configured. Please contact the project owner."
    });
  }

  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "grok-4.6",
        instructions:
          "You are a helpful student study assistant. Explain concepts clearly, " +
          "use simple language, and organise longer answers with short headings. " +
          "If you are unsure, say so. Do not claim that your answer is guaranteed correct.",
        input: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("xAI API error:", data);
      return res.status(502).json({
        error: "The AI service could not answer right now. Please try again."
      });
    }

    // The Responses API may return text in output_text or in message content.
    const answer =
      data.output_text ||
      (data.output || [])
        .filter((item) => item.type === "message")
        .flatMap((item) => item.content || [])
        .filter((part) => part.type === "output_text")
        .map((part) => part.text)
        .join("\n")
        .trim();

    if (!answer) {
      return res.status(502).json({
        error: "The AI service returned an empty response. Please try again."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Chat function error:", error);
    return res.status(500).json({
      error: "Something went wrong while processing your question."
    });
  }
}
```

**Model note:** `grok-4.6` is used here as an example based on the xAI documentation available when this guide was prepared. Confirm the model identifier and account access in the xAI console. If that model is unavailable to your account, replace it with a currently supported text model.

## 5. Get an xAI API key

1. Open the official [xAI API documentation](https://docs.x.ai/overview).
2. Sign in to the xAI developer console.
3. Create an API key.
4. Copy it and store it securely.
5. Do not paste it into frontend code or commit it to Git.

API usage may incur charges depending on the account and model. Review the current pricing and usage limits before testing repeatedly.

## 6. Configure the environment variable in Vercel

1. Open the Vercel dashboard.
2. Create a new project and import the Git repository, or deploy the project folder using the Vercel CLI.
3. Open **Project → Settings → Environment Variables**.
4. Add:
   - Name: `XAI_API_KEY`
   - Value: your xAI API key
   - Environments: Development, Preview, and Production as required.
5. Save the variable.
6. Redeploy after adding or changing the variable. Environment-variable changes apply to new deployments, not already-created deployments.

Never name this variable `NEXT_PUBLIC_XAI_API_KEY` or expose it to browser JavaScript.

## 7. Deploy using GitHub (recommended)

1. Create a GitHub repository.
2. Add the project files.
3. Commit and push the code.
4. In Vercel, choose **Add New → Project**.
5. Import the GitHub repository.
6. For this plain static HTML + Vercel Function project, no frontend build command is required. If Vercel asks for an output directory, use the project root / default static output configuration appropriate to the detected project.
7. Add `XAI_API_KEY` in Project Settings → Environment Variables.
8. Deploy.
9. Open the deployment URL and test the chat.

Every new push to the connected production branch can trigger a new deployment. Preview deployments can be used to test changes before production.

## 8. Deploy using Vercel CLI (alternative)

Install the Vercel CLI:

```bash
npm install -g vercel
```

From the project directory, run:

```bash
vercel
```

Follow the prompts to link or create a Vercel project. Add the `XAI_API_KEY` variable in the Vercel dashboard, then deploy to production:

```bash
vercel --prod
```

For local development with Vercel's local environment support, link the project and pull development variables:

```bash
vercel link
vercel env pull .env.local
vercel dev
```

Keep `.env.local` out of Git. Add it to `.gitignore`:

```text
.env.local
.vercel
node_modules
```

## 9. Test checklist

- [ ] Homepage loads successfully.
- [ ] Static assets load and the layout works on mobile.
- [ ] Empty question is rejected by the frontend or API.
- [ ] A normal question returns a Grok answer.
- [ ] A question over the server-side character limit is rejected.
- [ ] A non-POST request to `/api/chat` returns HTTP 405.
- [ ] Missing API key produces a safe configuration error.
- [ ] API key does not appear in browser DevTools, page source, or frontend files.
- [ ] Failed API requests show a friendly message.
- [ ] The deployed site works using its Vercel URL.

## 10. CDN and request behaviour

Vercel automatically delivers static assets through its CDN. This includes the HTML, CSS, and JavaScript files in this project. The CDN can serve those files from a location close to the visitor.

The `/api/chat` route is different: it invokes a Vercel Function, which sends a live request to xAI. Do not cache personalised AI answers as public shared content. For this prototype, return the answer as a normal dynamic API response and do not add public cache headers.

A CDN improves delivery of the website's static resources; it does not make the Grok model run inside the CDN and does not guarantee that AI generation itself is instantaneous.

## 11. Common problems

| Problem | What to check |
|---|---|
| `404` on `/api/chat` | Confirm `api/chat.js` is inside the project-root `api` folder and redeploy. |
| API key missing | Check the exact variable name `XAI_API_KEY`, its environment selection, and redeploy. |
| xAI returns an error | Check model access, API credits/billing, key validity, and the xAI status/docs. |
| Frontend says network error | Confirm the deployed URL and `/api/chat` route; inspect browser Network tab. |
| Works locally but not on Vercel | Confirm the function was deployed and the environment variable is set for the active deployment. |
| No answer appears | Inspect the Vercel Function logs and confirm the response parser matches the API response. |

## Official references

- [xAI API overview](https://docs.x.ai/overview)
- [xAI text best practices / Responses API](https://docs.x.ai/developers/model-capabilities/text/best-practices)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel CDN](https://vercel.com/docs/cdn)
