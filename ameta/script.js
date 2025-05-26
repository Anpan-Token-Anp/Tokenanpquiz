let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userName = "";
let walletAddress = "";

const questionArea = document.getElementById("question-area");
const answerButtons = document.getElementById("answer-buttons");
const nextBtn = document.getElementById("next-btn");
const nameInput = document.getElementById("name-input");
const walletInput = document.getElementById("wallet-input");
const connectBtn = document.getElementById("connect-btn");
const nameOkBtn = document.getElementById("name-ok-btn");
const scoreboard = document.getElementById("scoreboard");

nameOkBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (name) {
    userName = name;
    alert("✅ Pseudo enregistré !");
  } else {
    alert("❌ Entrez un pseudo !");
  }
});

connectBtn.addEventListener("click", async () => {
  try {
    if (!window.ethereum) {
      alert("MetaMask non détecté.");
      return;
    }
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    walletInput.value = walletAddress;
    alert("✅ Wallet connecté !");
    fetchQuestions();
  } catch (err) {
    console.error(err);
    alert("Erreur de connexion MetaMask");
  }
});

async function fetchQuestions() {
  const res = await fetch("https://opentdb.com/api.php?amount=7&category=31&difficulty=medium&type=multiple");
  const data = await res.json();
  questions = data.results;
  showQuestion();
}

function showQuestion() {
  resetState();
  const question = questions[currentQuestionIndex];
  const questionText = decodeHTML(question.question);
  const answers = [...question.incorrect_answers.map(decodeHTML), decodeHTML(question.correct_answer)];
  shuffleArray(answers);

  questionArea.innerHTML = `<p>${questionText}</p>`;
  answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.className = "answer-btn";
    if (answer === decodeHTML(question.correct_answer)) btn.dataset.correct = "true";
    btn.addEventListener("click", selectAnswer);
    answerButtons.appendChild(btn);
  });
}

function selectAnswer(e) {
  const selected = e.target;
  const correct = selected.dataset.correct === "true";
  if (correct) score++;

  [...answerButtons.children].forEach(btn => {
    btn.classList.add(btn.dataset.correct === "true" ? "correct" : "wrong");
    btn.disabled = true;
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
  questionArea.innerHTML = `<h2>✅ Quiz terminé !</h2><p>${userName}, score : ${score}/7</p>`;
  answerButtons.innerHTML = "";
  nextBtn.classList.add("hidden");
  sendReward();
  updateScoreboard();
}

function updateScoreboard() {
  const li = document.createElement("li");
  li.textContent = `${userName} - ${score}/7`;
  scoreboard.appendChild(li);
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

async function sendReward() {
  const amount = score >= 5 ? "10" : "1";
  try {
    const res = await fetch("https://anpanapi.vercel.app/api/send-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress, amount })
    });
    const data = await res.json();
    if (data.success) {
      questionArea.innerHTML += `<p>🎉 ${amount} ANPAN envoyés à votre wallet !</p>`;
    } else {
      questionArea.innerHTML += `<p>❌ Erreur récompense : ${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    questionArea.innerHTML += `<p>❌ Erreur réseau lors de l'envoi de la récompense.</p>`;
  }
}
