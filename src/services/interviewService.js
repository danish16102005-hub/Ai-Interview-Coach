const API_BASE_URL = "/adk";
const APP_NAME = "my_agent";
const USER_ID = "prepai-user";
const AGENT_NAME = "interview_coach_agent";

function getSection(text, heading, nextHeading) {
  const expression = new RegExp(
    `\\*\\*\\s*\\d+\\.\\s*${heading}\\s*\\*\\*([\\s\\S]*?)(?=\\*\\*\\s*\\d+\\.\\s*${nextHeading}\\s*\\*\\*|(?:^|\\n)\\s*${nextHeading}:|$)`,
    "i",
  );
  return text.match(expression)?.[1]?.trim() || "";
}

function listItems(section) {
  return section
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+\.)\s*/, "").trim())
    .filter(Boolean);
}

export function parseAgentResponse(text) {
  const scoreSection = getSection(text, "Score", "Strengths");
  const scoreMatch = scoreSection.match(/\b(\d{1,2}(?:\.\d+)?)\s*\/\s*10\b/);
  const improvedAnswer = getSection(text, "Improved Answer", "Next question");
  const nextQuestionMatch = text.match(/(?:^|\n)\s*Next question:\s*([^\n]+)/i);

  return {
    text,
    score: scoreMatch ? Number(scoreMatch[1]) : null,
    strengths: listItems(getSection(text, "Strengths", "Areas for Improvement")),
    improvements: listItems(
      getSection(text, "Areas for Improvement", "Improved Answer"),
    ),
    improvedAnswer,
    nextQuestion: nextQuestionMatch?.[1]?.trim() || "",
  };
}

function extractFirstQuestion(text) {
  const labeledQuestion = text.match(/first question:\s*([\s\S]*)/i);
  if (labeledQuestion) return labeledQuestion[1].trim();

  const questionLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("?"));
  return questionLines.at(-1) || text;
}

async function requestJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      `Could not reach the local ADK server. Check that it is running at http://127.0.0.1:8000. ${error.message}`,
      { cause: error },
    );
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `The ADK server returned ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }

  return response.json();
}

export async function createSession() {
  const sessionId = crypto.randomUUID();
  await requestJson(
    `${API_BASE_URL}/apps/${APP_NAME}/users/${USER_ID}/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    },
  );
  return sessionId;
}

export async function sendMessage(sessionId, message) {
  if (!sessionId) {
    throw new Error("Start an interview before sending a message.");
  }

  const events = await requestJson(`${API_BASE_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: APP_NAME,
      userId: USER_ID,
      sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: message }],
      },
    }),
  });

  if (!Array.isArray(events)) {
    throw new Error("The ADK server returned an unexpected response.");
  }

  const agentMessages = events
    .filter((event) => event.author === AGENT_NAME)
    .flatMap((event) =>
      (event.content?.parts || [])
        .filter((part) => part.thought !== true)
        .map((part) => part.text)
        .filter((part) => typeof part === "string" && part.trim()),
    );

  if (agentMessages.length === 0) {
    const agentError = events.find((event) => event.errorMessage)?.errorMessage;
    throw new Error(agentError || "The AI agent returned no text response.");
  }

  return parseAgentResponse(agentMessages.join("\n"));
}

export async function startInterview(role, difficulty) {
  const sessionId = await createSession();
  const response = await sendMessage(
    sessionId,
    `I want to practice for a ${role} interview at ${difficulty} difficulty. Please ask me the first question.`,
  );

  return {
    sessionId,
    question: response.nextQuestion || extractFirstQuestion(response.text),
  };
}

export async function submitAnswer(sessionId, question, answer) {
  return sendMessage(
    sessionId,
    `My answer to "${question}" is:\n${answer}`,
  );
}

export async function requestNextQuestion(sessionId, role) {
  const response = await sendMessage(
    sessionId,
    `Please ask the next interview question for the same ${role} role.`,
  );
  return response.nextQuestion || response.text;
}