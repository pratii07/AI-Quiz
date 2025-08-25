const API_KEY = "AIzaSyA1n2FOpGemnjc2_j-_BQZD7iXylaQFENs";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let currentTopic = "";
let currentDifficulty = "";
let mode = "theory";
let questionCount = 0;
const MAX_QUESTIONS = 6;

let correctAnswers = [];
let wrongAnswers = [];

const motivationalQuotes = [
  "Mistakes are proof you’re trying! 🚀",
  "Every expert was once a beginner 🌱",
  "Consistency beats intensity 🔥",
  "Learning never stops 📚",
  "Great job! Keep pushing forward 💪",
];

document.getElementById("startBtn").addEventListener("click", () => {
  currentTopic = document.getElementById("topic").value.trim();
  currentDifficulty = document.getElementById("difficulty").value;
  mode = document.getElementById("mode").value;
  if (!currentTopic) {
    alert("Please enter a topic!");
    return;
  }
  questionCount = 0;
  correctAnswers = [];
  wrongAnswers = [];
  document.getElementById("setup").style.display = "none";
  getQuestion();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  getQuestion();
});

async function getQuestion() {
  if (questionCount >= MAX_QUESTIONS) {
    showResult();
    return;
  }

  questionCount++;
  updateProgress();

  let prompt;
  if (mode === "theory") {
    prompt = `Generate 1 multiple-choice theory question on "${currentTopic}" (${currentDifficulty}). 
      Format:
      Q: Question text
      A) Option 1
      B) Option 2
      C) Option 3
      D) Option 4
      Answer: (correct option letter)
      Hint: (short hint)
      Explanation: (detailed explanation)`;
  } else {
    prompt = `Generate 1 multiple-choice coding question in "${currentTopic}" (${currentDifficulty}).
      Provide problem statement, a code snippet, and 4 MCQ options.
      Format:
      Q: Question text
      Code:
      \`\`\`${currentTopic}
      // code snippet
      \`\`\`
      A) Option 1
      B) Option 2
      C) Option 3
      D) Option 4
      Answer: (correct option letter)
      Hint: (short hint)
      Explanation: (detailed explanation)`;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await res.json();
    const output =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No output";
    renderQuiz(output);
  } catch (err) {
    console.error(err);
    alert("Error fetching quiz: " + err.message);
  }
}

