// DeepSeek API key
const DEEPSEEK_API_KEY = "sk-5976526e3f56409ba780633cc51f46a2"

// Chat history to maintain context
const chatHistory = []

function toggleMenu() {
  const sidebar = document.getElementById("sidebar")
  sidebar.style.left = sidebar.style.left === "0px" ? "-250px" : "0px"
}

function toggleSendButton() {
  const messageInput = document.getElementById("messageInput")
  const sendButton = document.getElementById("sendButton")
  const sendIcon = document.getElementById("sendIcon")
  if (messageInput.value.trim() !== "") {
    sendButton.disabled = false
    sendIcon.src = "https://img.icons8.com/?size=100&id=124436&format=png&color=ffffff"
  } else {
    sendButton.disabled = true
    sendIcon.src = "https://img.icons8.com/?size=100&id=124436&format=png&color=000000"
  }
}

document.getElementById("messageInput").addEventListener("keypress", (event) => {
  const sendButton = document.getElementById("sendButton")
  if (event.key === "Enter" && !sendButton.disabled) {
    event.preventDefault()
    sendMessage()
  }
})

function getCurrentTimestamp() {
  const now = new Date()
  return now.toLocaleString()
}

async function sendMessage() {
  const messageInput = document.getElementById("messageInput")
  const messagesContainer = document.getElementById("messages")
  const userMessage = messageInput.value.trim()

  if (userMessage === "") return

  // Hide logo and quick actions after first message
  document.getElementById("logo-container").style.display = "none"
  document.getElementById("quick-actions").style.display = "none"

  // Display user message
  const userMessageElement = document.createElement("div")
  userMessageElement.className = "message user-message"
  userMessageElement.innerHTML = `${userMessage}<span class="timestamp">${getCurrentTimestamp()}</span>`
  messagesContainer.appendChild(userMessageElement)

  // Add user message to chat history
  chatHistory.push({ role: "user", content: userMessage })

  // Clear the input
  messageInput.value = ""
  toggleSendButton()

  // Display loading animation
  const loadingElement = document.createElement("div")
  loadingElement.className = "message loading"
  loadingElement.textContent = "Loading"
  messagesContainer.appendChild(loadingElement)

  // Scroll to the latest message
  messagesContainer.scrollTop = messagesContainer.scrollHeight

  try {
    // Call DeepSeek API
    const response = await callDeepSeekAPI(chatHistory)

    // Remove loading animation
    messagesContainer.removeChild(loadingElement)

    // Add AI response to chat history
    chatHistory.push({ role: "assistant", content: response })

    // Display AI response with logo
    const aiMessageElement = document.createElement("div")
    aiMessageElement.className = "message ai-message"

    // Format the response to handle markdown and code blocks
    const formattedResponse = formatResponse(response)

    aiMessageElement.innerHTML = `<img src="images/blaze-top.png" alt="Blaze Logo" style="width: 24px; height: 24px;"> ${formattedResponse}<span class="timestamp">${getCurrentTimestamp()}</span>`
    messagesContainer.appendChild(aiMessageElement)

    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  } catch (error) {
    console.error("Error:", error)

    // Remove loading animation
    messagesContainer.removeChild(loadingElement)

    // Display error message
    const errorMessageElement = document.createElement("div")
    errorMessageElement.className = "message error-message"
    errorMessageElement.innerHTML = `Error: ${error.message || "Unable to get response from Blaze."}<span class="timestamp">${getCurrentTimestamp()}</span>`
    messagesContainer.appendChild(errorMessageElement)

    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }
}

async function callDeepSeekAPI(messages) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("DeepSeek API Error:", error)
    throw new Error("Failed to get response from DeepSeek API. Please check your API key and try again.")
  }
}

function formatResponse(text) {
  // Handle code blocks
  text = text.replace(
    /```([\s\S]*?)```/g,
    (match, code) =>
      `<pre style="background-color: #1a1a1a; padding: 10px; border-radius: 5px; overflow-x: auto;"><code>${code}</code></pre>`,
  )

  // Handle inline code
  text = text.replace(
    /`([^`]+)`/g,
    '<code style="background-color: #1a1a1a; padding: 2px 4px; border-radius: 3px;">$1</code>',
  )

  // Handle line breaks
  text = text.replace(/\n/g, "<br>")

  return text
}

function sendQuickAction(message) {
  const messageInput = document.getElementById("messageInput")
  messageInput.value = message
  toggleSendButton()
  sendMessage()
}

// Initialize the chat interface
document.addEventListener("DOMContentLoaded", () => {
  toggleSendButton()
})
