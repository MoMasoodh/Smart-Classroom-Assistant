const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

async function generateAnswer(question) {

  const prompt = `
You are an experienced classroom teacher.

Answer the following student doubt clearly, accurately, and in simple language.

Student Question:
${question}
`;

  const result = await model.generateContent(prompt);

  return result.response.text();
}

async function generateQuiz(topic, numberOfQuestions = 5) {

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

  const result = await model.generateContent(prompt);

  return result.response.text();
}

module.exports = {
  generateAnswer,
  generateQuiz
};