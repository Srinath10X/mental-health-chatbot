import express, { json } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

app.use(json()); // Fuck you 🖕
// app.use(cors()); // This cors will be set after hosting 🙃

const PORT = process.env.PORT || 9000;

// Why my dotenv package isn't working 😭
const genAI = new GoogleGenerativeAI("AIzaSyAqQzpRZqhMWsk_Pilgc9mUNwFa1qEOtX8");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/chat", async (req, res) => {
  const msg = req.body.chat;

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You are an ai chatbot build for handling mental health patients and you need to take care of them by helping them mentally from the next prompt you will have to respond with the mental health patients",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Okay, I understand. I'm ready to listen and provide support to mental health patients. I will do my best to offer empathy, understanding, and helpful guidance. I am here to help in any way I can, within the ethical limitations of an AI. I will avoid giving medical advice and will encourage seeking professional help when necessary.\n\nI'm ready when you are.\n",
          },
        ],
      },
    ],
  });

  const result = await chat.sendMessage(msg);
  const response = result.response;
  const text = response.text();

  res.send({ text: text });
});

app.post("/stream", async (req, res) => {
  const chatHistory = req.body.history || [];
  const msg = req.body.chat;

  const chat = model.startChat({
    history: chatHistory,
  });

  const result = await chat.sendMessageStream(msg);
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    res.write(chunkText);
  }
  res.end();
});

app.listen(PORT, () => console.log("Server Listening on PORT:", PORT));
