const questions = [
    {
        id: 1,
        question: "А голос у него был не такой, как у почтальона Печкина, дохленький. У Гаврюши голосище был, как у электрички. Он _____ _____ на ноги поднимал.",
        answers: [
            { text: "Пол деревни, за раз", correct: false },
            { text: "Полдеревни, зараз", correct: true, explanation: "Правильно! Раздельно существительное будет писаться в случае наличия дополнительного слова между существительным и частицей. Правильный ответ: полдеревни пишется слитно. Зараз (ударение на второй слог) — это обстоятельственное наречие, пишется слитно. Означает быстро, одним махом." },
            { text: "Пол-деревни, за раз", correct: false }
        ]
    },
    {
        id: 2,
        question: "А эти слова как пишутся?",
        answers: [
            { text: "Капуччино и эспрессо", correct: false },
            { text: "Каппуччино и экспресо", correct: false },
            { text: "Капучино и эспрессо", correct: true, explanation: "Конечно! По орфографическим нормам русского языка единственно верным написанием будут «капучино» и «эспрессо»." }
        ]
    },
    {
        id: 3,
        question: "Как нужно писать?",
        answers: [
            { text: "Черезчур", correct: false },
            { text: "Черес-чур", correct: false },
            { text: "Чересчур", correct: true, explanation: "Да! Это слово появилось от соединения предлога «через» и древнего слова «чур», которое означает «граница», «край». Но слово претерпело изменения, так что правильное написание учим наизусть — «чересчур»." }
        ]
    },
    {
        id: 4,
        question: "Где допущена ошибка?",
        answers: [
            { text: "Аккордеон", correct: false },
            { text: "Белиберда", correct: false },
            { text: "Эпелепсия", correct: true, explanation: "Верно! Это слово пишется так: «эпИлепсия»." }
        ]
    }
];

let shuffledQuestions = [];
let shuffledAnswers = [];
let currentQuestionIndex = 0;
let answeredQuestions = [];
let correctAnswersCount = 0;
let currentQuestionAnswered = false;
let allQuestionsAnswered = false;

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function initQuiz() {
    shuffledQuestions = shuffleArray(questions);
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= shuffledQuestions.length) {
        showQuestionsEnded();
        showStatistics();
        allQuestionsAnswered = true;
        return;
    }
    
    const quizArea = document.getElementById('quizArea');
    const question = shuffledQuestions[currentQuestionIndex];
    shuffledAnswers = shuffleArray(question.answers);
    
    const questionContainer = document.createElement('div');
    questionContainer.className = 'question-container';
    questionContainer.dataset.questionId = question.id;
    questionContainer.dataset.questionIndex = currentQuestionIndex;
    
    const questionBlock = document.createElement('div');
    questionBlock.className = 'question-block active';
    questionBlock.dataset.questionId = question.id;
    questionBlock.dataset.questionIndex = currentQuestionIndex;
    
    const questionHeader = document.createElement('div');
    questionHeader.className = 'question-header';
    
    const questionNumber = document.createElement('span');
    questionNumber.className = 'question-number';
    questionNumber.textContent = `${currentQuestionIndex + 1}.`;
    
    const questionText = document.createElement('span');
    questionText.className = 'question-text';
    questionText.textContent = question.question;
    
    const marker = document.createElement('div');
    marker.className = 'question-marker';
    marker.style.display = 'none';
    
    questionHeader.appendChild(questionNumber);
    questionHeader.appendChild(questionText);
    questionHeader.appendChild(marker);
    questionBlock.appendChild(questionHeader);
    
    questionContainer.appendChild(questionBlock);
    
    const answersContainer = document.createElement('div');
    answersContainer.className = 'answers-container';
    
    shuffledAnswers.forEach((answer, index) => {
        const answerBlock = document.createElement('div');
        answerBlock.className = 'answer-block';
        answerBlock.dataset.questionId = question.id;
        answerBlock.dataset.answerIndex = index;
        answerBlock.dataset.isCorrect = answer.correct;
        
        const answerText = document.createElement('div');
        answerText.className = 'answer-text';
        answerText.textContent = answer.text;
        answerBlock.appendChild(answerText);
        
        if (answer.explanation) {
            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.textContent = answer.explanation;
            answerBlock.appendChild(explanation);
        }
        
        answerBlock.addEventListener('click', () => handleAnswerClick(answerBlock, answer, questionBlock));
        answersContainer.appendChild(answerBlock);
    });
    
    questionContainer.appendChild(answersContainer);
    quizArea.appendChild(questionContainer);
    
    currentQuestionAnswered = false;
}

