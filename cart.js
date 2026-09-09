const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");

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
        window.location.href = "auth.html";
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

        cartList.textContent =
            "تعذر تحميل السلة.";

        return;
    }

    cartItems = data || [];

    renderCart();
}

function renderCart() {
    cartList.innerHTML = "";

    if (cartItems.length === 0) {
        cartList.textContent =
            "السلة فارغة 🛒";

        cartTotal.textContent =
            "المجموع: 0";

        checkoutButton.disabled = true;

        return;
    }

    checkoutButton.disabled = false;

    const totals = {};

    cartItems.forEach(function (item) {

        const listing = item.listings;

        if (!listing) return;

        const card =
            document.createElement("article");

        card.className =
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
                listing.title;

            image.loading =
                "lazy";

            card.appendChild(image);
        }

        const title =
            document.createElement("h3");

        title.textContent =
            listing.title;

        card.appendChild(title);

        const price =
            document.createElement("p");

        price.textContent =
            "السعر: " +
            formatPrice(
                listing.price,
                listing.currency
            );

        card.appendChild(price);

        const location =
            document.createElement("p");

        location.textContent =
            "الموقع: " +
            (listing.city || "غير محددة") +
            "، " +
            (listing.country || "غير محددة");

        card.appendChild(location);

        const quantity =
            document.createElement("p");

        quantity.textContent =
            "الكمية: " +
            item.quantity;

        card.appendChild(quantity);

        const controls =
            document.createElement("div");

        const minus =
            document.createElement("button");

        minus.textContent = "−";

        minus.addEventListener(
            "click",
            function () {
                updateQuantity(
                    item.id,
                    item.quantity - 1
                );
            }
        );

        const plus =
            document.createElement("button");

        plus.textContent = "+";

        plus.addEventListener(
            "click",
            function () {
                updateQuantity(
                    item.id,
                    item.quantity + 1
                );
            }
        );

        const remove =
            document.createElement("button");

        remove.textContent =
            "حذف";

        remove.addEventListener(
            "click",
            function () {
                removeItem(item.id);
            }
        );

        controls.appendChild(minus);
        controls.appendChild(plus);
        controls.appendChild(remove);

        card.appendChild(controls);

        cartList.appendChild(card);

        const currency =
            listing.currency || "USD";

        if (!totals[currency]) {
            totals[currency] = 0;
        }

        totals[currency] +=
            Number(listing.price) *
            Number(item.quantity);
    });

    const totalParts =
        Object.keys(totals).map(
            function (currency) {
                return formatPrice(
                    totals[currency],
                    currency
                );
            }
        );

    cartTotal.textContent =
        "المجموع: " +
        totalParts.join(" + ");
}

async function updateQuantity(
    itemId,
    quantity
) {
    if (quantity <= 0) {
        await removeItem(itemId);
        return;
    }

    const { error } =
        await supabase
            .from("cart_items")
            .update({
                quantity: quantity
            })
            .eq("id", itemId)
            .eq("user_id", currentUser.id);

    if (error) {
        console.error(error);

        alert(
            "تعذر تحديث الكمية."
        );

        return;
    }

    await loadCart();
}

async function removeItem(itemId) {
    const { error } =
        await supabase
            .from("cart_items")
            .delete()
            .eq("id", itemId)
            .eq("user_id", currentUser.id);

    if (error) {
        console.error(error);

        alert(
            "تعذر حذف المنتج."
        );

        return;
    }

    await loadCart();
}

if (checkoutButton) {
    checkoutButton.addEventListener(
        "click",
        function () {

            if (cartItems.length === 0) {
                alert(
                    "السلة فارغة."
                );
                return;
            }

            window.location.href =
                "checkout.html";
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
