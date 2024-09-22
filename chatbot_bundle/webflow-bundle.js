import React from 'react';
import ReactDOM from 'react-dom';
import { ChatButton } from './components/chat-button';

console.log('webflow-bundle.js loaded');

// This function will be called to render the chat button
window.renderChatButton = (containerId, props) => {
  console.log('renderChatButton called', containerId, props);
  const container = document.getElementById(containerId);
  if (container) {
    console.log('Container found, rendering ChatButton');
    ReactDOM.render(<ChatButton {...props} />, container);
  } else {
    console.error('Container not found:', containerId);
  }
};