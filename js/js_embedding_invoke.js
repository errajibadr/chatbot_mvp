// js_embedding.js
import { RemoteRunnable } from 'https://esm.sh/@langchain/core@0.1.x/runnables/remote';



// Initialize the RemoteRunnable with your agent endpoint URL// Replace with your actual URL
const agentEndpointUrl = "http://localhost:8000/";
const chatbot = new RemoteRunnable({url:agentEndpointUrl});

// Generate a unique thread ID (you might want to use a proper UUID library)
const threadId = Date.now().toString();


async function chatWithBot(messages) {
  const config = { configurable: { thread_id: threadId } };

  const formattedMessages = Array.isArray(messages) 
      ? messages.map(msg => (typeof msg === 'object' ? msg : { type: "user", content: msg }))
      : [{ type: "human", content: messages }];

  try {
    const response = await chatbot.invoke(
      { messages: formattedMessages },
      { ...config, version: "v1" }
    );

    // Extract the last message, which should be the AI's response
    const aiResponse = response.messages[response.messages.length - 1];

    if (aiResponse && aiResponse.content) {
      console.log(aiResponse.content)
      return aiResponse.content;
    } else {
      console.error("Unexpected response format:", response);
      return "Sorry, I couldn't process your request.";
    }
  } catch (error) {
    console.error("Error in promptAi:", error);
    return "An error occurred while processing your request.";
  }
}




chatWithBot("Livrez vous à Paris?").then(response => {
  console.log("Bot response:", response);
});

