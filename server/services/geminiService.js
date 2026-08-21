const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-3.6-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
].filter(Boolean);

async function callGenerativeAI(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "dummy-key") {
    throw new Error("Missing GEMINI_API_KEY in server/.env.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response ? result.response.text() : "";
      if (text) return text;
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes("404") || err.message.includes("not found") || err.message.includes("no longer available"))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All Gemini model candidates failed.");
}

function generateFallbackQuiz(topic, numberOfQuestions = 5) {
  const cleanTopic = (topic || "Classroom Topic").trim();
  const questions = [];

  const questionTemplates = [
    {
      question: `What is the primary fundamental concept of ${cleanTopic}?`,
      options: [
        `Core principles and theoretical framework of ${cleanTopic}`,
        `Classical thermodynamics and heat transfer`,
        `Basic syntax of assembly language programming`,
        `Macroeconomic principles from the 18th century`,
      ],
      correctAnswer: `Core principles and theoretical framework of ${cleanTopic}`,
    },
    {
      question: `Which of the following best describes a core application of ${cleanTopic}?`,
      options: [
        `Solving practical domain problems using key methodology of ${cleanTopic}`,
        `Calculating planetary orbital trajectories`,
        `Synthesizing organic polymers in chemical laboratories`,
        `Analyzing legacy analog television broadcast signals`,
      ],
      correctAnswer: `Solving practical domain problems using key methodology of ${cleanTopic}`,
    },
    {
      question: `Why is ${cleanTopic} significant in contemporary education and technology?`,
      options: [
        `It provides critical foundational knowledge and practical real-world utility`,
        `It is purely optional and has no modern practical application`,
        `It eliminates the need for data validation or system logic`,
        `It only applies to hardware designed before 1990`,
      ],
      correctAnswer: `It provides critical foundational knowledge and practical real-world utility`,
    },
    {
      question: `What is a recommended best practice when working with ${cleanTopic}?`,
      options: [
        `Adhering to structured guidelines and verifying key outcomes`,
        `Ignoring baseline metrics and skipping initial analysis`,
        `Disabling error checking and security validations`,
        `Working without documentation or standard protocols`,
      ],
      correctAnswer: `Adhering to structured guidelines and verifying key outcomes`,
    },
    {
      question: `Which key factor should be evaluated when assessing ${cleanTopic}?`,
      options: [
        `Accuracy, reliability, and functional efficiency`,
        `Color temperature of the monitor display`,
        `Physical mass of the local storage medium`,
        `Room ambient humidity level`,
      ],
      correctAnswer: `Accuracy, reliability, and functional efficiency`,
    },
  ];

  for (let i = 0; i < numberOfQuestions; i++) {
    const template = questionTemplates[i % questionTemplates.length];
    questions.push({
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
    });
  }

  return JSON.stringify(questions, null, 2);
}

async function generateAnswer(question) {
  try {
    const prompt = `
You are an experienced classroom teacher.

Answer the following student doubt clearly, accurately, and in simple language.

Student Question:
${question}
`;
    return await callGenerativeAI(prompt);
  } catch (err) {
    console.warn(`[GeminiService] Gemini API unavailable (${err.message}).`);
    return `[AI Assistant]: Unable to reach Gemini AI (${err.message}). Please check GEMINI_API_KEY in server/.env or answer manually.`;
  }
}

async function generateQuiz(topic, numberOfQuestions = 5) {
  try {
    const prompt = `
You are an experienced teacher.

Generate ${numberOfQuestions} multiple-choice questions about ${topic}.

Return ONLY valid JSON in this format:

[
  {
    "question": "...",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": "Option A"
  }
]

Do not include markdown, explanations, or code fences.
`;

    const responseText = await callGenerativeAI(prompt);
    let text = responseText.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    JSON.parse(text);
    return text;
  } catch (err) {
    console.warn(`[GeminiService] Gemini API error (${err.message}). Generating fallback quiz for topic: "${topic}".`);
    return generateFallbackQuiz(topic, numberOfQuestions);
  }
}

module.exports = {
  generateAnswer,
  generateQuiz,
};