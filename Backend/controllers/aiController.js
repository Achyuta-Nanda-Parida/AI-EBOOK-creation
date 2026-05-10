// const  { GoogleGenAI } = require("@google/genai");

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// const generateOutline = async (req, res) => {
//   try {
//     const { topic, style, numChapters, description } = req.body;

//     if (!topic) {
//       return res.status(400).json({ message: "Please provide a topic" });
//     }

//    const prompt = `You are an expert book outline generator. Create a comprehensive book outline based on the following requirements:

// Topic: "${topic}"
// ${description ? `Description: ${description}` : ""}
// Writing Style: ${style}
// Number of Chapters: ${numChapters || 5}

// Requirements:
// 1. Generate exactly ${numChapters || 5} chapters.
// 2. Each chapter title should be clear, engaging, and follow a logical progression.
// 3. Each chapter description should be 2-3 sentences explaining what the chapter covers.
// 4. Ensure chapters build upon each other coherently.
// 5. Match the "${style}" writing style in your titles and descriptions

// Output Format:
// Return only a valid JSON array with no additional text, markdown, or formatting. Each object must have exactly two keys: "title" and "description".

// Example structure:
// [
//   {
//     "title": "Chapter 1: Introduction to the Topic",
//     "description": "A comprehensive overview introducing the main concepts. Sets the foundation for understanding the subject matter."
//   },
//   {
//     "title": "Chapter 2: Core Principles",
//     "description": "Explores the fundamental principles and theories. Provides detailed examples and real-world applications."
//   },
//   // ... more chapters
// ]
//   Generate the outline now:`;

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash-lite",
//       contents: prompt,
//     });

//     const text = response.text;

//  const startIndex = text.indexOf("[");
// const endIndex = text.lastIndexOf("]");

// if (startIndex === -1 || endIndex === -1) {
//   console.error("Could not find JSON array in AI response:", text);
//   return res
//     .status(500)
//     .json({ message: "Failed to parse AI response, no JSON array found." });
// }

// const jsonString = text.substring(startIndex, endIndex + 1);

// try {
//   const outline = JSON.parse(jsonString);
//   res.status(200).json({ outline });
// } catch (e) {
//   console.error("Failed to parse AI response:", jsonString);
//   res.status(500).json({
//     message: "Failed to generate a valid outline. The AI response was not valid JSON.",
//   });
// }


//   }catch (error) {
//     console.error("Error generating chapter:", error);
//     res
//       .status(500)
//       .json({ message: error.message });
//   }
// };


// const generateChapterContent = async (req, res) => {
//   try {
//     const { chapterTitle, chapterDescription, style } = req.body;

//     if (!chapterTitle) {
//       return res
//         .status(400)
//         .json({ message: "Please provide a chapter title" });
//     }

//       const prompt = `You are an expert writer specializing in ${style} content. Write a complete chapter for a book with the following specifications:

// Chapter Title:"${chapterTitle}"
// ${chapterDescription ? `chapter Description : ${chapterDescription}`:''}
// Writing Style: ${style}
// Target Length: comprehensive and detailed (aim for 1500-2500 words)

// Requirements:
// 1. Write in a ${style.toLowerCase()} tone throughout the chapter
// 2. Structure the content with clear sections and smooth transitions
// 3. Include relevant examples, explanations, or anecdotes as appropriate for the style
// 4. Ensure the content flows logically from introduction to conclusion
// 5. Make the content engaging and valuable to readers
// ${chapterDescription ? '6.Cover all points mentioned in the chapter description: ${chapterDescription}' : ''}

// Format Guidelines:
// - Start with a compelling opening paragraph
// - Use clear paragraph breaks for readability
// - Include subheadings if appropriate for the content length
// - End with a strong conclusion or transition to the next chapter
// - Write in plain text without markdown formatting

// Begin writing the chapter content now:`;


//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash-lite",
//       contents: prompt,
//     });

//     res.status(200).json({ content: response.text });
//   } catch (error) {
//     console.error("Error generating chapter:", error);
//     res
//       .status(500)
//       .json({ message: "Server error during AI chapter generation" });
//   }
// };
// module.exports = {
//   generateOutline,
//   generateChapterContent,
// };


const axios = require("axios");

/* ---------------- Generate Outline ---------------- */

const generateOutline = async (req, res) => {
  try {
    const { topic, style, numChapters, description } = req.body;

    if (!topic) {
      return res
        .status(400)
        .json({ message: "Please provide a topic" });
    }

    const prompt = `
You are an expert book outline generator.

Create a comprehensive book outline based on the following requirements:

Topic: "${topic}"
${description ? `Description: ${description}` : ""}
Writing Style: ${style}
Number of Chapters: ${numChapters || 5}

Requirements:
1. Generate exactly ${numChapters || 5} chapters.
2. Each chapter title should be clear and engaging.
3. Each chapter description should be 2-3 sentences.
4. Chapters should follow logical progression.
5. Match the "${style}" writing style.

Output Format:
Return ONLY a valid JSON array.

Example:
[
  {
    "title": "Chapter 1: Introduction",
    "description": "Overview of the topic."
  }
]
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1) {
      console.error("Invalid AI response:", text);

      return res.status(500).json({
        message: "Failed to parse AI response.",
      });
    }

    const jsonString = text.substring(
      startIndex,
      endIndex + 1
    );

    try {
      const outline = JSON.parse(jsonString);

      res.status(200).json({ outline });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);

      res.status(500).json({
        message:
          "AI response was not valid JSON.",
      });
    }
  } catch (error) {
    console.error(
      "Generate Outline Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message:
        error.response?.data?.error?.message ||
        error.message,
    });
  }
};

/* ---------------- Generate Chapter ---------------- */

const generateChapterContent = async (req, res) => {
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
You are an expert writer specializing in ${style} content.

Write a complete chapter.

Chapter Title: "${chapterTitle}"
${
  chapterDescription
    ? `Chapter Description: ${chapterDescription}`
    : ""
}

Writing Style: ${style}

Requirements:
1. Write in ${style} tone.
2. Create detailed content.
3. Use clear sections.
4. Add examples if needed.
5. Target 1500–2500 words.
6. Plain text only.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }
    );

    const content =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    res.status(200).json({
      content,
    });
  } catch (error) {
    console.error(
      "Generate Chapter Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message:
        error.response?.data?.error?.message ||
        "Server error during AI generation",
    });
  }
};

module.exports = {
  generateOutline,
  generateChapterContent,
};
