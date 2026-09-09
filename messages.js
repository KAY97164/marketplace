const conversationsList = document.getElementById("conversationsList");
const conversationTitle = document.getElementById("conversationTitle");
const messagesList = document.getElementById("messagesList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

let currentUser = null;
let currentConversationId = null;

const params = new URLSearchParams(window.location.search);
const requestedConversationId = params.get("conversation");

async function getUser() {
const { data, error } = await supabase.auth.getUser();

if (error || !data.user) {
    window.location.href = "auth.html";
    return null;
}

return data.user;

}

async function loadConversations() {
const { data, error } = await supabase
.from("conversations")
.select("id, buyer_id, seller_id, listing_id, created_at, listings(title)")
.or(
"buyer_id.eq." + currentUser.id +
",seller_id.eq." + currentUser.id
)
.order("created_at", { ascending: false });

if (error) {
    console.error(error);
    conversationsList.textContent =
        "تعذر تحميل المحادثات.";
    return;
}

conversationsList.innerHTML = "";

if (!data || data.length === 0) {
    conversationsList.textContent =
        "لا توجد محادثات.";
    return;
}

data.forEach(function (conversation) {
    const button = document.createElement("button");

    button.textContent =
        (conversation.listings &&
            conversation.listings.title) ||
        "محادثة";

    button.addEventListener("click", function () {
        loadConversation(conversation.id);
    });

    conversationsList.appendChild(button);
});

if (requestedConversationId) {
    const exists = data.some(function (item) {
        return String(item.id) === String(requestedConversationId);
    });

    if (exists) {
        loadConversation(requestedConversationId);
        return;
    }
}

loadConversation(data[0].id);

}

async function loadConversation(conversationId) {
currentConversationId = conversationId;

const { data: conversation, error } = await supabase
    .from("conversations")
    .select(`
        id,
        buyer_id,
        seller_id,
        listing_id,
        listings(title)
    `)
    .eq("id", conversationId)
    .single();

if (error || !conversation) {
    console.error(error);
    conversationTitle.textContent =
        "تعذر تحميل المحادثة.";
    return;
}

conversationTitle.textContent =
    (conversation.listings &&
        conversation.listings.title) ||
    "المحادثة";

await loadMessages();

}

async function loadMessages() {
if (!currentConversationId) return;

const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", currentConversationId)
    .order("created_at", { ascending: true });

if (error) {
    console.error(error);
    messagesList.textContent =
        "تعذر تحميل الرسائل.";
    return;
}

messagesList.innerHTML = "";

if (!messages || messages.length === 0) {
    messagesList.textContent =
        "لا توجد رسائل بعد.";
    return;
}

messages.forEach(function (message) {
    addMessageToScreen(message);
});

await markMessagesAsRead(messages);

}

function addMessageToScreen(message) {
const box = document.createElement("div");

box.className =
    message.sender_id === currentUser.id
        ? "message own-message"
        : "message";

const content = document.createElement("p");
content.textContent = message.content;

const date = document.createElement("small");
date.textContent =
    new Date(message.created_at).toLocaleString("ar-MA");

box.appendChild(content);
box.appendChild(date);

messagesList.appendChild(box);

messagesList.scrollTop =
    messagesList.scrollHeight;

}

async function markMessagesAsRead(messages) {
const unreadIds = messages
.filter(function (message) {
return (
message.sender_id !== currentUser.id &&
!message.is_read
);
})
.map(function (message) {
return message.id;
});

if (unreadIds.length === 0) return;

const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .in("id", unreadIds);

if (error) {
    console.error(error);
}

}

if (messageForm) {
messageForm.addEventListener("submit", async function (event) {
event.preventDefault();

    if (!currentConversationId) return;

    const content = messageInput.value.trim();

    if (!content) return;

    const { error } = await supabase
        .from("messages")
        .insert({
            conversation_id: currentConversationId,
            sender_id: currentUser.id,
            content: content
        });

    if (error) {
        console.error(error);
        alert("تعذر إرسال الرسالة.");
        return;
    }

    messageInput.value = "";
});

}

async function startRealtime() {
supabase
.channel("chronet-messages")
.on(
"postgres_changes",
{
event: "INSERT",
schema: "public",
table: "messages"
},
function (payload) {
const message = payload.new;

            if (
                String(message.conversation_id) ===
                String(currentConversationId)
            ) {
                addMessageToScreen(message);

                if (
                    message.sender_id !== currentUser.id
                ) {
                    markMessagesAsRead([message]);
                }
            }
        }
    )
    .subscribe();

}

async function start() {
currentUser = await getUser();

if (!currentUser) return;

await loadConversations();
await startRealtime();

}

start();
