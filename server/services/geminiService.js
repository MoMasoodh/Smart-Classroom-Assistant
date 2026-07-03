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

module.exports = {
  generateAnswer
};