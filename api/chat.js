/**
 * Grok Student Assistant - Vercel Serverless Function
 * Handles student questions securely by proxying requests to the xAI Grok API.
 * Keeps the API key safely stored on the server side.
 */

export default async function handler(req, res) {
  // Set CORS headers for safe same-origin or preview requests
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed. Please use POST."
    });
  }

  // Parse body if passed as string (e.g. from custom dev server or edge wrappers)
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON in request body." });
    }
  }

  const rawMessage = body?.message;
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!message) {
    return res.status(400).json({
      error: "Please enter a question."
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      error: "Please keep your question under 2,000 characters."
    });
  }

  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    console.error("Missing XAI_API_KEY environment variable.");
    return res.status(500).json({
      error: "The AI service is not configured. Please contact the project owner."
    });
  }

  const model = process.env.XAI_MODEL || "grok-4.6";

  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        instructions:
          "You are a helpful student study assistant. Explain concepts clearly, " +
          "use simple language, and organise longer answers with short headings and bullet points where helpful. " +
          "If you are unsure, say so. Do not claim that your answer is guaranteed correct.",
        input: message
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("xAI API error:", response.status, data);
      const detailMsg = data?.error?.message || data?.message;
      return res.status(502).json({
        error: detailMsg
          ? `AI service error: ${detailMsg}`
          : "The AI service could not answer right now. Please try again."
      });
    }

    if (!data) {
      return res.status(502).json({
        error: "Received an invalid response format from the AI service."
      });
    }

    // Extract answer according to xAI Responses API spec, with fallbacks
    let answer = data.output_text;

    if (!answer && Array.isArray(data.output)) {
      answer = data.output
        .filter((item) => item.type === "message")
        .flatMap((item) => item.content || [])
        .filter((part) => part.type === "output_text")
        .map((part) => part.text)
        .join("\n")
        .trim();
    }

    // Secondary fallback for standard chat completion structure if proxy/mock used
    if (!answer && data.choices?.[0]?.message?.content) {
      answer = data.choices[0].message.content.trim();
    }

    if (!answer) {
      return res.status(502).json({
        error: "The AI service returned an empty response. Please try again."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Chat function exception:", error);
    return res.status(500).json({
      error: "Something went wrong while processing your question. Please try again."
    });
  }
}
