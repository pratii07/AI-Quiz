document.addEventListener("DOMContentLoaded", () => {
  const conceptInput = document.getElementById("concept-input");
  const startBtn = document.getElementById("start-btn");
  const quizSection = document.getElementById("quiz-section");
  const questionContainer = document.getElementById("question-container");
  const optionsContainer = document.getElementById("options-container");
  const nextBtn = document.getElementById("next-btn");
  const resultSection = document.getElementById("result-section");
  const scoreText = document.getElementById("score-text");
  const restartBtn = document.getElementById("restart-btn");

  const API_KEY = "AIzaSyBbGO4zTKz9vxc2RDMAmPLByarSqcBikbg";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  let quizData = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let userAnswer = null;

  startBtn.addEventListener("click", async () => {
    const concept = conceptInput.value.trim();
    if (!concept) return alert("Please enter a concept name.");

    startBtn.disabled = true;
    startBtn.textContent = "Generating quiz...";

    try {
      // Generate quiz from Gemini AI
      const prompt = `
Generate a quiz of 10 multiple-choice questions (with 4 options each) on the concept "${concept}". 
Format the output as JSON with this structure:

[
  {
    "question": "Question text?",
    "options": ["option1", "option2", "option3", "option4"],
    "answer": "correct option text"
  },
  ...
]

Only output JSON.
`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });

      const data = await response.json();

      if (!data.candidates || !data.candidates.length) {
        throw new Error("No response from Gemini API");
      }

      let rawText = data.candidates[0].content.parts[0].text;

      // Sometimes API returns text with some explanation, try to extract JSON:
      const jsonStart = rawText.indexOf("[");
      const jsonEnd = rawText.lastIndexOf("]") + 1;
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("Invalid JSON format from AI");

      const jsonString = rawText.slice(jsonStart, jsonEnd);
      quizData = JSON.parse(jsonString);

      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("Empty quiz data");
      }

      currentQuestionIndex = 0;
      score = 0;

      conceptInput.value = "";
      startBtn.disabled = false;
      startBtn.textContent = "Generate Quiz";
      document.getElementById("input-section").classList.add("hidden");
      quizSection.classList.remove("hidden");
      resultSection.classList.add("hidden");

      showQuestion();

    } catch (error) {
      alert("Failed to generate quiz: " + error.message);
      startBtn.disabled = false;
      startBtn.textContent = "Generate Quiz";
    }
  });

  function showQuestion() {
    nextBtn.disabled = true;
    userAnswer = null;
    optionsContainer.innerHTML = "";

    const currentQ = quizData[currentQuestionIndex];
    questionContainer.textContent = `Q${currentQuestionIndex + 1}: ${currentQ.question}`;

    currentQ.options.forEach(option => {
      const optionDiv = document.createElement("div");
      optionDiv.classList.add("option");
      optionDiv.textContent = option;
      optionDiv.addEventListener("click", () => selectOption(optionDiv, option));
      optionsContainer.appendChild(optionDiv);
    });
  }

  function selectOption(optionDiv, option) {
    if (userAnswer !== null) return; // already selected

    userAnswer = option;
    // Highlight selection
    document.querySelectorAll(".option").forEach(opt => opt.classList.remove("selected"));
    optionDiv.classList.add("selected");
    nextBtn.disabled = false;
  }

  nextBtn.addEventListener("click", () => {
    if (userAnswer === null) return;

    // Check answer and show feedback
    const currentQ = quizData[currentQuestionIndex];
    const optionsDivs = document.querySelectorAll(".option");

    optionsDivs.forEach(optDiv => {
      const isCorrect = optDiv.textContent === currentQ.answer;
      if (optDiv.textContent === userAnswer) {
        if (isCorrect) {
          score++;
          optDiv.classList.add("correct");
        } else {
          optDiv.classList.add("incorrect");
        }
      }
      if (isCorrect) {
        optDiv.classList.add("correct");
      }
    });

    nextBtn.disabled = true;

    currentQuestionIndex++;

    if (currentQuestionIndex < quizData.length) {
      setTimeout(() => {
        showQuestion();
      }, 2000);
    } else {
      setTimeout(showResult, 2000);
    }
  });

  function showResult() {
    quizSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    scoreText.textContent = `You scored ${score} out of ${quizData.length}!`;
  }

  restartBtn.addEventListener("click", () => {
    // Reset UI
    quizData = [];
    currentQuestionIndex = 0;
    score = 0;
    userAnswer = null;

    document.getElementById("input-section").classList.remove("hidden");
    quizSection.classList.add("hidden");
    resultSection.classList.add("hidden");
  });
});
