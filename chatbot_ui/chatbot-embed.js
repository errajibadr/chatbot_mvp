import { RemoteRunnable } from "@langchain/core/runnables/remote";

const chatbotChain = new RemoteRunnable({
  url: "http://localhost:8000/",
});

(function() {
  console.log('Chatbot script started');

  // Create the chatbot HTML structure
  var chatbotHTML = `
    <div id="chatbot-container">
      <div id="chat-button">?</div>
      <div id="chat-overlay">
        <div id="chat-header">
          Chat Support <span id="close-chat" style="cursor: pointer">×</span>
        </div>
        <div id="chat-messages"></div>
        <div id="chat-input">
          <input type="text" id="user-input" placeholder="Type your message...">
          <button id="send-button">Send</button>
        </div>
      </div>
    </div>
  `;

  // Create a div and set its innerHTML to the chatbot HTML
  var div = document.createElement('div');
  div.innerHTML = chatbotHTML;
  document.body.appendChild(div);
  console.log('Chatbot HTML appended to body');

  // Add styling
  var style = document.createElement('style');
  style.textContent = `
    #chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      font-family: Arial, sans-serif;
    }
    #chat-button {
      background-color: #007bff;
      color: white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      font-size: 24px;
    }
    #chat-overlay {
      display: none;
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 300px;
      height: 400px;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    #chat-header {
      background-color: #007bff;
      color: white;
      padding: 10px;
      font-weight: bold;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
    }
    #chat-messages {
      height: 300px;
      overflow-y: auto;
      padding: 10px;
    }
    .message {
      max-width: 80%;
      margin-bottom: 10px;
      clear: both;
    }
    .user-message {
      float: right;
      background-color: #007bff;
      color: white;
      border-radius: 10px 10px 0 10px;
      padding: 8px 12px;
    }
    .bot-message {
      float: left;
      background-color: #e9e9eb;
      color: black;
      border-radius: 10px 10px 10px 0;
      padding: 8px 12px;
    }
    #chat-input {
      display: flex;
      padding: 10px;
      background-color: white;
    }
    #user-input {
      flex-grow: 1;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
    #send-button {
      margin-left: 5px;
      padding: 5px 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Add click event to toggle chat overlay
  var chatButton = document.getElementById('chat-button');
  var chatOverlay = document.getElementById('chat-overlay');
  var closeChat = document.getElementById('close-chat');
  
  if (chatButton && chatOverlay) {
    console.log('Chat button and overlay found');
    chatButton.addEventListener('click', function() {
      console.log('Chat button clicked');
      chatOverlay.style.display = 'block';
    });

    closeChat.addEventListener('click', function() {
      console.log('Close button clicked');
      chatOverlay.style.display = 'none';
    });
  } else {
    console.error('Chat button or overlay not found');
  }

  // Add functionality to send messages
  var userInput = document.getElementById('user-input');
  var sendButton = document.getElementById('send-button');
  var chatMessages = document.getElementById('chat-messages');

  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function sendMessage() {
    var message = userInput.value.trim();
    if (message) {
      appendMessage('user', message);
      userInput.value = '';
      // Here you would typically send the message to your chatbot backend
      // and handle the response. For now, we'll just echo the message.
      setTimeout(function() {
        appendMessage('bot', 'You said: ' + message);
      }, 1000);
    }
  }

  function appendMessage(sender, message) {
    var messageElement = document.createElement('div');
    messageElement.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  console.log('Script execution completed');
})();