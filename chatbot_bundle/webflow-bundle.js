import React from 'react';
import ReactDOM from 'react-dom';
import { ChatButton } from './components/chat-button';
import './styles/globals.css';  // Import the CSS here

console.log('webflow-bundle.js loaded');

// This function will be called to render the chat button
window.initChatbot = (params) => {
  console.log('initChatbot called with params:', params);
  const script = document.currentScript || document.querySelector('script[data-auto-init]');
  console.log('Current script:', script);
  const containerId = 'chatbot-container-' + Math.random().toString(36).substring(7);
  
  // Create a container for the chatbot
  const container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);
  console.log('Container created:', container);

  // Extract parameters
  const logoSrc = script.getAttribute('data-logo-src') || params.logoSrc;
  const chatInterfaceColor = script.getAttribute('data-chat-interface-color') || params.chatInterfaceColor || '#FFFFFF';
  const chatbotId = script.getAttribute('data-chatbot-id') || params.chatbotId;
  console.log('Extracted params:', { logoSrc, chatInterfaceColor, chatbotId });

  // Render the ChatButton component
  ReactDOM.render(
    <ChatButton 
      logoSrc={logoSrc}
      chatInterfaceColor={chatInterfaceColor}
      chatbotId={chatbotId}
    />, 
    container
  );
  console.log('ChatButton rendered');
};

// Auto-initialize if script has data-auto-init attribute
if (document.currentScript && document.currentScript.hasAttribute('data-auto-init')) {
  console.log('Auto-initializing chatbot');
  window.initChatbot({});
} else {
  console.log('Chatbot not auto-initialized. Call window.initChatbot() manually.');
}