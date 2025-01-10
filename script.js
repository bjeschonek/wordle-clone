// Constants and magic numbers
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// Get DOM elements
const inputBoxes = Array.from(document.querySelectorAll('.inputBox'));
const screenKeyboardKeys = Array.from(document.querySelectorAll('.screen-key'));
const gameMessage = document.querySelector('.game-message');

async function runGame() {
    // Set initial game state
    let currentRow = 0;
    let currentGuess = '';
    let gameOver = false;

    // Get word of the day
    const wordOfTheDay = await requestWordOfTheDay();
    console.log(wordOfTheDay);

    async function requestWordOfTheDay() {
        try {
            const response = await fetch('https://words.dev-apis.com/word-of-the-day');
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const { word } = await response.json();
            return word;
        } catch (error) {
            console.error(error.message);
            // Returning a default word if unable to get one from API
            return 'guess';
        }
    }

    // Validates legitimate letter input
    function isLetter(letter) {
        return /^[a-zA-z]$/.test(letter);
    }

    function handleValidLetter(letter) {
        // Prevent more than 5 letters being typed in
        if (currentGuess.length < WORD_LENGTH) {
            currentGuess += letter;
        } else {
            currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
        }
        inputBoxes[currentRow * WORD_LENGTH + currentGuess.length - 1].innerText = letter;
    }

    function backspace() {
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        inputBoxes[currentRow * WORD_LENGTH + currentGuess.length].innerText = '';
    }

    async function submitGuess() {
        // Prevent submitting words more or less than 5 letters
        if (currentGuess.length !== WORD_LENGTH) {
            return;
        }
        
        const isValid = await isValidWord(currentGuess);

        if (isValid) {
            compareGuessToAnswer();
            currentRow++;
            currentGuess = '';
        } else {
            // Mark word submitted as invalid and return so user can enter something else
            for (let i = 0; i < WORD_LENGTH; i++) {
                inputBoxes[currentRow * WORD_LENGTH + i].classList.remove('invalid');
    
                setTimeout(() => {
                    inputBoxes[currentRow * WORD_LENGTH + i].classList.add('invalid');
                }, 10);
            }
        }

        console.log(currentGuess, currentRow);
    }

    async function isValidWord(wordToValidate) {
        try {
            const response = await fetch('https://words.dev-apis.com/validate-word', {
                method: 'POST',
                body: JSON.stringify({ word: wordToValidate })
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            const { validWord } = await response.json();
            return validWord;
        } catch (error) {
            console.error('Error validating word', error);
            // return true so game still works without validation API
            return true;
        }
    }

    function compareGuessToAnswer() {
        // Convert word and guess to array for comparison
        const userGuessLettersArray = currentGuess.split('');
        const wordOfDayLettersArray = wordOfTheDay.split('');

        // Converts word of day to object to keep track of duplicate letters in word ex. POOLS
        const wordOfDayLetterMap = mapLetters(wordOfDayLettersArray);

        let correctAnswer = true;

        // First loop only marks correct letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (userGuessLettersArray[i] === wordOfDayLettersArray[i]) {
                inputBoxes[currentRow * WORD_LENGTH + i].classList.add('correct');
                wordOfDayLetterMap[userGuessLettersArray[i]]--;
            }
        }

        // Second loop takes care of "close" and incorrect letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (userGuessLettersArray[i] === wordOfDayLettersArray[i]) {
                return;
            } else if (wordOfDayLetterMap[userGuessLettersArray[i]] && wordOfDayLetterMap[wordOfDayLettersArray[i]] > 0) {
                correctAnswer = false;
                inputBoxes[currentRow * WORD_LENGTH + i].classList.add('close');
                wordOfDayLetterMap[userGuessLettersArray[i]]--;
            } else {
                correctAnswer = false;
                inputBoxes[currentRow * WORD_LENGTH + i].classList.add('wrong');
            }
        }

        if (correctAnswer) {
            endGame('win');
        } else if (currentRow === MAX_GUESSES) {
            endGame('lose');
        }

    }

    function mapLetters(letters) {
        const wordMap = {};

        for (let i = 0; i < letters.length; i++) {
            let letter = wordMap[letters[i]];

            if (wordMap[letters[i]]) {
                wordMap[letters[i]]++;
            } else {
                wordMap[letters[i]] = 1;
            }
        }

        return wordMap;
    }

    function endGame(condition) {
        gameOver = true;
        gameMessage.classList.remove('hidden');

        if (condition === 'win') {
            gameMessage.innerText = `Congrats, you've won!! Try a new word tomorrow or refresh the page to play again.`;
        }

        gameMessage.innerText = `You lose! Try a new word tomorrow or refresh the page to play again.`;
    }

    // Physical keyboard input functionality
    document.addEventListener('keydown', (event) => {
        if (gameOver) return;

        if (isLetter(event.key)) {
            handleValidLetter(event.key);
        } else if (event.key === 'Backspace') {
            backspace();
        } else if (event.key === 'Enter') {
            submitGuess();
        } else {
            return;
        }
    });

    // Screen keyboard input functionality
    screenKeyboardKeys.forEach(btn => {
        btn.addEventListener('click', (event) => {
            if (gameOver) return;

            if (isLetter(event.target.value)) {
                handleValidLetter(event.target.value);
            } else if (event.target.value === 'backspace') {
                backspace();
            } else if (event.target.value === 'enter') {
                submitGuess();
            } else {
                return;
            }
        });
    });
}

runGame();