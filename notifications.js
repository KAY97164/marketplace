const notificationsList =
    document.getElementById("notificationsList");

const readAllButton =
    document.getElementById("readAllButton");

let currentUser = null;


async function loadNotifications() {

    const {
        data: {
            user
        },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        window.location.href = "auth.html";
        return;
    }

    currentUser = user;

    const {
        data: notifications,
        error
    } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        notificationsList.innerHTML =
            "<p>تعذر تحميل الإشعارات.</p>";

        return;
    }

    notificationsList.innerHTML = "";

    if (
        !notifications ||
        notifications.length === 0
    ) {

        notificationsList.innerHTML =
            "<p>لا توجد إشعارات حاليًا. 🔔</p>";

        return;
    }

    notifications.forEach(
        function (notification) {

            const item =
                document.createElement("article");

            item.className =
                "listing-card";

            if (!notification.is_read) {
                item.style.fontWeight = "bold";
            }

            const title =
                document.createElement("h3");

            title.textContent =
                notification.title;

            item.appendChild(title);

            const content =
                document.createElement("p");

            content.textContent =
                notification.content || "";

            item.appendChild(content);

            const date =
                document.createElement("small");

            date.textContent =
                new Date(
                    notification.created_at
                ).toLocaleString("ar-MA");

            item.appendChild(date);

            if (!notification.is_read) {

                const button =
                    document.createElement("button");

                button.textContent =
                    "تحديد كمقروء";

                button.addEventListener(
                    "click",
                    async function () {

                        await supabase
                            .from("notifications")
                            .update({
                                is_read: true
                            })
                            .eq(
                                "id",
                                notification.id
                            )
                            .eq(
                                "user_id",
                                currentUser.id
                            );

                        loadNotifications();
                    }
                );

                item.appendChild(button);
            }

            if (
                notification.conversation_id
            ) {

                item.style.cursor =
                    "pointer";

                item.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target.tagName ===
                            "BUTTON"
                        ) {
                            return;
                        }

                        window.location.href =
                            "messages.html?conversation=" +
                            notification.conversation_id;
                    }
                );
            }

            notificationsList.appendChild(item);
        }
    );
}


readAllButton.addEventListener(
    "click",
    async function () {

        if (!currentUser) {
            return;
        }

        await supabase
            .from("notifications")
            .update({
                is_read: true
            })
            .eq(
                "user_id",
                currentUser.id
            );

        loadNotifications();
    }
);


loadNotifications();
