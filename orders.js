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
            payment_status,
            payment_method,
            shipping_address,
            created_at,
            order_items (
                id,
                quantity,
                price,
                seller_id,
                listings (
                    id,
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

        status.textContent =
            "الحالة: " +
            getStatusName(order.status);

        orderCard.appendChild(status);


        const payment =
            document.createElement("p");

        payment.textContent =
            "الدفع: " +
            getPaymentStatusName(
                order.payment_status
            );

        orderCard.appendChild(payment);


        const method =
            document.createElement("p");

        method.textContent =
            "طريقة الدفع: " +
            (
                order.payment_method ===
                "cash_on_delivery"
                    ? "الدفع عند الاستلام"
                    : order.payment_method || "غير محددة"
            );

        orderCard.appendChild(method);


        const address =
            document.createElement("p");

        address.textContent =
            "عنوان التوصيل: " +
            order.shipping_address;

        orderCard.appendChild(address);


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
            "تاريخ الطلب: " +
            new Date(
                order.created_at
            ).toLocaleString("ar-MA");

        orderCard.appendChild(date);


        const itemsTitle =
            document.createElement("h4");

        itemsTitle.textContent =
            "المنتجات:";

        orderCard.appendChild(
            itemsTitle
        );


        if (
            order.order_items &&
            order.order_items.length > 0
        ) {

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


function getPaymentStatusName(status) {

    const names = {

        unpaid:
            "غير مدفوع",

        paid:
            "تم الدفع ✅",

        refunded:
            "تم استرداد المبلغ ↩️"

    };


    return names[status] || status || "غير محدد";

}


loadOrders();
