// Constants and magic numbers
const MAX_GUESS_LENGTH = 5;
const MAX_GUESSES_ALLOWED = 6;

// Get DOM elements
const inputBoxes = Array.from(document.querySelectorAll('.inputBox'));
const screenKeyboardKeys = Array.from(document.querySelectorAll('.screen-key'));
const winMessage = document.querySelector('.win-message');
const loseMessage = document.querySelector('.lose-message');
const timeRemaining = document.querySelector('.time-remaining');

async function runGame() {
    // Set initial game state
    let currentRow = 0;
    let currentGuess = '';
    let gameOver = false;
    let BOX_COORDS = currentRow * MAX_GUESS_LENGTH;

    // Get word of the day
    const wordOfTheDay = await requestWordOfTheDay();

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
    keyboardKeys.forEach(btn => {
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
        if (currentGuess.length < MAX_GUESS_LENGTH) {
            currentGuess += letter;
        }
        // TODO make sure this doesn't cause bug due to updating innerText outside of currentGuess
        inputBoxes[BOX_COORDS + currentGuess.length - 1].innerText = letter;
    }

    function backspace() {
        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        inputBoxes[BOX_COORDS + currentGuess.length].innerText = '';
    }

    async function submitGuess() {
        // Prevent submitting words more or less than 5 letters
        if (currentGuess.length !== MAX_GUESS_LENGTH) {
            return;
        }

        // TODO check if this function needs await - may allow double enter to submit invalid/blank words
        if (!isValidWord(currentGuess)) {
            markInvalidWord();
            return;
        }

        compareGuessToAnswer();

        currentRow++;
        currentGuess = '';
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

    function markInvalidWord() {
        for (let i = 0; i < MAX_GUESS_LENGTH; i++) {
            inputBoxes[BOX_COORDS + i].classList.remove('invalid');

            setTimeout(() => {
                inputBoxes[BOX_COORDS + i].classList.add('invalid');
            }, 10);
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
        for (let i = 0; i < MAX_GUESS_LENGTH; i++) {
            if (userGuessLettersArray[i] === wordOfDayLettersArray[i]) {
                inputBoxes[BOX_COORDS + 1].classList.add('correct');
                wordOfDayLetterMap[userGuessLettersArray[i]]--;
            }
        }

        // Second loop takes care of "close" and incorrect letters
        for (let i = 0; i < MAX_GUESS_LENGTH; i++) {
            if (userGuessLettersArray[i] === wordOfDayLettersArray[i]) {
                return;
            } else if (wordOfDayLetterMap[userGuessLettersArray[i]] && wordOfDayLetterMap[wordOfDayLettersArray[i]] > 0) {
                inputBoxes[BOX_COORDS + i].classList.add('close');
                correctAnswer = false;
                wordOfDayLetterMap[userGuessLettersArray[i]]--;
            } else {
                inputBoxes[BOX_COORDS + i].classList.add('wrong');
                correctAnswer = false;
            }
        }

        if (correctAnswer) {
            winGame();
        } else if (currentRow === MAX_GUESSES_ALLOWED) {
            loseGame();
        }

    }

    function mapLetters(letters) {
        const wordMap = {};

        for (let i = 0; i < letters.length; i++) {
            let letter = wordMap[letters[i]];

            if (letter) {
                letter++;
            } else {
                letter = 1;
            }
        }

        return wordMap;
    }

    function winGame() {
        gameOver = true;
        winMessage.classList.remove('hidden');
        displayTimeRemaining();
    }

    function loseGame() {
        gameOver = true;
        loseMessage.classList.remove('hidden');
        displayTimeRemaining();
    }

    function displayTimeRemaining() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24,0,0,0);

        const timeUntilMidnight = midnight - now;

        const hours = Math.floor
    }
}

runGame();