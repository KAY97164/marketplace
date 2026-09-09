const checkoutForm =
    document.getElementById("checkoutForm");

const checkoutItems =
    document.getElementById("checkoutItems");

const checkoutTotal =
    document.getElementById("checkoutTotal");

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

async function loadCart() {
    const {
        data,
        error
    } = await supabase
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
                user_id,
                image_urls
            )
        `)
        .eq(
            "user_id",
            currentUser.id
        );

    if (error) {
        console.error(error);

        checkoutItems.textContent =
            "تعذر تحميل السلة.";

        return false;
    }

    cartItems = (data || []).filter(
        function (item) {
            return (
                item.listings &&
                item.listings.type === "product" &&
                item.listings.user_id !==
                    currentUser.id
            );
        }
    );

    if (cartItems.length === 0) {
        checkoutItems.textContent =
            "لا توجد منتجات قابلة للشراء.";

        checkoutTotal.textContent =
            "المجموع: 0";

        return false;
    }

    renderCart();

    return true;
}

function renderCart() {
    checkoutItems.innerHTML = "";

    const totals = {};

    cartItems.forEach(
        function (item) {

            const listing =
                item.listings;

            const box =
                document.createElement("div");

            const title =
                document.createElement("h3");

            title.textContent =
                listing.title;

            box.appendChild(title);

            const price =
                document.createElement("p");

            price.textContent =
                formatPrice(
                    listing.price,
                    listing.currency
                ) +
                " × " +
                item.quantity;

            box.appendChild(price);

            checkoutItems.appendChild(
                box
            );

            const currency =
                listing.currency ||
                "USD";

            if (!totals[currency]) {
                totals[currency] = 0;
            }

            totals[currency] +=
                Number(listing.price) *
                Number(item.quantity);
        }
    );

    const parts =
        Object.keys(totals).map(
            function (currency) {
                return formatPrice(
                    totals[currency],
                    currency
                );
            }
        );

    checkoutTotal.textContent =
        "المجموع: " +
        parts.join(" + ");
}

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (!currentUser) {
                alert(
                    "يجب تسجيل الدخول أولًا."
                );
                return;
            }

            if (cartItems.length === 0) {
                alert(
                    "السلة فارغة."
                );
                return;
            }

            const shippingAddress =
                document
                    .getElementById(
                        "shippingAddress"
                    )
                    .value
                    .trim();

            const paymentMethod =
                document
                    .getElementById(
                        "paymentMethod"
                    )
                    .value;

            if (!shippingAddress) {
                alert(
                    "يرجى إدخال عنوان الشحن."
                );
                return;
            }

            if (!paymentMethod) {
                alert(
                    "يرجى اختيار طريقة الدفع."
                );
                return;
            }

            const currencies =
                [
                    ...new Set(
                        cartItems.map(
                            function (item) {
                                return (
                                    item.listings
                                        .currency ||
                                    "USD"
                                );
                            }
                        )
                    )
                ];

            if (currencies.length > 1) {
                alert(
                    "لا يمكن إنشاء طلب واحد يحتوي على منتجات بعملات مختلفة. " +
                    "يرجى شراء المنتجات ذات العملات المختلفة في طلبات منفصلة."
                );
                return;
            }

            const currency =
                currencies[0];

            const total =
                cartItems.reduce(
                    function (sum, item) {
                        return (
                            sum +
                            Number(
                                item.listings.price
                            ) *
                            Number(
                                item.quantity
                            )
                        );
                    },
                    0
                );

            try {

                const {
                    data: order,
                    error: orderError
                } = await supabase
                    .from("orders")
                    .insert({
                        buyer_id:
                            currentUser.id,
                        total:
                            total,
                        currency:
                            currency,
                        status:
                            "pending",
                        payment_status:
                            "unpaid",
                        payment_method:
                            paymentMethod,
                        shipping_address:
                            shippingAddress
                    })
                    .select()
                    .single();

                if (orderError) {
                    throw orderError;
                }

                const orderItems =
                    cartItems.map(
                        function (item) {
                            return {
                                order_id:
                                    order.id,
                                listing_id:
                                    item.listing_id,
                                seller_id:
                                    item.listings.user_id,
                                quantity:
                                    item.quantity,
                                price:
                                    item.listings.price
                            };
                        }
                    );

                const {
                    error:
                        itemsError
                } = await supabase
                    .from("order_items")
                    .insert(
                        orderItems
                    );

                if (itemsError) {
                    throw itemsError;
                }

                const {
                    error:
                        cartError
                } = await supabase
                    .from("cart_items")
                    .delete()
                    .eq(
                        "user_id",
                        currentUser.id
                    );

                if (cartError) {
                    throw cartError;
                }

                alert(
                    "تم إنشاء الطلب بنجاح! 📦"
                );

                window.location.href =
                    "orders.html";

            } catch (error) {

                console.error(error);

                alert(
                    "حدث خطأ أثناء إنشاء الطلب:\n\n" +
                    error.message
                );
            }
        }
    );
}

async function start() {

    currentUser =
        await getUser();

    if (!currentUser) return;

    await loadCart();
}

start();
