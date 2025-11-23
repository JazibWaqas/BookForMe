import { ChatOpenAI } from "@langchain/openai";

const openAIModel = new ChatOpenAI({
  model: "gpt-4o-mini", // or "gpt-4o"
  apiKey: process.env.OPENAI_API_KEY,
});

export default openAIModel;
