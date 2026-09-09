const ordersContainer =
    document.getElementById("ordersContainer");

let currentUser = null;

function formatPrice(price, currency) {
    const symbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        MAD: "MAD",
        AED: "AED",
        SAR: "SAR",
        QAR: "QAR",
        KWD: "KWD",
        BHD: "BHD",
        CAD: "CAD",
        AUD: "AUD",
        JPY: "¥",
        CNY: "¥",
        INR: "₹",
        BDT: "৳",
        TRY: "₺",
        CHF: "CHF",
        BRL: "R$",
        ZAR: "ZAR"
    };

    const code = currency || "USD";
    const symbol = symbols[code] || code;

    return Number(price).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " " + symbol;
}

async function getUser() {
    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href =
            "auth.html";
        return null;
    }

    return data.user;
}

async function loadOrders() {
    const {
        data: orders,
        error
    } = await supabase
        .from("orders")
        .select(`
            id,
            total,
            currency,
            status,
            payment_status,
            payment_method,
            shipping_address,
            created_at,
            order_items (
                id,
                quantity,
                price,
                listings (
                    title,
                    image_urls,
                    city,
                    country,
                    currency
                )
            )
        `)
        .eq(
            "buyer_id",
            currentUser.id
        )
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        console.error(error);

        ordersContainer.textContent =
            "تعذر تحميل الطلبات.";

        return;
    }

    ordersContainer.innerHTML = "";

    if (!orders || orders.length === 0) {
        ordersContainer.textContent =
            "لا توجد طلبات حتى الآن.";

        return;
    }

    orders.forEach(function (order) {

        const box =
            document.createElement("article");

        box.className =
            "listing-card";

        const title =
            document.createElement("h3");

        title.textContent =
            "الطلب #" +
            order.id;

        box.appendChild(title);

        const total =
            document.createElement("p");

        total.textContent =
            "المجموع: " +
            formatPrice(
                order.total,
                order.currency
            );

        box.appendChild(total);

        const status =
            document.createElement("p");

        status.textContent =
            "حالة الطلب: " +
            order.status;

        box.appendChild(status);

        const payment =
            document.createElement("p");

        payment.textContent =
            "الدفع: " +
            (
                order.payment_status ||
                "unpaid"
            );

        box.appendChild(payment);

        const method =
            document.createElement("p");

        method.textContent =
            "طريقة الدفع: " +
            (
                order.payment_method ||
                "غير محددة"
            );

        box.appendChild(method);

        const address =
            document.createElement("p");

        address.textContent =
            "عنوان الشحن: " +
            (
                order.shipping_address ||
                "غير محدد"
            );

        box.appendChild(address);

        const date =
            document.createElement("p");

        date.textContent =
            "التاريخ: " +
            new Date(
                order.created_at
            ).toLocaleString(
                "ar-MA"
            );

        box.appendChild(date);

        const itemsTitle =
            document.createElement("h4");

        itemsTitle.textContent =
            "المنتجات";

        box.appendChild(
            itemsTitle
        );

        if (
            order.order_items &&
            order.order_items.length > 0
        ) {

            order.order_items.forEach(
                function (item) {

                    const itemBox =
                        document.createElement(
                            "div"
                        );

                    const listing =
                        item.listings;

                    if (
                        listing &&
                        listing.image_urls &&
                        listing.image_urls.length > 0
                    ) {

                        const image =
                            document.createElement(
                                "img"
                            );

                        image.src =
                            listing.image_urls[0];

                        image.alt =
                            listing.title || "";

                        image.width = 100;
                        image.loading =
                            "lazy";

                        itemBox.appendChild(
                            image
                        );
                    }

                    const itemTitle =
                        document.createElement(
                            "p"
                        );

                    itemTitle.textContent =
                        listing
                            ? listing.title
                            : "منتج";

                    itemBox.appendChild(
                        itemTitle
                    );

                    const itemPrice =
                        document.createElement(
                            "p"
                        );

                    itemPrice.textContent =
                        "السعر: " +
                        formatPrice(
                            item.price,
                            (
                                listing &&
                                listing.currency
                            ) ||
                            order.currency
                        );

                    itemBox.appendChild(
                        itemPrice
                    );

                    const quantity =
                        document.createElement(
                            "p"
                        );

                    quantity.textContent =
                        "الكمية: " +
                        item.quantity;

                    itemBox.appendChild(
                        quantity
                    );

                    if (listing) {

                        const location =
                            document.createElement(
                                "p"
                            );

                        location.textContent =
                            "الموقع: " +
                            (
                                listing.city ||
                                "غير محددة"
                            ) +
                            "، " +
                            (
                                listing.country ||
                                "غير محددة"
                            );

                        itemBox.appendChild(
                            location
                        );
                    }

                    box.appendChild(
                        itemBox
                    );
                }
            );
        }

        ordersContainer.appendChild(
            box
        );
    });
}

async function start() {

    currentUser =
        await getUser();

    if (!currentUser) return;

    await loadOrders();
}

start();
