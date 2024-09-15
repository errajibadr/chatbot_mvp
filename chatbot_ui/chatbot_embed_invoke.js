// Import RemoteRunnable from CDN
import { RemoteRunnable } from 'https://cdn.jsdelivr.net/npm/@langchain/core@0.1.x/+esm';

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
          Chat Support <span id="close-chat">×</span>
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
      background-color: #fff;
      border: 1px solid #ccc;
    }
    #chat-header {
      background-color: #007bff;
      color: white;
      padding: 10px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
    }
    #close-chat {
      cursor: pointer;
    }
    #chat-messages {
      height: 320px;
      overflow-y: auto;
      padding: 10px;
    }
    #chat-input {
      display: flex;
      padding: 10px;
      background-color: #f8f8f8;
    }
    #user-input {
      flex-grow: 1;
      padding: 5px;
      border: 1px solid #ccc;
    }
    #send-button {
      margin-left: 5px;
      padding: 5px 10px;
      background-color: #007bff;
      color: white;
      border: none;
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
      chatButton.style.display = 'none';
    });

    closeChat.addEventListener('click', function() {
      console.log('Close button clicked');
      chatOverlay.style.display = 'none';
      chatButton.style.display = 'flex';
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

  async function sendMessage() {
    var message = userInput.value.trim();
    if (message) {
      appendMessage('user', message);
      userInput.value = '';
      
      try {
        const response = await chatbotChain.invoke({
          messages: [{ type: "human", content: message }]
        });
        
        if (response && response.messages && response.messages.length > 0) {
          const botResponse = response.messages[response.messages.length - 1].content;
          appendMessage('bot', botResponse);
        } else {
          appendMessage('bot', 'Sorry, I couldn\'t process your request.');
        }
      } catch (error) {
        console.error('Error:', error);
        appendMessage('bot', 'An error occurred. Please try again.');
      }
    }
  }

  function appendMessage(sender, message) {
    var messageElement = document.createElement('div');
    messageElement.textContent = sender === 'user' ? message : 'Bot: ' + message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  console.log('Script execution completed');
})();