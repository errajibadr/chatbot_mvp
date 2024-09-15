 // chatWidget.js
import { RemoteRunnable } from 'https://esm.sh/@langchain/core@0.3.x/runnables/remote';

(function() {
  // Function to get script parameters
  function getScriptParams() {
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
      if (script.src.includes('chatWidget.js')) {
        return {
          chatbotId: script.getAttribute('chatbot-id') || 'default',
          chatbotHeight: script.getAttribute('chatbot-height') || '400px',
          chatbotWidth: script.getAttribute('chatbot-width') || '300px',
          backendEndpointUrl: script.getAttribute('backend_endpoint_url') || 'http://localhost:8000/chatbot/',
          logoUrl: script.getAttribute('logo_url') || 'js/logo.jpeg',
        };
      }
    }
    return { chatbotId: 'default', chatbotHeight: '400px', chatbotWidth: '300px', backendEndpointUrl: 'http://localhost:8000/chatbot/', logoUrl: 'js/logo.jpeg' };
  }

  // Get parameters
  const { chatbotId, chatbotHeight, chatbotWidth, backendEndpointUrl, logoUrl } = getScriptParams();

  console.log('Script parameters:', { chatbotId, chatbotHeight, chatbotWidth, backendEndpointUrl, logoUrl });

  // Use the chatbotId to determine the endpoint URL
  const agentEndpointUrl = `${backendEndpointUrl.replace(/\/+$/, '')}/${chatbotId}`;

  const chatbotChain = new RemoteRunnable({
    url: agentEndpointUrl,
  });

  const threadId = Date.now().toString();

  console.log('Chatbot script started');

  // Create the chatbot HTML structure
  var chatbotHTML = `
    <div id="chatbot-container" style="width: auto; height: auto;">
      <div id="chat-button" style="display: block;">
        <img src="${logoUrl}" alt="Chat" id="chat-logo">
      </div>
      <div id="cta-bubble">
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
      width: auto;
      height: auto;
    }
    #chat-button {
      position: relative;
      background-color: white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    #chat-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    #chat-overlay {
      display: none;
      position: absolute;
      bottom: 70px;
      right: 0;
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
      bottom: 70px;
      right: 10px;
      display: none;
      align-items: center;
      animation: fadeInUp 0.5s ease-out;
      transform-origin: bottom right;
    }
    .message-bubble {
      background-color: white;
      color: black;
      padding: 10px 15px;
      border-radius: 18px;
      font-size: 14px;
      position: relative;
      min-width: 120px;
      text-align: center;
      border: 1px solid #ccc;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .message-bubble::after {
      content: '';
      position: absolute;
      bottom: -8px;
      right: 15px;
      width: 15px;
      height: 15px;
      background-color: white;
      border-right: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      transform: rotate(45deg);
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
  
  console.log('Elements found:', { 
    chatButton: !!chatButton, 
    chatOverlay: !!chatOverlay, 
    closeChat: !!closeChat, 
    chatMessages: !!chatMessages 
  });

  // Fallback method to create chat button if not found
  if (!chatButton) {
    console.log('Chat button not found, creating fallback');
    chatButton = document.createElement('div');
    chatButton.id = 'chat-button';
    chatButton.style.display = 'block';
    chatButton.innerHTML = `<img src="${logoUrl}" alt="Chat" id="chat-logo">`;
    document.body.appendChild(chatButton);
  }

  // Modify the click event for the chat button
  if (chatButton && chatOverlay) {
    console.log('Adding click event to chat button');
    chatButton.addEventListener('click', function() {
      console.log('Chat button clicked');
      chatOverlay.style.display = 'block';
      document.getElementById('cta-bubble').style.display = 'none';
      document.getElementById('chatbot-container').style.width = '300px';
      document.getElementById('chatbot-container').style.height = '470px'; // Adjust this value to fit your needs
      if (chatMessages && chatMessages.children.length === 0) {
        appendMessage('bot', "Bonjour! Comment puis-je vous aider Aujourd'hui?");
      }
    });

    closeChat.addEventListener('click', function() {
      console.log('Close button clicked');
      chatOverlay.style.display = 'none';
      document.getElementById('chatbot-container').style.width = 'auto';
      document.getElementById('chatbot-container').style.height = 'auto';
      // Show CTA bubble when closing chat
      setTimeout(() => {
        toggleCtaBubble();
      }, 3000); // Show after 3 seconds
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

  // Modify the toggleCtaBubble function
  function toggleCtaBubble() {
    var ctaBubble = document.getElementById('cta-bubble');
    var chatOverlay = document.getElementById('chat-overlay');
    
    if (chatOverlay.style.display === 'none' || chatOverlay.style.display === '') {
      if (ctaBubble.style.display === 'none' || ctaBubble.style.display === '') {
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
  }

  // Add this to show CTA bubble periodically when chat is closed
  setInterval(() => {
    if (chatOverlay.style.display === 'none' || chatOverlay.style.display === '') {
      toggleCtaBubble();
    }
  }, 5000); // Show every 60 seconds if chat is closed

  console.log('Script execution completed');
})();