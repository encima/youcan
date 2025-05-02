const questions = [
    {
      "finnish": "Mikä on nimesi?",
      "answer": "Nimeni on Anna.",
      "english": "What is your name?",
      "answer_en": "My name is Anna."
    },
    {
      "finnish": "Mistä olet kotoisin?",
      "answer": "Olen kotoisin Suomesta.",
      "english": "Where are you from?",
      "answer_en": "I am from Finland."
    }
  ]

function showQuestion(questions) {
    const idx = Math.floor(Math.random() * questions.length);
    const q = questions[idx];
    document.getElementById('finnish').textContent = `🇫🇮 ${q.finnish}`;
    document.getElementById('answer').textContent = `Vastaus: ${q.answer}`;
    document.getElementById('english').textContent = `🇬🇧 ${q.english}`;
    document.getElementById('answer-en').textContent = `Answer: ${q.answer_en}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    showQuestion(questions);
    document.getElementById('refresh').onclick = () => showQuestion(questions);
});
