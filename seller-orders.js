const ordersContainer =
    document.getElementById("sellerOrdersContainer");

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
        window.location.href = "auth.html";
        return null;
    }

    return data.user;
}

async function loadSellerOrders() {
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
            listings (
                title,
                image_urls,
                city,
                country,
                currency
            ),
            orders (
                id,
                buyer_id,
                total,
                currency,
                status,
                payment_status,
                payment_method,
                shipping_address,
                created_at
            )
        `)
        .eq("seller_id", currentUser.id)
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);

        ordersContainer.textContent =
            "تعذر تحميل طلبات البيع.";

        return;
    }

    ordersContainer.innerHTML = "";

    if (!items || items.length === 0) {
        ordersContainer.textContent =
            "لا توجد طلبات بيع حتى الآن.";

        return;
    }

    const orders = {};

    items.forEach(function (item) {
        if (!item.orders) return;

        const orderId = item.order_id;

        if (!orders[orderId]) {
            orders[orderId] = {
                order: item.orders,
                items: []
            };
        }

        orders[orderId].items.push(item);
    });

    Object.values(orders).forEach(function (group) {
        const order = group.order;

        const box =
            document.createElement("article");

        box.className = "listing-card";

        const title =
            document.createElement("h3");

        title.textContent =
            "طلب البيع #" + order.id;

        box.appendChild(title);

        const total =
            document.createElement("p");

        total.textContent =
            "إجمالي الطلب: " +
            formatPrice(
                order.total,
                order.currency
            );

        box.appendChild(total);

        const status =
            document.createElement("p");

        status.textContent =
            "الحالة الحالية: " +
            order.status;

        box.appendChild(status);

        const payment =
            document.createElement("p");

        payment.textContent =
            "حالة الدفع: " +
            (order.payment_status || "unpaid");

        box.appendChild(payment);

        const method =
            document.createElement("p");

        method.textContent =
            "طريقة الدفع: " +
            (order.payment_method || "غير محددة");

        box.appendChild(method);

        const address =
            document.createElement("p");

        address.textContent =
            "عنوان الشحن: " +
            (order.shipping_address || "غير محدد");

        box.appendChild(address);

        const date =
            document.createElement("p");

        date.textContent =
            "التاريخ: " +
            new Date(
                order.created_at
            ).toLocaleString("ar-MA");

        box.appendChild(date);

        const itemsTitle =
            document.createElement("h4");

        itemsTitle.textContent =
            "منتجاتك في هذا الطلب";

        box.appendChild(itemsTitle);

        group.items.forEach(function (item) {
            const itemBox =
                document.createElement("div");

            const listing = item.listings;

            if (
                listing &&
                listing.image_urls &&
                listing.image_urls.length > 0
            ) {
                const image =
                    document.createElement("img");

                image.src =
                    listing.image_urls[0];

                image.alt =
                    listing.title || "";

                image.width = 100;
                image.loading = "lazy";

                itemBox.appendChild(image);
            }

            const itemTitle =
                document.createElement("p");

            itemTitle.textContent =
                listing
                    ? listing.title
                    : "منتج";

            itemBox.appendChild(itemTitle);

            const itemPrice =
                document.createElement("p");

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

            itemBox.appendChild(itemPrice);

            const quantity =
                document.createElement("p");

            quantity.textContent =
                "الكمية: " +
                item.quantity;

            itemBox.appendChild(quantity);

            box.appendChild(itemBox);
        });

        const statusLabel =
            document.createElement("label");

        statusLabel.textContent =
            "تغيير حالة الطلب:";

        box.appendChild(statusLabel);

        const statusSelect =
            document.createElement("select");

        const statuses = [
            ["pending", "قيد الانتظار"],
            ["confirmed", "تم التأكيد"],
            ["shipped", "تم الشحن"],
            ["delivered", "تم التسليم"],
            ["cancelled", "ملغى"]
        ];

        statuses.forEach(function (statusItem) {
            const option =
                document.createElement("option");

            option.value =
                statusItem[0];

            option.textContent =
                statusItem[1];

            if (
                statusItem[0] ===
                order.status
            ) {
                option.selected = true;
            }

            statusSelect.appendChild(option);
        });

        box.appendChild(statusSelect);

        const updateButton =
            document.createElement("button");

        updateButton.textContent =
            "حفظ حالة الطلب";

        updateButton.addEventListener(
            "click",
            async function () {

                const newStatus =
                    statusSelect.value;

                const { error } =
                    await supabase
                        .from("orders")
                        .update({
                            status: newStatus
                        })
                        .eq(
                            "id",
                            order.id
                        );

                if (error) {
                    console.error(error);

                    alert(
                        "تعذر تحديث حالة الطلب."
                    );

                    return;
                }

                alert(
                    "تم تحديث حالة الطلب 📦"
                );

                await loadSellerOrders();
            }
        );

        box.appendChild(updateButton);

        ordersContainer.appendChild(box);
    });
}

async function start() {
    currentUser =
        await getUser();

    if (!currentUser) return;

    await loadSellerOrders();
}

start();
