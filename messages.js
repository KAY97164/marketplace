const messagesList =
    document.getElementById("messagesList");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const messageStatus =
    document.getElementById("messageStatus");

const conversationInfo =
    document.getElementById("conversationInfo");


let currentUser = null;
let conversationId = null;


async function initializeMessages() {

    const {
        data: {
            user
        },
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href =
            "auth.html";

        return;
    }


    currentUser = user;


    const params =
        new URLSearchParams(
            window.location.search
        );


    conversationId =
        params.get("conversation");


    if (!conversationId) {

        conversationInfo.textContent =
            "لم يتم تحديد محادثة.";

        messagesList.innerHTML =
            "<p>افتح محادثة من إعلان للتواصل مع البائع.</p>";

        messageForm.style.display =
            "none";

        return;
    }


    await loadConversation();

    await loadMessages();
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
        .eq(
            "id",
            conversationId
        )
        .single();


    if (error || !conversation) {

        console.error(error);

        conversationInfo.textContent =
            "تعذر تحميل المحادثة.";

        messageForm.style.display =
            "none";

        return;
    }


    const isParticipant =
        conversation.buyer_id === currentUser.id ||
        conversation.seller_id === currentUser.id;


    if (!isParticipant) {

        conversationInfo.textContent =
            "لا يمكنك الوصول إلى هذه المحادثة.";

        messageForm.style.display =
            "none";

        return;
    }


    const listingTitle =
        conversation.listings
            ? conversation.listings.title
            : "الإعلان";


    conversationInfo.textContent =
        "المحادثة حول: " +
        listingTitle;
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
        .eq(
            "conversation_id",
            conversationId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        messagesList.innerHTML =
            "<p>تعذر تحميل الرسائل.</p>";

        return;
    }


    messagesList.innerHTML = "";


    if (
        !messages ||
        messages.length === 0
    ) {

        messagesList.innerHTML =
            "<p>لا توجد رسائل بعد. ابدأ المحادثة! 💬</p>";

        return;
    }


    messages.forEach(
        function (message) {

            const messageElement =
                document.createElement(
                    "div"
                );


            messageElement.className =
                "message";


            if (
                message.sender_id ===
                currentUser.id
            ) {

                messageElement.classList.add(
                    "my-message"
                );

            } else {

                messageElement.classList.add(
                    "other-message"
                );
            }


            const content =
                document.createElement(
                    "p"
                );


            content.textContent =
                message.content;


            messageElement.appendChild(
                content
            );


            const date =
                document.createElement(
                    "small"
                );


            date.textContent =
                new Date(
                    message.created_at
                ).toLocaleString(
                    "ar-MA"
                );


            messageElement.appendChild(
                date
            );


            messagesList.appendChild(
                messageElement
            );

        }
    );


    messagesList.scrollTop =
        messagesList.scrollHeight;
}


messageForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const content =
            messageInput.value.trim();


        if (!content) {
            return;
        }


        messageStatus.textContent =
            "جاري الإرسال...";


        const {
            error
        } = await supabase
            .from("messages")
            .insert({

                conversation_id:
                    conversationId,

                sender_id:
                    currentUser.id,

                content:
                    content

            });


        if (error) {

            console.error(error);

            messageStatus.textContent =
                "تعذر إرسال الرسالة.";

            return;
        }


        messageInput.value = "";

        messageStatus.textContent =
            "";


        await loadMessages();

    }
);


initializeMessages();
