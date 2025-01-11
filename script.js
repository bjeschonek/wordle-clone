// Magic Numbers
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

// Get DOM Elements
const inputBoxes = Array.from(document.querySelectorAll('.inputBox'));
const screenKeyboard = Array.from(document.querySelectorAll('.screen-key'));
const gameMessage = document.querySelector('.game-message');

async function runGame() {
  // Set initial game state
  let currentRow = 0;
  let currentGuess = '';
  let gameOver = false;

  const wordOfTheDay = await getWordOfTheDay();

  async function getWordOfTheDay() {
    try {
      const response = await fetch('https://words.dev-apis.com/word-of-the-day');
      if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
      }
      const { word } = await response.json();
      return word;
    } catch (error) {
      console.error(`Error fetching word of day: ${error}`);
      // In case of error, return default word
      return 'guess';
    }
  }

  function handleValidLetter(letter) {
    if (currentGuess.length < WORD_LENGTH) {
      currentGuess += letter;
      inputBoxes[currentRow * WORD_LENGTH + currentGuess.length - 1].innerText = letter;
      inputBoxes[currentRow * WORD_LENGTH + currentGuess.length -1].classList.add('letter');
    }
  }

  function backspace() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    inputBoxes[currentRow * WORD_LENGTH + currentGuess.length].innerText = '';
    inputBoxes[currentRow * WORD_LENGTH + currentGuess.length].classList.remove('letter');
  }

  async function submitGuess() {
    // Prevents submission of words not equal to 5 characters
    if (currentGuess.length !== WORD_LENGTH) return;

    const wordIsValid = await isValidWord(currentGuess);

    if (!wordIsValid) {
      // Clear invalid class, then add it back
      for (let i = 0; i < WORD_LENGTH; i++) {
        inputBoxes[currentRow * WORD_LENGTH + i].classList.remove('invalid');
  
        setTimeout(() => {
          inputBoxes[currentRow * WORD_LENGTH + i].classList.add('invalid');
        }, 10);
      }
      // Returns to prevent invalid words counting as a guess
      return;
    }

    console.log('guess submitted and valid');

    // Split word of day and user guess into arrays for comparison
    const guessLetters = currentGuess.split('');
    const wordLetters = wordOfTheDay.split('');

    // Maps word letters to object to handle multiple of same letter ex. POOLS
    const wordMap = {};
    for (let i = 0; i < wordLetters.length; i++) {
      if (wordMap[wordLetters[i]]) {
        wordMap[wordLetters[i]]++;
      } else {
        wordMap[wordLetters[i]] = 1;
      }
    }

    let correctAnswer = true;

    // First loop to mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] === wordLetters[i]) {
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add('correct');
        // Updates word map removing letters in correct position
        wordMap[guessLetters[i]]--;
      }
    }

    // Second loop marks correct letters in wrong place (close) and wrong letters
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] === wordLetters[i]) {
        continue;
      } else if (wordMap[guessLetters[i]] && wordMap[guessLetters[i]] > 0) { // TODO possible bug?
        // Mark as "close"
        correctAnswer = false;
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add('close');
        // Update word map to remove letters
        wordMap[guessLetters[i]]--;
      } else {
        // Mark as wrong
        correctAnswer = false;
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add('wrong');
      }
    }

    // Increment row to count guess, reset currentGuess for new row
    currentRow++;
    currentGuess = '';

    // End game functionality
    if (correctAnswer) {
      endGame();
      gameMessage.innerText = `Congrats, you've won!! Try a new word tomorrow.`;
    } else if (currentRow === MAX_ATTEMPTS) {
      endGame();
      gameMessage.innerText = `Sorry, you lost. Try a new word tomorrow, or refresh to play again.`
    }
  }

  async function isValidWord(word) {
    try {
      const response = await fetch('https://words.dev-apis.com/validate-word', {
        method: 'POST',
        body: JSON.stringify({ word: currentGuess })
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const { validWord } = await response.json();
      return validWord;
    } catch (error) {
      console.error('Error validating word', error);
      // In case validation API down, returns true so game still works
      return true;
    }
  }

  function endGame() {
    gameMessage.classList.remove('hidden');
    gameOver = true;
  }

  // Physical keyboard event listener
  document.addEventListener('keydown', (event) => {
    if (gameOver) {
      return;
    } else if (event.key === 'Enter') {
      submitGuess();
    } else if (event.key === 'Backspace') {
      backspace();
    } else if (isLetter(event.key)) {
      handleValidLetter(event.key);
    }
  });

  // Screen keyboard event listener
  screenKeyboard.forEach(btn => {
    btn.addEventListener('click', (event) => {
      const key = event.target.value;
      if (gameOver) {
        return;
      } else if (key === 'enter') {
        submitGuess();
      } else if (key === 'backspace') {
        backspace();
      } else if (isLetter(key)) {
        handleValidLetter(key);
      }
    });
  });

  function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
  }
}

runGame();