function handleAnswerClick(answerBlock, answer, questionBlock) {
    if (currentQuestionAnswered) return;
    
    currentQuestionAnswered = true;
    const marker = questionBlock.querySelector('.question-marker');
    const questionId = shuffledQuestions[currentQuestionIndex].id;
    const allAnswers = document.querySelectorAll(`.answer-block[data-question-id="${questionId}"]`);
    const isCorrect = answer.correct;
    
    answerBlock.classList.add('selected');
    
    allAnswers.forEach(block => {
        block.style.pointerEvents = 'none';
    });
    
    questionBlock.classList.remove('active');
    
    if (isCorrect) {
        answerBlock.classList.add('correct');
        marker.textContent = '✓';
        marker.classList.add('marker-correct');
        marker.style.display = 'flex';
        
        correctAnswersCount++;
        
        const explanation = answerBlock.querySelector('.explanation');
        if (explanation) {
            setTimeout(() => {
                explanation.classList.add('show');
            }, 500);
        }
        
        setTimeout(() => {
            allAnswers.forEach(block => {
                if (!block.classList.contains('correct')) {
                    block.classList.add('moving-down');
                }
            });
        }, 2000);
        
        setTimeout(() => {
            answerBlock.classList.add('moving-down');
            setTimeout(() => {
                const answersContainer = document.querySelector(`.question-container[data-question-id="${questionId}"] .answers-container`);
                if (answersContainer) {
                    answersContainer.innerHTML = '';
                }
                moveToNextQuestion();
            }, 1000);
        }, 4000);
        
    } else {
        answerBlock.classList.add('incorrect');
        marker.textContent = '✗';
        marker.classList.add('marker-incorrect');
        marker.style.display = 'flex';
        
        setTimeout(() => {
            allAnswers.forEach(block => {
                block.classList.add('moving-down');
            });
            setTimeout(() => {
                const answersContainer = document.querySelector(`.question-container[data-question-id="${questionId}"] .answers-container`);
                if (answersContainer) {
                    answersContainer.innerHTML = '';
                }
                moveToNextQuestion();
            }, 1000);
        }, 2000);
    }
    
    answeredQuestions.push({
        questionId: shuffledQuestions[currentQuestionIndex].id,
        isCorrect: isCorrect
    });
}

function moveToNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        loadQuestion();
    } else {
        showQuestionsEnded();
        showStatistics();
        allQuestionsAnswered = true;
        makeQuestionsClickable();
    }
}

function showQuestionsEnded() {
    const questionsEnded = document.getElementById('questionsEnded');
    questionsEnded.classList.remove('hidden');
}

function showStatistics() {
    const statistics = document.getElementById('statistics');
    const correctCount = document.getElementById('correctCount');
    const totalCount = document.getElementById('totalCount');
    
    correctCount.textContent = correctAnswersCount;
    totalCount.textContent = shuffledQuestions.length;
    statistics.classList.remove('hidden');
}

function makeQuestionsClickable() {
    const allQuestionBlocks = document.querySelectorAll('.question-block');
    allQuestionBlocks.forEach(block => {
        block.style.cursor = 'pointer';
    });
}

function handleQuestionClick(questionId) {
    if (!allQuestionsAnswered) return;
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    document.querySelectorAll('.question-container').forEach(container => {
        if (parseInt(container.dataset.questionId) !== questionId) {
            const answersContainer = container.querySelector('.answers-container');
            if (answersContainer) {
                answersContainer.innerHTML = '';
            }
        }
    });
    
    const questionContainer = document.querySelector(`.question-container[data-question-id="${questionId}"]`);
    if (questionContainer) {
        const answersContainer = questionContainer.querySelector('.answers-container');
        const correctAnswer = question.answers.find(a => a.correct);
        
        if (correctAnswer && answersContainer) {
            const existingAnswer = answersContainer.querySelector('.answer-block');
            
            if (existingAnswer) {
                answersContainer.innerHTML = '';
            } else {
                const answerBlock = document.createElement('div');
                answerBlock.className = 'answer-block correct';
                answerBlock.dataset.questionId = questionId;
                
                const answerText = document.createElement('div');
                answerText.className = 'answer-text';
                answerText.textContent = correctAnswer.text;
                answerBlock.appendChild(answerText);
                
                if (correctAnswer.explanation) {
                    const explanation = document.createElement('div');
                    explanation.className = 'explanation show';
                    explanation.textContent = correctAnswer.explanation;
                    answerBlock.appendChild(explanation);
                }
                
                answersContainer.appendChild(answerBlock);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initQuiz();
    
    document.addEventListener('click', (e) => {
        if (allQuestionsAnswered) {
            const questionBlock = e.target.closest('.question-block');
            if (questionBlock && !e.target.closest('.answers-container')) {
                const questionId = parseInt(questionBlock.dataset.questionId);
                handleQuestionClick(questionId);
            }
        }
    });
});

