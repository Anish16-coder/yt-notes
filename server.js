
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.static('public'));

app.post('/generate', async (req, res) => {
  const { transcript, subject } = req.body;

  if (!transcript || transcript.length < 100) {
    return res.status(400).json({ error: 'Transcript too short' });
  }

  const prompt = `You are an expert academic note-taker. Convert the following YouTube video transcript into comprehensive, well-structured exam-ready notes.

Subject area: ${subject || 'General'}

RULES for the notes:
1. Start with "# [Topic Title]" as main heading
2. Use "## " for major sections
3. Use "### " for sub-sections or key term groups
4. Use bullet points for lists of facts/points
5. Put important terms, formulas, and definitions in **bold**
6. For Physics/Math: write all formulas clearly as: **Formula:** F = ma
7. Add a "## Key Takeaways" section at the end with 3-6 most important points
8. Add a "## Possible Exam Questions" section with 3-5 likely questions from this content
9. Be thorough but concise — no filler sentences
10. Organize logically even if the transcript jumps around

TRANSCRIPT:
${transcript}

Generate the notes now:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const notes = data.candidates[0].content.parts[0].text;
    res.json({ notes });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NoteFlow running on port ${PORT}`));
