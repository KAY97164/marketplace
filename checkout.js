const checkoutItems =
    document.getElementById("checkoutItems");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const checkoutForm =
    document.getElementById("checkoutForm");

const paymentMethod =
    document.getElementById("paymentMethod");

const shippingAddress =
    document.getElementById("shippingAddress");

let currentUser = null;
let cartItems = [];

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
    const { data, error } =
        await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = "auth.html";
        return null;
    }

    return data.user;
}

async function loadCart() {
    const { data, error } =
        await supabase
            .from("cart_items")
            .select(`
                id,
                quantity,
                listing_id,
                listings (
                    id,
                    title,
                    price,
                    currency,
                    country,
                    city,
                    type,
                    image_urls,
                    user_id
                )
            `)
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(error);
        checkoutItems.textContent =
            "تعذر تحميل السلة.";
        return;
    }

    cartItems = (data || []).filter(function (item) {
        return (
            item.listings &&
            item.listings.type === "product" &&
            item.listings.user_id !== currentUser.id
        );
    });

    renderCheckout();
}

function renderCheckout() {
    checkoutItems.innerHTML = "";

    if (cartItems.length === 0) {
        checkoutItems.textContent =
            "لا توجد منتجات قابلة للشراء.";

        checkoutTotal.textContent =
            "المجموع: 0";

        return;
    }

    const currencies = {};

    cartItems.forEach(function (item) {
        const listing = item.listings;

        const currency =
            listing.currency || "USD";

        if (!currencies[currency]) {
            currencies[currency] = 0;
        }

        currencies[currency] +=
            Number(listing.price) *
            Number(item.quantity);

        const box =
            document.createElement("article");

        box.className =
            "listing-card";

        if (
            listing.image_urls &&
            listing.image_urls.length > 0
        ) {
            const image =
                document.createElement("img");

            image.src =
                listing.image_urls[0];

            image.alt =
                listing.title || "";

            image.width = 120;
            image.loading = "lazy";

            box.appendChild(image);
        }

        const title =
            document.createElement("h3");

        title.textContent =
            listing.title;

        box.appendChild(title);

        const price =
            document.createElement("p");

        price.textContent =
            "السعر: " +
            formatPrice(
                listing.price,
                currency
            );

        box.appendChild(price);

        const quantity =
            document.createElement("p");

        quantity.textContent =
            "الكمية: " +
            item.quantity;

        box.appendChild(quantity);

        const location =
            document.createElement("p");

        location.textContent =
            "الموقع: " +
            (listing.city || "غير محددة") +
            "، " +
            (listing.country || "غير محددة");

        box.appendChild(location);

        checkoutItems.appendChild(box);
    });

    const totalParts =
        Object.keys(currencies).map(
            function (currency) {
                return formatPrice(
                    currencies[currency],
                    currency
                );
            }
        );

    checkoutTotal.textContent =
        "المجموع: " +
        totalParts.join(" + ");
}

async function createOrder() {
    if (cartItems.length === 0) {
        alert("السلة فارغة.");
        return null;
    }

    const currencies =
        [
            ...new Set(
                cartItems.map(function (item) {
                    return (
                        item.listings.currency ||
                        "USD"
                    );
                })
            )
        ];

    if (currencies.length > 1) {
        alert(
            "السلة تحتوي على عملات مختلفة. يرجى شراء كل عملة في طلب منفصل."
        );
        return null;
    }

    const currency =
        currencies[0];

    let total = 0;

    cartItems.forEach(function (item) {
        total +=
            Number(item.listings.price) *
            Number(item.quantity);
    });

    const method =
        paymentMethod.value;

    if (!method) {
        alert("يرجى اختيار طريقة الدفع.");
        return null;
    }

    const address =
        shippingAddress.value.trim();

    if (!address) {
        alert("يرجى إدخال عنوان الشحن.");
        return null;
    }

    const { data: order, error: orderError } =
        await supabase
            .from("orders")
            .insert({
                buyer_id: currentUser.id,
                total,
                currency,
                status: "pending",
                payment_status: "unpaid",
                payment_method: method,
                shipping_address: address
            })
            .select()
            .single();

    if (orderError) {
        console.error(orderError);
        alert(
            "تعذر إنشاء الطلب:\n\n" +
            orderError.message
        );
        return null;
    }

    const orderItems =
        cartItems.map(function (item) {
            return {
                order_id: order.id,
                listing_id:
                    item.listing_id,
                seller_id:
                    item.listings.user_id,
                quantity:
                    item.quantity,
                price:
                    Number(item.listings.price)
            };
        });

    const { error: itemsError } =
        await supabase
            .from("order_items")
            .insert(orderItems);

    if (itemsError) {
        console.error(itemsError);

        await supabase
            .from("orders")
            .delete()
            .eq("id", order.id)
            .eq("buyer_id", currentUser.id);

        alert(
            "تعذر إنشاء عناصر الطلب:\n\n" +
            itemsError.message
        );

        return null;
    }

    return order;
}

checkoutForm.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        const button =
            document.getElementById(
                "placeOrderButton"
            );

        button.disabled = true;
        button.textContent =
            "جاري تجهيز الطلب...";

        try {
            const order =
                await createOrder();

            if (!order) return;

            if (
                paymentMethod.value ===
                "card"
            ) {
                button.textContent =
                    "جاري فتح الدفع...";

                const {
                    data,
                    error
                } =
                    await supabase.functions.invoke(
                        "create-checkout",
                        {
                            body: {
                                order_id:
                                    order.id
                            }
                        }
                    );

                if (error) {
                    throw error;
                }

                if (!data || !data.url) {
                    throw new Error(
                        "لم يتم إنشاء رابط الدفع."
                    );
                }

                window.location.href =
                    data.url;

                return;
            }

            await supabase
                .from("cart_items")
                .delete()
                .eq(
                    "user_id",
                    currentUser.id
                );

            alert(
                "تم إنشاء طلبك بنجاح! 📦"
            );

            window.location.href =
                "orders.html";

        } catch (error) {
            console.error(error);

            alert(
                "حدث خطأ:\n\n" +
                error.message
            );

            button.disabled = false;
            button.textContent =
                "تأكيد الطلب";
        }
    }
);

async function start() {
    currentUser =
        await getUser();

    if (!currentUser) return;

    await loadCart();
}

start();
