const ws = new WebSocket(`wss://${window.location.host}`);
let conversationHistory = [];
let currentAIMessageElement = null;

ws.onopen = function() {
  console.log('WebSocket Client Connected');
};

ws.onmessage = function(e) {
  if (e.data.includes("[DONE]")) {
    console.log("AI message stream ended.");
    currentAIMessageElement = null;
    return;
  }

  const jsonChunk = e.data.startsWith("data: ") ? e.data.substring(5) : e.data;

  try {
    const messageChunk = JSON.parse(jsonChunk);

    if (messageChunk.choices && messageChunk.choices.length > 0) {
      const content = messageChunk.choices[0].delta.content;
      if (!currentAIMessageElement) {
        currentAIMessageElement = createMessageElement("Llama", "");
      }
      updateMessageContent(currentAIMessageElement, content);
      storeMessageInHistory(content, "assistant");
    }
  } catch (err) {
    console.error("Error parsing message chunk:", err);
  }
};

document.getElementById("send-button").addEventListener("click", () => {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (message) {
    displayMessage(message, "You");
    storeMessageInHistory(message, "user");
    ws.send(JSON.stringify({ action: 'generateResponse', content: message, history: conversationHistory }));
    input.value = '';
  }
});

function storeMessageInHistory(message, role) {
  conversationHistory.push({ content: message, role: role });
}

function displayMessage(message, sender) {
  const messageElement = createMessageElement(sender, message);
  document.getElementById("chat-box").appendChild(messageElement);
  return messageElement;
}

function createMessageElement(sender, message) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.className = sender.toLowerCase() + "-message";

  const senderSpan = document.createElement("span");
  senderSpan.style.fontWeight = "bold";
  senderSpan.textContent = sender + ": ";
  messageElement.appendChild(senderSpan);

  const textNode = document.createTextNode(message);
  messageElement.appendChild(textNode);

  chatBox.appendChild(messageElement);
  return messageElement;
}

function updateMessageContent(messageElement, content) {
  messageElement.appendChild(document.createTextNode(content));
}
