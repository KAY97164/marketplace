const messagesList = document.getElementById("messagesList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messageStatus = document.getElementById("messageStatus");
const conversationInfo = document.getElementById("conversationInfo");
const conversationsList = document.getElementById("conversationsList");

let currentUser = null;
let conversationId = null;

async function initializeMessages() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = "auth.html";
        return;
    }

    currentUser = user;

    await loadConversations();

    const params =
        new URLSearchParams(window.location.search);

    conversationId =
        params.get("conversation");

    if (!conversationId) {
        conversationInfo.textContent =
            "اختر محادثة من القائمة.";
        messagesList.innerHTML =
            "<p>لم تختر محادثة بعد.</p>";
        messageForm.style.display = "none";
        return;
    }

    await loadConversation();
    await loadMessages();

    startRealtime();
}

async function loadConversations() {

    const {
        data: conversations,
        error
    } = await supabase
        .from("conversations")
        .select(`
            id,
            buyer_id,
            seller_id,
            listing_id,
            created_at,
            listings (
                title
            )
        `)
        .or(
            "buyer_id.eq." +
            currentUser.id +
            ",seller_id.eq." +
            currentUser.id
        )
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);
        conversationsList.innerHTML =
            "<p>تعذر تحميل المحادثات.</p>";
        return;
    }

    conversationsList.innerHTML = "";

    if (!conversations || conversations.length === 0) {
        conversationsList.innerHTML =
            "<p>لا توجد لديك محادثات حتى الآن.</p>";
        return;
    }

    conversations.forEach(function (conversation) {

        const card =
            document.createElement("article");

        card.className = "listing-card";
        card.style.cursor = "pointer";

        const title =
            document.createElement("h3");

        title.textContent =
            conversation.listings
                ? conversation.listings.title
                : "إعلان";

        card.appendChild(title);

        const person =
            document.createElement("p");

        person.textContent =
            conversation.buyer_id === currentUser.id
                ? "أنت المشتري"
                : "أنت البائع";

        card.appendChild(person);

        card.addEventListener(
            "click",
            function () {

                window.location.href =
                    "messages.html?conversation=" +
                    conversation.id;

            }
        );

        conversationsList.appendChild(card);
    });
}

async function loadConversation() {

    const {
        data: conversation,
        error
    } = await supabase
        .from("conversations")
        .select(`
            id,
            buyer_id,
            seller_id,
            listing_id,
            listings (
                title
            )
        `)
        .eq("id", conversationId)
        .single();

    if (error || !conversation) {
        conversationInfo.textContent =
            "تعذر تحميل المحادثة.";
        messageForm.style.display = "none";
        return;
    }

    if (
        conversation.buyer_id !== currentUser.id &&
        conversation.seller_id !== currentUser.id
    ) {
        conversationInfo.textContent =
            "لا يمكنك الوصول إلى هذه المحادثة.";
        messageForm.style.display = "none";
        return;
    }

    conversationInfo.textContent =
        "المحادثة حول: " +
        (
            conversation.listings
                ? conversation.listings.title
                : "الإعلان"
        );
}

async function loadMessages() {

    const {
        data: messages,
        error
    } = await supabase
        .from("messages")
        .select(`
            id,
            sender_id,
            content,
            created_at,
            is_read
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", {
            ascending: true
        });

    if (error) {
        console.error(error);
        messagesList.innerHTML =
            "<p>تعذر تحميل الرسائل.</p>";
        return;
    }

    messagesList.innerHTML = "";

    if (!messages || messages.length === 0) {
        messagesList.innerHTML =
            "<p>لا توجد رسائل بعد. ابدأ المحادثة! 💬</p>";
        return;
    }

    messages.forEach(function (message) {

        const messageElement =
            document.createElement("div");

        messageElement.className = "message";

        messageElement.classList.add(
            message.sender_id === currentUser.id
                ? "my-message"
                : "other-message"
        );

        const content =
            document.createElement("p");

        content.textContent =
            message.content;

        messageElement.appendChild(content);

        const date =
            document.createElement("small");

        date.textContent =
            new Date(message.created_at)
                .toLocaleString("ar-MA");

        messageElement.appendChild(date);

        messagesList.appendChild(messageElement);
    });

    messagesList.scrollTop =
        messagesList.scrollHeight;
}

messageForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const content =
            messageInput.value.trim();

        if (!content) return;

        messageStatus.textContent =
            "جاري الإرسال...";

        const {
            data: conversation
        } = await supabase
            .from("conversations")
            .select("buyer_id, seller_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) {
            messageStatus.textContent =
                "تعذر العثور على المحادثة.";
            return;
        }

        const {
            data: newMessage,
            error
        } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: content
            })
            .select("id")
            .single();

        if (error) {
            console.error(error);
            messageStatus.textContent =
                "تعذر إرسال الرسالة.";
            return;
        }

        const receiverId =
            conversation.buyer_id === currentUser.id
                ? conversation.seller_id
                : conversation.buyer_id;

        await supabase
            .from("notifications")
            .insert({
                user_id: receiverId,
                type: "message",
                title: "رسالة جديدة 💬",
                content: content,
                listing_id: conversation.listing_id,
                conversation_id: conversationId,
                message_id: newMessage.id
            });

        messageInput.value = "";
        messageStatus.textContent = "";

        await loadMessages();
    }
);

function startRealtime() {

    supabase
        .channel(
            "conversation-" +
            conversationId
        )
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter:
                    "conversation_id=eq." +
                    conversationId
            },
            function () {
                loadMessages();
            }
        )
        .subscribe();
}

initializeMessages();
