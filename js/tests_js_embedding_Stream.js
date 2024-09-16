// js_embedding.js
import { RemoteRunnable } from 'https://esm.sh/@langchain/core@0.3.x/runnables/remote';

let chatbot;

function initializeChatbot(agentEndpointUrl) {
  chatbot = new RemoteRunnable({url: agentEndpointUrl});
}

// Initialize the RemoteRunnable with your agent endpoint URL// Replace with your actual URL
const agentEndpointUrl = "http://localhost:8000/";


// Generate a unique thread ID (you might want to use a proper UUID library)
const threadId = Date.now().toString();


async function* promptAi(messages) {
  if (!chatbot) {
    throw new Error("Chatbot not initialized. Call initializeChatbot first.");
  }
  
  const config = { configurable: { thread_id: threadId } };

const formattedMessages = Array.isArray(messages) 
      ? messages.map(msg => (typeof msg === 'object' ? msg : { type: "user", content: msg }))
      : [{ role: "user", content: messages }];

 console.log(messages)
  console.log(formattedMessages)
  try {
    const stream = await chatbot.streamEvents(
      { messages: formattedMessages },
      { ...config, version: "v1" }
    );

    for await (const event of stream) {
      console.log(event)
      if (event.event === "on_chat_model_stream") {
        if (event.data && event.data.chunk && event.data.chunk.content) {
          yield event.data.chunk.content;
        }
      }
    }
  } catch (error) {
    console.error("Error in promptAi:", error);
    yield "An error occurred while processing your request.";
  }
}

// Function to use the chatbot
async function chatWithBot(userInput) {
  if (!chatbot) {
    throw new Error("Chatbot not initialized. Call initializeChatbot first.");
  }

  const messages = [
    { type: "human", content: userInput }
  ];

  let fullResponse = "";
  for await (const chunk of promptAi(messages)) {
    fullResponse += chunk;
    // Here you would update your UI with the partial response
    console.log("Partial response:", fullResponse);
  }

  return fullResponse;
}


// Example usage
chatWithBot("Livrez vous à Paris?").then(response => {
  console.log("Final response:", response);
});

// Export the functions that need to be accessible
export { initializeChatbot, chatWithBot };