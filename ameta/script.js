let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userName = "";
let walletAddress = "";

const questionArea = document.getElementById("question-area");
const answerButtons = document.getElementById("answer-buttons");
const nextBtn = document.getElementById("next-btn");
const scoreBox = document.getElementById("score-box");
const nameInput = document.getElementById("name-input");
const nameBtn = document.getElementById("name-btn");
const walletInput = document.getElementById("wallet-input");
const connectBtn = document.getElementById("connect-btn");

nameBtn.addEventListener("click", () => {
  userName = nameInput.value.trim();
  if (!userName) {
    alert("Entrez un pseudo !");
    return;
  }
  nameInput.disabled = true;
  nameBtn.disabled = true;
});

connectBtn.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      alert("Installez MetaMask !");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    walletAddress = accounts[0];
    walletInput.value = walletAddress;
    connectBtn.disabled = true;

    if (!userName) {
      alert("Entrez un pseudo avant !");
      return;
    }

    document.getElementById("user-info").style.display = "none";
    fetchQuestions();
  } catch (err) {
    console.error("Erreur connexion wallet:", err);
  }
});

async function fetchQuestions() {
  const res = await fetch("https://opentdb.com/api.php?amount=50&category=31&difficulty=medium&type=multiple");
  const data = await res.json();
  questions = data.results;
  showQuestion();
}

function showQuestion() {
  resetState();
  const question = questions[currentQuestionIndex];
  const answers = [...question.incorrect_answers.map(decodeHTML), decodeHTML(question.correct_answer)];
  shuffleArray(answers);

  questionArea.innerHTML = `<p>${decodeHTML(question.question)}</p>`;
  answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.classList.add("answer-btn");
    if (answer === decodeHTML(question.correct_answer)) btn.dataset.correct = "true";
    btn.addEventListener("click", selectAnswer);
    answerButtons.appendChild(btn);
  });
}

function selectAnswer(e) {
  const correct = e.target.dataset.correct === "true";
  if (correct) score++;

  Array.from(answerButtons.children).forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.correct === "true") btn.classList.add("correct");
    else btn.classList.add("wrong");
  });

  nextBtn.classList.remove("hidden");
}

nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < 7) {
    showQuestion();
  } else {
    showScore();
  }
});

function showScore() {
  questionArea.innerHTML = `<h2>Quiz terminé</h2><p>Score: ${score}/7</p>`;
  answerButtons.innerHTML = "";
  nextBtn.classList.add("hidden");
  scoreBox.innerHTML = `${userName} (${walletAddress.slice(0, 6)}...) : ${score}/7`;

  const reward = score >= 5 ? 10 : 1;
  sendToken(walletAddress, reward);
}

function resetState() {
  nextBtn.classList.add("hidden");
  answerButtons.innerHTML = "";
}

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function sendToken(address, amount) {
  try {
    const res = await fetch("https://ton-sous-domaine.vercel.app/api/send-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, amount })
    });

    const data = await res.json();
    if (data.success) {
      questionArea.innerHTML += `<p>🎉 ${amount} ANPAN tokens envoyés !</p>`;
    } else {
      questionArea.innerHTML += `<p>Erreur: ${data.error}</p>`;
    }
  } catch (error) {
    console.error("Erreur API:", error);
    questionArea.innerHTML += `<p>Erreur lors de l'envoi des tokens.</p>`;
  }
}
