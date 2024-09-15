// chatbot_embed_invoke.js
import { RemoteRunnable } from 'https://esm.sh/@langchain/core@0.3.x/runnables/remote';

const chatbotChain = new RemoteRunnable({
  url: "http://localhost:8000/",
});
const threadId = Date.now().toString();

(function() {
  console.log('Chatbot script started');

  // Create the chatbot HTML structure
  var chatbotHTML = `
    <div id="chatbot-container">
      <div id="chat-button">
        <img src="js/logo.jpeg" alt="Chat" id="chat-logo">
      </div>
      <div id="cta-bubble" style="display: none;">
        <div class="message-bubble">Avez vous besoin d'aide ?</div>
      </div>
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
      background-color: white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      overflow: hidden;  // Add this to clip the image to the button's shape
    }
    #chat-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;  // Change this to 'cover' to fill the entire button
      border-radius: 50%;  // Make the image itself rounded
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
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    #chat-header {
      background-color: #007bff;
      color: white;
      padding: 10px;
      font-weight: bold;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
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
      display: flex;
      flex-direction: column;
    }
    .message {
      max-width: 80%;
      margin-bottom: 10px;
      clear: both;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .user-message {
      align-self: flex-end;
      background-color: #007bff;
      color: white;
      border-radius: 10px 10px 0 10px;
      padding: 8px 12px;
    }
    .bot-message {
      align-self: flex-start;
      background-color: #e9e9eb;
      color: black;
      border-radius: 10px 10px 10px 0;
      padding: 8px 12px;
    }
    .bot-message strong {
      font-weight: bold;
    }
    #chat-input {
      display: flex;
      padding: 10px;
      background-color: white;
      border-top: 1px solid #ccc;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }
    #user-input {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 18px;
      margin-right: 8px;
    }
    #send-button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 18px;
      cursor: pointer;
    }
    #cta-bubble {
      position: absolute;
      bottom: 65px;
      right: 65px;
      display: flex;
      align-items: center;
      animation: fadeInUp 0.5s ease-out;
      transform-origin: bottom right;
    }

    .message-bubble {
      background-color: white;
      color: black;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
      position: relative;
      min-width: 150px;
      text-align: center;
      border: 1px solid black;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .message-bubble::after {
      content: '';
      position: absolute;
      bottom: -9px;
      right: -9px;
      width: 18px;
      height: 18px;
      background-color: white;
      border: 1px solid black;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    @keyframes fadeInUp {
      from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.8);
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  // Add click event to toggle chat overlay
  var chatButton = document.getElementById('chat-button');
  var chatOverlay = document.getElementById('chat-overlay');
  var closeChat = document.getElementById('close-chat');
  var chatMessages = document.getElementById('chat-messages');
  
  if (chatButton && chatOverlay) {
    console.log('Chat button and overlay found');
    chatButton.addEventListener('click', function() {
      console.log('Chat button clicked');
      chatOverlay.style.display = 'block';
      chatButton.style.display = 'none';
      document.getElementById('cta-bubble').style.display = 'none'; // Hide CTA bubble when chat is opened
      if (chatMessages.children.length === 0) {
        appendMessage('bot', 'Welcome! How can I assist you today?');
      }
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

  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  async function sendMessage() {
    const config = { configurable: { thread_id: threadId } };
    var message = userInput.value.trim();
    if (message) {
      appendMessage('user', message);
      userInput.value = '';
      showLoadingIndicator();
      
      try {
        console.log("sending message to chatbot", message)
        const response = await chatbotChain.invoke(
          { messages: [{ type: "human", content: message }]},
          { ...config, version: "v1" }
        );
        
        if (response && response.messages && response.messages.length > 0) {
          const botResponse = response.messages[response.messages.length - 1].content;
          console.log(botResponse)
          hideLoadingIndicator();
          appendMessage('bot', botResponse);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error:', error);
        hideLoadingIndicator();
        appendMessage('bot', 'I apologize, but I encountered an error while processing your request. Please try again or contact support if the issue persists.');
      }
    }
  }

  function showLoadingIndicator() {
    var loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="chat-bubble"></div>
      <div class="chat-bubble"></div>
      <div class="chat-bubble"></div>
    `;
    chatMessages.appendChild(loadingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideLoadingIndicator() {
    var loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }

  function appendMessage(sender, message) {
    var messageElement = document.createElement('div');
    messageElement.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
    
    // Parse the message for formatting
    var formattedMessage = message
      .replace(/\n/g, '<br>') // Replace newlines with <br> tags
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Replace **text** with <strong>text</strong>
    
    messageElement.innerHTML = formattedMessage;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add this function to show and hide the CTA bubble
  function toggleCtaBubble() {
    var ctaBubble = document.getElementById('cta-bubble');
    if (ctaBubble.style.display === 'none') {
      ctaBubble.style.display = 'flex';
      // Reset the animation
      ctaBubble.style.animation = 'none';
      ctaBubble.offsetHeight; // Trigger reflow
      ctaBubble.style.animation = null;
      
      setTimeout(() => {
        ctaBubble.style.display = 'none';
      }, 5000); // Hide after 5 seconds
    } else {
      ctaBubble.style.display = 'none';
    }
  }

  // Show the CTA bubble periodically
  setInterval(toggleCtaBubble, 6000); // Show every 60 seconds

  console.log('Script execution completed');
})();