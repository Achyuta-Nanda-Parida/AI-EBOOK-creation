const axios = require("axios");

const MODEL = "openai/gpt-4o-mini";

const generateOutline = async (req, res) => {
  try {
    const {
      topic,
      style,
      numChapters,
      description,
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        message: "Please provide a topic",
      });
    }

    console.log(
      "API KEY:",
      process.env.OPENROUTER_API_KEY
        ? "Loaded ✅"
        : "Missing ❌"
    );

    const prompt = `
You are an expert book outline generator.

Create a comprehensive book outline.

Topic: "${topic}"
${description ? `Description: ${description}` : ""}
Writing Style: ${style || "Educational"}
Number of Chapters: ${numChapters || 5}

Requirements:
1. Generate exactly ${
      numChapters || 5
    } chapters.
2. Each chapter title should be engaging.
3. Each chapter description should be 2–3 sentences.
4. Chapters should follow logical progression.
5. Match the "${
      style || "Educational"
    }" writing style.

IMPORTANT:
Return ONLY valid JSON array.
No markdown.
No explanation text.

Example:
[
  {
    "title": "Chapter 1",
    "description": "Description here"
  }
]
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: MODEL,

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            "http://localhost:5173",
          "X-Title":
            "AI Ebook Generator",
          "Content-Type":
            "application/json",
        },
      }
    );

    const text =
      response.data.choices?.[0]
        ?.message?.content || "";

    console.log("AI Response:", text);

    const startIndex =
      text.indexOf("[");
    const endIndex =
      text.lastIndexOf("]");

    if (
      startIndex === -1 ||
      endIndex === -1
    ) {
      return res.status(500).json({
        message:
          "AI did not return valid JSON.",
      });
    }

    const jsonString =
      text.substring(
        startIndex,
        endIndex + 1
      );

    const outline =
      JSON.parse(jsonString);

    return res.status(200).json({
      outline,
    });
  } catch (error) {
    console.error(
      "Outline error:",
      error.response?.data ||
        error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.error
          ?.message ||
        "Failed to generate outline",
    });
  }
};

const generateChapterContent =
  async (req, res) => {
    try {
      const {
        chapterTitle,
        chapterDescription,
        style,
      } = req.body;

      if (!chapterTitle) {
        return res.status(400).json({
          message:
            "Please provide a chapter title",
        });
      }

      const prompt = `
You are an expert writer.

Write a complete detailed book chapter.

Chapter Title:
${chapterTitle}

${
  chapterDescription
    ? `Chapter Description:
${chapterDescription}`
    : ""
}

Writing Style:
${style || "Educational"}

Requirements:
1. Write detailed content.
2. Use smooth transitions.
3. Include examples where relevant.
4. Make content engaging.
5. Plain text only.
6. Minimum 1000 words.
`;

      const response =
        await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: MODEL,

            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],

            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer":
                "http://localhost:5173",
              "X-Title":
                "AI Ebook Generator",
              "Content-Type":
                "application/json",
            },
          }
        );

      const text =
        response.data.choices?.[0]
          ?.message?.content || "";

      return res.status(200).json({
        content: text,
      });
    } catch (error) {
      console.error(
        "Chapter error:",
        error.response?.data ||
          error.message
      );

      return res.status(500).json({
        message:
          error.response?.data?.error
            ?.message ||
          "Failed to generate chapter",
      });
    }
  };

module.exports = {
  generateOutline,
  generateChapterContent,
};