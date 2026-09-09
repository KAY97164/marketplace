const sellerOrdersList =
    document.getElementById("sellerOrdersList");


async function loadSellerOrders() {

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
        data: items,
        error
    } = await supabase
        .from("order_items")
        .select(`
            id,
            order_id,
            listing_id,
            quantity,
            price,
            seller_id,
            orders (
                id,
                buyer_id,
                total,
                status,
                created_at
            ),
            listings (
                title,
                city,
                image_urls
            )
        `)
        .eq(
            "seller_id",
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

        sellerOrdersList.innerHTML =
            "<p>تعذر تحميل طلبات البيع.</p>";

        return;
    }


    sellerOrdersList.innerHTML = "";


    if (!items || items.length === 0) {

        sellerOrdersList.innerHTML =
            "<p>لا توجد طلبات بيع حتى الآن. 📦</p>";

        return;
    }


    const orders = {};


    items.forEach(function (item) {

        if (!item.orders) {
            return;
        }


        if (!orders[item.order_id]) {

            orders[item.order_id] = {
                order: item.orders,
                items: []
            };

        }


        orders[item.order_id].items.push(item);

    });


    Object.values(orders).forEach(
        function (orderData) {

            const order =
                orderData.order;

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


            const total =
                document.createElement("p");

            total.textContent =
                "إجمالي الطلب: " +
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


            const statusTitle =
                document.createElement("p");

            statusTitle.textContent =
                "الحالة الحالية: " +
                getStatusName(order.status);

            orderCard.appendChild(
                statusTitle
            );


            const itemsTitle =
                document.createElement("h4");

            itemsTitle.textContent =
                "منتجاتك في هذا الطلب:";

            orderCard.appendChild(
                itemsTitle
            );


            orderData.items.forEach(
                function (item) {

                    const product =
                        document.createElement("p");


                    product.textContent =
                        (
                            item.listings
                                ? item.listings.title
                                : "منتج"
                        ) +
                        " × " +
                        item.quantity +
                        " — " +
                        (
                            Number(item.price) *
                            Number(item.quantity)
                        ).toFixed(2) +
                        " درهم";


                    orderCard.appendChild(
                        product
                    );

                }
            );


            const label =
                document.createElement("label");

            label.textContent =
                "تغيير حالة الطلب:";

            orderCard.appendChild(
                label
            );


            const select =
                document.createElement("select");


            const statuses = [

                ["pending", "قيد الانتظار ⏳"],

                ["confirmed", "تم التأكيد ✅"],

                ["shipped", "تم الشحن 🚚"],

                ["delivered", "تم التسليم 📦"],

                ["cancelled", "ملغى ❌"]

            ];


            statuses.forEach(
                function (status) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        status[0];

                    option.textContent =
                        status[1];

                    if (
                        status[0] ===
                        order.status
                    ) {
                        option.selected = true;
                    }

                    select.appendChild(
                        option
                    );

                }
            );


            orderCard.appendChild(
                select
            );


            const updateButton =
                document.createElement("button");

            updateButton.textContent =
                "حفظ الحالة";


            updateButton.addEventListener(
                "click",
                async function () {

                    const newStatus =
                        select.value;


                    updateButton.disabled =
                        true;


                    const {
                        error:
                        updateError
                    } = await supabase
                        .from("orders")
                        .update({
                            status:
                                newStatus
                        })
                        .eq(
                            "id",
                            order.id
                        );


                    if (updateError) {

                        console.error(
                            updateError
                        );

                        alert(
                            "تعذر تحديث حالة الطلب."
                        );

                        updateButton.disabled =
                            false;

                        return;
                    }


                    alert(
                        "تم تحديث حالة الطلب بنجاح ✅"
                    );


                    loadSellerOrders();

                }
            );


            orderCard.appendChild(
                updateButton
            );


            sellerOrdersList.appendChild(
                orderCard
            );

        }
    );

}


function getStatusName(status) {

    const names = {

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


    return names[status] || status;
}


loadSellerOrders();
