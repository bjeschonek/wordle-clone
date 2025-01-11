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
  console.log(wordOfTheDay);

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
      console.log(currentGuess);
    }
  }

  function backspace() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    inputBoxes[currentRow * WORD_LENGTH + currentGuess.length].innerText = '';
  }

  async function submitGuess() {
    // Prevents submission of words not equal to 5 characters
    if (currentGuess.length !== WORD_LENGTH) return;

    const wordIsValid = await isValidWord(currentGuess);

    if (!wordIsValid) {
      markInvalidWord();
      // Returns to prevent invalid words counting as a guess
      return;
    }

    const guessParts = currentGuess.split("");
    const wordParts = wordOfTheDay.split("");
    const map = makeMap(wordParts);
    let allRight = true;

    // first pass just finds correct letters so we can mark those as
    // correct first
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // mark as correct
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add("correct");
        map[guessParts[i]]--;
      }
    }

    // second pass finds close and wrong letters
    // we use the map to make sure we mark the correct amount of
    // close letters
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // do nothing
      } else if (map[guessParts[i]] && map[guessParts[i]] > 0) {
        // mark as close
        allRight = false;
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add("close");
        map[guessParts[i]]--;
      } else {
        // wrong
        allRight = false;
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add("wrong");
      }
    }

    currentRow++;
    currentGuess = "";
    if (allRight) {
      // win
      alert("you win");
      document.querySelector(".brand").classList.add("winner");
      gameOver = true;
    } else if (currentRow === MAX_ATTEMPTS) {
      // lose
      alert(`you lose, the word was ${word}`);
      gameOver = true;
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

  function markInvalidWord() {
    // Clears invalid class first, then adds it
    for (let i = 0; i < WORD_LENGTH; i++) {
      inputBoxes[currentRow * WORD_LENGTH + i].classList.remove('invalid');

      setTimeout(() => {
        inputBoxes[currentRow * WORD_LENGTH + i].classList.add('invalid');
      }, 10);
    }
  }

  // listening for event keys and routing to the right function
  // we listen on keydown so we can catch Enter and Backspace
  document.addEventListener("keydown", function handleKeyPress(event) {
    if (gameOver) {
      // do nothing;
      return;
    }

    const action = event.key;

    if (action === "Enter") {
      submitGuess();
    } else if (action === "Backspace") {
      backspace();
    } else if (isLetter(action)) {
      handleValidLetter(action.toUpperCase());
    } else {
      // do nothing
    }
  });

  screenKeyboard.forEach(btn => {
    btn.addEventListener('click', (event) => {
        if (gameOver) return;

        if (event.target.value === 'Enter') {
            submitGuess();
        } else if (event.target.value === 'Backspace') {
            backspace();
        } else if (isLetter(event.target.value)) {
            handleValidLetter();
        }
    })
  })
}

// a little function to check to see if a character is alphabet letter
// this uses regex (the /[a-zA-Z]/ part) but don't worry about it
// you can learn that later and don't need it too frequently
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}
// takes an array of letters (like ['E', 'L', 'I', 'T', 'E']) and creates
// an object out of it (like {E: 2, L: 1, T: 1}) so we can use that to
// make sure we get the correct amount of letters marked close instead
// of just wrong or correct
function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    if (obj[array[i]]) {
      obj[array[i]]++;
    } else {
      obj[array[i]] = 1;
    }
  }
  return obj;
}

runGame();