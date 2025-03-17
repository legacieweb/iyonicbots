document.getElementById("botForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    let user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.email) {
        alert("You must be logged in to create a bot.");
        return;
    }

    let name = document.getElementById("businessName").value;
    let desc = document.getElementById("businessDesc").value;
    let badgeColor = document.getElementById("badgeColor").value;
    let badgePosition = document.getElementById("badgePosition").value;

    let conversations = [];
    document.querySelectorAll(".conversationPair").forEach(pair => {
        let question = pair.querySelector(".customerQuestion").value;
        let response = pair.querySelector(".botResponse").value;
        conversations.push({ question, response });
    });

    // Save bot to database
    let response = await fetch("https://iyonicbots.onrender.com/save-bot", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userEmail: user.email, 
            name,
            desc,
            conversations,
            badgeColor,
            badgePosition
        })
    });

    let data = await response.json();
    if (data.success) {
        alert("Your bot has been saved successfully!");

        // Generate the chatbot embed code using the backend URL
        let scriptCode = `<script src="https://iyonicbots.onrender.com/get-bot-script/${data.botId}"></script>`;
        document.getElementById("integrationCode").value = scriptCode;
    } else {
        alert("Error: " + data.message);
    }
});

// Function to toggle the saved conversations section
function toggleSavedConversations() {
    let section = document.getElementById("savedConversations");

    if (section.classList.contains("hidden")) {
        section.classList.remove("hidden");  // Show section
        loadSavedBots();  // Load saved bots from backend
    } else {
        section.classList.add("hidden");  // Hide section
    }
}

// Function to load the user's saved bots from the backend
async function loadSavedBots() {
    let user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.email) {
        alert("You must be logged in to view your bots.");
        return;
    }

    let response = await fetch("https://iyonicbots.onrender.com/get-user-bots", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userEmail: user.email }) // Use email for authentication
    });

    let data = await response.json();
    let list = document.getElementById("conversationList");
    list.innerHTML = "";  // Clear previous data

    if (data.success && data.bots.length > 0) {
        data.bots.forEach(bot => {
            let listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>${bot.name}</strong>: ${bot.desc} 
                <br> 
                <button onclick="viewBot('${bot._id}')">👀 View</button>
                <button onclick="deleteBot('${bot._id}')">🗑 Delete</button>
            `;
            list.appendChild(listItem);
        });
    } else {
        list.innerHTML = "<p>No saved bots found.</p>";
    }
}

// Function to delete a bot
async function deleteBot(botId) {
    let confirmDelete = confirm("Are you sure you want to delete this bot?");
    if (!confirmDelete) return;

    let response = await fetch(`https://iyonicbots.onrender.com/delete-bot/${botId}`, {
        method: "DELETE"
    });

    let data = await response.json();
    if (data.success) {
        alert("Bot deleted successfully.");
        loadSavedBots();  // Refresh list
    } else {
        alert("Error: " + data.message);
    }
}

// Function to copy the integration code
function copyIntegrationCode() {
    let integrationCode = document.getElementById("integrationCode");

    if (!integrationCode) {
        alert("Integration code not found!");
        return;
    }

    integrationCode.select();
    document.execCommand("copy");
    alert("Integration code copied to clipboard!");
}

// Function to log out the user
function logout() {
    localStorage.removeItem("user");  // Remove user session
    window.location.href = "../login";  // Redirect to login page
}
function dashboard() {
    localStorage.removeItem("user");  // Remove user session
    window.location.href = "../dashboard";  // Redirect to login page
}
// Function to add new question-response fields dynamically
function addConversation() {
    let container = document.getElementById("conversationContainer");

    let div = document.createElement("div");
    div.classList.add("conversationPair");
    div.innerHTML = `
        <input type="text" class="customerQuestion" placeholder="Customer Question" required>
        <input type="text" class="botResponse" placeholder="Bot Response" required>
        <button class="remove-btn" onclick="removeConversation(this)">❌ Remove</button>
    `;
    
    container.appendChild(div);
}

