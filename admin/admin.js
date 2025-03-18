// Function to search bots by user email
async function searchBotsByEmail() {
    let email = document.getElementById("searchEmail").value.trim();
    if (!email) {
        alert("Please enter an email to search.");
        return;
    }

    let response = await fetch(`https://iyonicbots.onrender.com/get-bots-by-email/${email}`);
    let data = await response.json();

    let botList = document.getElementById("botList");
    botList.innerHTML = "";

    if (data.success && data.bots.length > 0) {
        data.bots.forEach(bot => {
            let botItem = document.createElement("div");
            botItem.className = "bg-white p-4 rounded-lg shadow-md";
            botItem.innerHTML = `
                <h3 class="text-lg font-bold">${bot.name}</h3>
                <p class="text-gray-600"><strong>Owner Email:</strong> ${bot.userEmail}</p>
                <p class="text-gray-600"><strong>Bot ID:</strong> ${bot._id}</p>
                <p class="text-gray-600"><strong>Status:</strong> ${bot.suspended ? "🔴 Suspended" : "🟢 Active"}</p>
                <div class="mt-3">
                    <button onclick="suspendBot('${bot._id}')" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Suspend</button>
                    <button onclick="unsuspendBot('${bot._id}')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Unsuspend</button>
                </div>
            `;
            botList.appendChild(botItem);
        });
    } else {
        botList.innerHTML = "<p class='text-center text-gray-600'>No bots found for this email.</p>";
    }
}

// Function to suspend a bot
async function suspendBot(botId) {
    await fetch(`https://iyonicbots.onrender.com/admin/suspend-bot/${botId}`, { method: "PUT" });
    alert("Bot suspended.");
    loadBots();
}

// Function to unsuspend a bot
async function unsuspendBot(botId) {
    await fetch(`https://iyonicbots.onrender.com/admin/unsuspend-bot/${botId}`, { method: "PUT" });
    alert("Bot unsuspended.");
    loadBots();
}

// Function to load all bots on page load
async function loadBots() {
    let response = await fetch("https://iyonicbots.onrender.com/get-all-bots");
    let data = await response.json();

    let botList = document.getElementById("botList");
    botList.innerHTML = "";

    if (data.success && data.bots.length > 0) {
        data.bots.forEach(bot => {
            let botItem = document.createElement("div");
            botItem.className = "bg-white p-4 rounded-lg shadow-md";
            botItem.innerHTML = `
                <h3 class="text-lg font-bold">${bot.name}</h3>
                <p class="text-gray-600"><strong>Owner Email:</strong> ${bot.userEmail}</p>
                <p class="text-gray-600"><strong>Bot ID:</strong> ${bot._id}</p>
                <p class="text-gray-600"><strong>Status:</strong> ${bot.suspended ? "🔴 Suspended" : "🟢 Active"}</p>
                <div class="mt-3">
                    <button onclick="suspendBot('${bot._id}')" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Suspend</button>
                    <button onclick="unsuspendBot('${bot._id}')" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Unsuspend</button>
                </div>
            `;
            botList.appendChild(botItem);
        });
    } else {
        botList.innerHTML = "<p class='text-center text-gray-600'>No bots found.</p>";
    }
}

// Load all bots on page load
window.onload = loadBots;