function renderQuiz(output) {
  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";
  document.getElementById("nextBtn").style.display = "none";

  const lines = output
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  const question =
    lines.find((l) => l.startsWith("Q:")) || "Question not found";
  const codeIndex = lines.findIndex((l) => l.startsWith("```"));
  let codeSnippet = "";
  let lang = "javascript";

  if (codeIndex !== -1) {
    const endIndex = lines
      .slice(codeIndex + 1)
      .findIndex((l) => l.startsWith("```"));
    if (endIndex !== -1) {
      codeSnippet = lines
        .slice(codeIndex + 1, codeIndex + 1 + endIndex)
        .join("\n");
    }
    if (lines[codeIndex].includes("python")) lang = "python";
  }

  const options = lines.filter((l) => /^[A-D]\)/.test(l));
  const answerLine = lines.find((l) => l.startsWith("Answer:"));
  const correctAnswer = answerLine ? answerLine.split(":")[1].trim() : "";
  const hintLine = lines.find((l) => l.startsWith("Hint:"));
  const explanationLine = lines.find((l) => l.startsWith("Explanation:"));

  const qEl = document.createElement("div");
  qEl.className = "question";
  qEl.textContent = question;
  quizDiv.appendChild(qEl);

  if (codeSnippet) {
    const pre = document.createElement("pre");
    pre.innerHTML = `<code class="language-${lang}">${Prism.highlight(
      codeSnippet,
      Prism.languages[lang],
      lang
    )}</code>`;
    quizDiv.appendChild(pre);

    // Copy + Run Code buttons
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy Code";
    copyBtn.onclick = () => navigator.clipboard.writeText(codeSnippet);

    const runBtn = document.createElement("button");
    runBtn.textContent = "Run Code (No Input)";
    runBtn.onclick = () => {
      try {
        if (lang === "javascript") {
          let output = eval(codeSnippet);
          showConsole(String(output ?? "Executed!"));
        } else {
          showConsole("⚠️ Run supported only for JavaScript");
        }
      } catch (e) {
        showConsole("Error: " + e.message);
      }
    };

    // Testcase area
    // Testcase area
    const inputArea = document.createElement("input");
    inputArea.type = "text";
    inputArea.placeholder = "Enter your testcase (e.g. 5 or [1,2,3])";
    inputArea.style.width = "100%";
    inputArea.style.marginTop = "8px";
    inputArea.style.padding = "6px";
    inputArea.style.border = "1px solid #ccc";
    inputArea.style.borderRadius = "6px";

    const runWithInputBtn = document.createElement("button");
    runWithInputBtn.textContent = "Run with Input";

    runWithInputBtn.onclick = () => {
      try {
        if (lang === "javascript") {
          const userInput = inputArea.value;

          const func = new Function(
            "codeSnippet",
            "userInput",
            `
              // Run user code inside IIFE
              (function(){
                eval(codeSnippet);
              })();

              // Detect first function name
              const match = codeSnippet.match(/function\\s+(\\w+)\\s*\\(/);
              if (!match) return "⚠️ No function found";
              const actualFuncName = match[1];

              // Parse user input (try JSON first, fallback string/number)
              let input;
              try {
                input = JSON.parse(userInput);
              } catch {
                input = isNaN(userInput) ? userInput : Number(userInput);
              }

              // Ensure function is available globally
              if (typeof window[actualFuncName] === "undefined") {
                window[actualFuncName] = eval("(" + codeSnippet.match(/function[\\s\\S]*/)[0] + ")");
              }

              // Call detected function
              return (typeof window[actualFuncName] === "function")
                ? window[actualFuncName](input)
                : "⚠️ Function not defined properly";
            `
          );

          const result = func(codeSnippet, userInput);
          showConsole("Output: " + result);
        } else {
          showConsole("⚠️ Input run supported only for JavaScript");
        }
      } catch (e) {
        showConsole("Error: " + e.message);
      }
    };

    quizDiv.appendChild(copyBtn);
    quizDiv.appendChild(runBtn);
    quizDiv.appendChild(inputArea);
    quizDiv.appendChild(runWithInputBtn);

    quizDiv.appendChild(copyBtn);
    quizDiv.appendChild(runBtn);
    quizDiv.appendChild(inputArea);
    quizDiv.appendChild(runWithInputBtn);
  }

  options.forEach((opt) => {
    const btn = document.createElement("div");
    btn.className = "option";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      if (opt.startsWith(correctAnswer)) {
        btn.style.background = "#d4edda";
        btn.style.borderColor = "#28a745";
        correctAnswers.push(question);
      } else {
        btn.style.background = "#f8d7da";
        btn.style.borderColor = "#dc3545";
        wrongAnswers.push(question);
      }
      document.getElementById("nextBtn").style.display = "inline-block";
    });
    quizDiv.appendChild(btn);
  });

  if (hintLine) {
    const hintBtn = document.createElement("button");
    hintBtn.textContent = "Show Hint";
    hintBtn.onclick = () => alert(hintLine);
    quizDiv.appendChild(hintBtn);
  }
  if (explanationLine) {
    const expBtn = document.createElement("button");
    expBtn.textContent = "Show Explanation";
    expBtn.onclick = () => alert(explanationLine);
    quizDiv.appendChild(expBtn);
  }
}

function showConsole(msg) {
  let consoleDiv = document.querySelector(".console");
  if (!consoleDiv) {
    consoleDiv = document.createElement("div");
    consoleDiv.className = "console";
    document.getElementById("quiz").appendChild(consoleDiv);
  }
  consoleDiv.textContent = msg;
}

function updateProgress() {
  const percent = (questionCount / MAX_QUESTIONS) * 100;
  document.getElementById("progressBar").style.width = percent + "%";
}

function showResult() {
  const quizDiv = document.getElementById("quiz");
  const score = `${correctAnswers.length}/${MAX_QUESTIONS}`;
  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  quizDiv.innerHTML = `
      <h2><b>${randomQuote}</b></h2>
      <h3>🎉 Quiz Completed!</h3>
      <p><b>Score:</b> ${score}</p>
      <p><b>⚠️ Weaknesses (need improvement):</b></p>
      <ul>${
        wrongAnswers.map((q) => `<li>${q}</li>`).join("") || "<li>None</li>"
      }</ul>
      <button onclick="restartQuiz()">Restart Quiz</button>
    `;

  if (correctAnswers.length >= MAX_QUESTIONS / 2) {
    confetti();
  }
  document.getElementById("nextBtn").style.display = "none";
}

function restartQuiz() {
  document.getElementById("setup").style.display = "block";
  document.getElementById("quiz").innerHTML = "";
  questionCount = 0;
  correctAnswers = [];
  wrongAnswers = [];
  updateProgress();
}
