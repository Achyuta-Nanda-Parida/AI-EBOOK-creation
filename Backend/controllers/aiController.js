const axios = require("axios");

const generateOutline = async (req, res) => {
  try {
    const { topic, style, numChapters, description } =
      req.body;

    if (!topic) {
      return res.status(400).json({
        message: "Please provide a topic",
      });
    }

    const prompt = `
You are an expert book outline generator.

Create a book outline based on:

Topic: "${topic}"
${description ? `Description: ${description}` : ""}
Writing Style: ${style}
Number of Chapters: ${numChapters || 5}

Requirements:
1. Generate exactly ${
      numChapters || 5
    } chapters.
2. Each chapter title should be engaging.
3. Each chapter description should be 2-3 sentences.
4. Match the "${style}" writing style.

Return ONLY valid JSON array.

Format:
[
 {
   "title":"Chapter title",
   "description":"Chapter description"
 }
]
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model:
          "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    const text =
      response.data.choices[0].message
        .content;

    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]");

    if (
      startIndex === -1 ||
      endIndex === -1
    ) {
      return res.status(500).json({
        message:
          "No valid JSON found in AI response",
      });
    }

    const jsonString = text.substring(
      startIndex,
      endIndex + 1
    );

    const outline =
      JSON.parse(jsonString);

    res.status(200).json({
      outline,
    });
  } catch (error) {
    console.error(
      "Outline error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message:
        "Failed to generate outline",
    });
  }
};

const generateChapterContent = async (
  req,
  res
) => {
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

Write a complete chapter.

Chapter Title:
${chapterTitle}

${
  chapterDescription
    ? `Chapter Description:
${chapterDescription}`
    : ""
}

Writing Style: ${style}

Requirements:
1. Write detailed content.
2. Use smooth transitions.
3. Make it engaging.
4. Plain text only.

`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model:
          "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type":
            "application/json",
        },
      }
    );

    const text =
      response.data.choices[0].message
        .content;

    res.status(200).json({
      content: text,
    });
  } catch (error) {
    console.error(
      "Chapter error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message:
        "Failed to generate chapter",
    });
  }
};

module.exports = {
  generateOutline,
  generateChapterContent,
};