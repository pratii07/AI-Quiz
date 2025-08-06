document.addEventListener("DOMContentLoaded", () => {
  const conceptInput = document.getElementById("concept-input");
  const codingCheckbox = document.getElementById("coding-checkbox");
  const startBtn = document.getElementById("start-btn");
  const quizSection = document.getElementById("quiz-section");
  const questionContainer = document.getElementById("question-container");
  const optionsContainer = document.getElementById("options-container");
  const nextBtn = document.getElementById("next-btn");
  const resultSection = document.getElementById("result-section");
  const scoreText = document.getElementById("score-text");
  const restartBtn = document.getElementById("restart-btn");
  const moreQuestionsBtn = document.getElementById("more-questions-btn");

  const API_KEY = "AIzaSyBbGO4zTKz9vxc2RDMAmPLByarSqcBikbg";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  let quizData = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let userAnswer = null;
  let lastConcept = "";

  startBtn.addEventListener("click", async () => {
    const concept = conceptInput.value.trim();
    const onlyCoding = codingCheckbox.checked;
    if (!concept) return alert("Please enter a concept name.");

    lastConcept = concept;
    startBtn.disabled = true;
    startBtn.textContent = "Generating quiz...";

    try {
      let prompt = `Generate a quiz of 10 multiple-choice questions (with 4 options each) on the concept "${concept}".`;

      if (onlyCoding) {
        prompt += `
                All questions MUST be strictly coding-related (like writing, debugging, or analyzing code).
                Use code snippets and ask about outputs, logic, syntax, or functions — in JavaScript or Python only.
                Do NOT include theoretical questions or definitions like "What is a loop?".`;
                      }

                      prompt += `
                Output must be in this JSON format:
                [
                  {
                    "question": "Your question?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Correct option text"
                  }
                ]
                Only output JSON — no explanation.`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });

      const data = await response.json();
      if (!data.candidates || !data.candidates.length) throw new Error("No response from Gemini API");

      let rawText = data.candidates[0].content.parts[0].text;
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
      moreQuestionsBtn.classList.add("hidden");

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
    if (userAnswer !== null) return;

    userAnswer = option;
    document.querySelectorAll(".option").forEach(opt => opt.classList.remove("selected"));
    optionDiv.classList.add("selected");
    nextBtn.disabled = false;
  }

  nextBtn.addEventListener("click", () => {
    if (userAnswer === null) return;

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
    moreQuestionsBtn.classList.remove("hidden");
  }

  restartBtn.addEventListener("click", () => {
    quizData = [];
    currentQuestionIndex = 0;
    score = 0;
    userAnswer = null;

    document.getElementById("input-section").classList.remove("hidden");
    quizSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    moreQuestionsBtn.classList.add("hidden");
  });

  moreQuestionsBtn.addEventListener("click", () => {
    if (!lastConcept) return alert("No previous concept found.");
    conceptInput.value = lastConcept;
    startBtn.click();
  });
});
