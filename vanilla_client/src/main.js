// src/main.js

// Generate a random 6 character code
function generateCode() {
    return Math.random().toString(36).substring(2, 8);
  }

  function generatePronounceableCode(length) {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    let code = '';
    let useVowel = Math.random() < 0.5; // Start with a vowel or consonant randomly
  
    for (let i = 0; i < length; i++) {
      if (useVowel) {
        code += vowels.charAt(Math.floor(Math.random() * vowels.length));
      } else {
        code += consonants.charAt(Math.floor(Math.random() * consonants.length));
      }
      useVowel = !useVowel; // Toggle between vowel and consonant
    }
  
    return code;
  }
  
  // buttons
  const createTunnelButton = document.getElementById('createTunnel');

  createTunnelButton.addEventListener('click', async () => {
    const code = generatePronounceableCode(6);
    console.log(code);
    // Navigate to the new tunnel page with the generated code as a query parameter
    window.location.href = `/tunnel.html?code=${code}`;
  });

  const joinCodeInputs = document.querySelectorAll('.join-code-input');

  // Add event listeners to each input to move focus to the next input on input
  joinCodeInputs.forEach((input, index) => {
    input.addEventListener('input', (event) => {
      const maxLength = parseInt(input.getAttribute('maxlength'));
      const currentLength = input.value.length;
      
      if (currentLength >= maxLength) {
        // Move focus to the next input
        if (index < joinCodeInputs.length - 1) {
          joinCodeInputs[index + 1].focus();
        }
      }
    });

    // Handle backspace to move focus to the previous input if current input is empty
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && input.value.length === 0) {
        // Move focus to the previous input
        if (index > 0) {
          joinCodeInputs[index - 1].focus();
        }
      }
    });
  });

  // Example: You can add a join button click event handler here
  const joinButton = document.getElementById('joinButton');
  joinButton.addEventListener('click', () => {
    // Replace with your join code logic
    const joinCode = Array.from(joinCodeInputs).map(input => input.value).join('');
    window.location.href = `/tunnel.html?code=${joinCode}`;
  });
 

  