// Function to remove a question-response pair
function removeConversation(button) {
    button.parentElement.remove();
}
// Function to load the chatbot and fetch stored conversations
async function loadChatbot(botId) {
    let response = await fetch(`https://iyonicbots.onrender.com/get-bot/${botId}`);
    let data = await response.json();

    if (data.success) {
        let bot = data.bot;
        let conversations = bot.conversations;

        // Function to send a message and get a bot response
        function sendMessage() {
            let input = document.getElementById("chatInput");
            let message = input.value.trim();
            if (message === "") return;

            let chatMessages = document.getElementById("chatMessages");
            chatMessages.innerHTML += `<div><strong>You:</strong> ${message}</div>`;

            let botResponse = "I'm not sure I understand.";
            for (let conv of conversations) {
                if (message.toLowerCase() === conv.question.toLowerCase()) {
                    botResponse = conv.response;
                    break;
                }
            }

            setTimeout(() => {
                chatMessages.innerHTML += `<div><strong>${bot.name}:</strong> ${botResponse}</div>`;
            }, 1000);

            input.value = "";
        }

        // Function to open chatbot
        function openChat() {
            let chatPopup = document.getElementById("chatPopup");
            if (!chatPopup) {
                chatPopup = document.createElement("div");
                chatPopup.id = "chatPopup";
                chatPopup.style.cssText = `position:fixed; bottom:20px; ${bot.badgePosition}:20px; width:300px; height:400px; background:white; box-shadow:0 0 10px rgba(0,0,0,0.2); border-radius:10px; padding:10px; overflow:hidden;`;
                chatPopup.innerHTML = `
                    <h3>${bot.name}</h3>
                    <p>${bot.desc}</p>
                    <div id="chatMessages" style="height:300px; overflow-y:auto;"></div>
                    <input type="text" id="chatInput" placeholder="Type a message..." onkeydown="if(event.keyCode==13) sendMessage();">
                    <button onclick="sendMessage()">Send</button>
                    <button onclick="closeChat()">❌ Close</button>
                    <button onclick="openAddConversation('${bot._id}')">➕ Add Conversation</button>
                `;
                document.body.appendChild(chatPopup);
            }
        }

        // Function to close chatbot
        function closeChat() {
            let chatPopup = document.getElementById("chatPopup");
            if (chatPopup) chatPopup.remove();
        }

        // Function to open the add conversation popup
        function openAddConversation(botId) {
            let addConversationPopup = document.getElementById("addConversationPopup");
            if (!addConversationPopup) {
                addConversationPopup = document.createElement("div");
                addConversationPopup.id = "addConversationPopup";
                addConversationPopup.style.cssText = `position:fixed; top:20px; left:50%; transform:translateX(-50%); width:400px; background:white; box-shadow:0 0 10px rgba(0,0,0,0.2); border-radius:10px; padding:20px; text-align:center;`;
                addConversationPopup.innerHTML = `
                    <h3>Add New Conversation</h3>
                    <input type="text" id="newQuestion" placeholder="Customer Question">
                    <input type="text" id="newResponse" placeholder="Bot Response">
                    <button onclick="addNewConversation('${botId}')">Add</button>
                    <button onclick="closeAddConversation()">❌ Close</button>
                `;
                document.body.appendChild(addConversationPopup);
            }
        }

        // Function to close the add conversation popup
        function closeAddConversation() {
            let addConversationPopup = document.getElementById("addConversationPopup");
            if (addConversationPopup) addConversationPopup.remove();
        }

        // Function to add new conversation to an existing bot
        async function addNewConversation(botId) {
            let newQuestion = document.getElementById("newQuestion").value.trim();
            let newResponse = document.getElementById("newResponse").value.trim();

            if (!newQuestion || !newResponse) {
                alert("Please fill in both fields.");
                return;
            }

            let response = await fetch(`https://iyonicbots.onrender.com/add-conversation/${botId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: newQuestion, response: newResponse })
            });

            let data = await response.json();
            if (data.success) {
                alert("Conversation added successfully!");
                closeAddConversation();
                loadChatbot(botId); // Reload chatbot with updated data
            } else {
                alert("Error: " + data.message);
            }
        }

        // Make functions globally accessible
        window.openChat = openChat;
        window.closeChat = closeChat;
        window.sendMessage = sendMessage;
        window.openAddConversation = openAddConversation;
        window.closeAddConversation = closeAddConversation;
        window.addNewConversation = addNewConversation;
    } else {
        alert("Error: " + data.message);
    }
}
// Function to view a bot's details in a vertical popup layout
// Function to view a bot's details in a popup
async function viewBot(botId) {
    let response = await fetch(`https://iyonicbots.onrender.com/get-bot/${botId}`);
    let data = await response.json();

    if (data.success) {
        let bot = data.bot;

        // Create popup structure
        let popup = document.createElement("div");
        popup.id = "botPopup";
        popup.style.cssText = `position:fixed; top:10%; left:50%; transform:translateX(-50%); width:400px; background:white; box-shadow:0 0 10px rgba(0,0,0,0.2); border-radius:10px; padding:20px; text-align:center; overflow:auto;`;

        let integrationCode = `<script src="https://iyonicbots.onrender.com/get-bot-script/${bot._id}"></script>`;

        popup.innerHTML = `
            <h2>🤖 ${bot.name}</h2>
            <p><strong>Description:</strong> ${bot.desc}</p>
            <p><strong>Bot ID:</strong> ${bot._id}</p>

            <h3>💬 Conversations</h3>
            <div id="botConversations">
                ${bot.conversations.length > 0 ? bot.conversations.map(conv => `
                    <div class="conversation-box">
                        <p><strong>Q:</strong> ${conv.question}</p>
                        <p><strong>A:</strong> ${conv.response}</p>
                        <button onclick="deleteConversation('${bot._id}', '${conv.question}')">🗑 Delete</button>
                    </div>
                `).join("") : "<p>No conversations added yet.</p>"}
            </div>

            <h3>➕ Add New Conversations</h3>
            <div id="newConversationContainer">
                <input type="text" id="newQuestion" placeholder="New Customer Question">
                <input type="text" id="newResponse" placeholder="New Bot Response">
                <button onclick="addNewConversation('${bot._id}')">Add</button>
            </div>

            <h3>📌 Your Integrated Code</h3>
            <textarea id="integrationCode" readonly>${integrationCode}</textarea>
          

            <button onclick="closeBotPopup()" class="close-btn">❌ Close</button>
        `;

        document.body.appendChild(popup);
    } else {
        alert("Error: " + data.message);
    }
}


// Function to close the bot popup
function closeBotPopup() {
    let popup = document.getElementById("botPopup");
    if (popup) popup.remove();
}

// Function to add new conversation to an existing bot
async function addNewConversation(botId) {
    let newQuestion = document.getElementById("newQuestion").value.trim();
    let newResponse = document.getElementById("newResponse").value.trim();

    if (!newQuestion || !newResponse) {
        alert("Please fill in both fields.");
        return;
    }

    let response = await fetch(`https://iyonicbots.onrender.com/add-conversation/${botId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, response: newResponse })
    });

    let data = await response.json();
    if (data.success) {
        alert("Conversation added successfully!");
        viewBot(botId); // Reload popup with updated data
    } else {
        alert("Error: " + data.message);
    }
}

// Make functions globally accessible
window.viewBot = viewBot;
window.closeBotPopup = closeBotPopup;
window.addNewConversation = addNewConversation;
window.copyIntegrationCode = copyIntegrationCode;
