const ordersList =
    document.getElementById("ordersList");


async function loadOrders() {

    const {
        data: {
            user
        },
        error: userError
    } = await supabase.auth.getUser();


    if (userError || !user) {

        window.location.href =
            "auth.html";

        return;
    }


    const {
        data: orders,
        error
    } = await supabase
        .from("orders")
        .select(`
            id,
            total,
            status,
            created_at,
            order_items (
                id,
                quantity,
                price,
                listings (
                    title,
                    city,
                    image_urls
                )
            )
        `)
        .eq(
            "buyer_id",
            user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        ordersList.innerHTML =
            "<p>تعذر تحميل الطلبات.</p>";

        return;
    }


    ordersList.innerHTML = "";


    if (!orders || orders.length === 0) {

        ordersList.innerHTML =
            "<p>ليس لديك طلبات حتى الآن. 📦</p>";

        return;
    }


    orders.forEach(function (order) {

        const orderCard =
            document.createElement("article");

        orderCard.className =
            "listing-card";


        const title =
            document.createElement("h3");

        title.textContent =
            "الطلب #" +
            order.id;

        orderCard.appendChild(title);


        const status =
            document.createElement("p");

        const statusNames = {

            pending:
                "قيد الانتظار ⏳",

            confirmed:
                "تم التأكيد ✅",

            shipped:
                "تم الشحن 🚚",

            delivered:
                "تم التسليم 📦",

            cancelled:
                "ملغى ❌"

        };


        status.textContent =
            "الحالة: " +
            (
                statusNames[order.status] ||
                order.status
            );

        orderCard.appendChild(status);


        const total =
            document.createElement("p");

        total.textContent =
            "المجموع: " +
            Number(order.total).toFixed(2) +
            " درهم";

        orderCard.appendChild(total);


        const date =
            document.createElement("small");

        date.textContent =
            new Date(
                order.created_at
            ).toLocaleString("ar-MA");

        orderCard.appendChild(date);


        if (
            order.order_items &&
            order.order_items.length > 0
        ) {

            const itemsTitle =
                document.createElement("h4");

            itemsTitle.textContent =
                "المنتجات:";

            orderCard.appendChild(
                itemsTitle
            );


            order.order_items.forEach(
                function (item) {

                    if (!item.listings) {
                        return;
                    }


                    const itemElement =
                        document.createElement("p");


                    itemElement.textContent =
                        item.listings.title +
                        " × " +
                        item.quantity +
                        " — " +
                        (
                            Number(item.price) *
                            Number(item.quantity)
                        ).toFixed(2) +
                        " درهم";


                    orderCard.appendChild(
                        itemElement
                    );

                }
            );

        }


        ordersList.appendChild(
            orderCard
        );

    });

}


loadOrders();
