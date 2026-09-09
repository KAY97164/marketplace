const cartList =
    document.getElementById("cartList");

const cartTotal =
    document.getElementById("cartTotal");

const checkoutButton =
    document.getElementById("checkoutButton");

const cartMessage =
    document.getElementById("cartMessage");

let currentUser = null;


async function loadCart() {

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

    currentUser = user;


    const {
        data: items,
        error
    } = await supabase
        .from("cart_items")
        .select(`
            id,
            listing_id,
            quantity,
            listings (
                id,
                title,
                price,
                city,
                image_urls
            )
        `)
        .eq(
            "user_id",
            user.id
        );


    if (error) {

        console.error(error);

        cartList.innerHTML =
            "<p>تعذر تحميل السلة.</p>";

        return;
    }


    cartList.innerHTML = "";

    let total = 0;


    if (
        !items ||
        items.length === 0
    ) {

        cartList.innerHTML =
            "<p>السلة فارغة 🛒</p>";

        cartTotal.textContent = "0";

        checkoutButton.disabled = true;

        return;
    }


    checkoutButton.disabled = false;


    items.forEach(function (item) {

        if (!item.listings) {
            return;
        }


        const listing =
            item.listings;


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
            listing.price +
            " درهم";

        card.appendChild(price);


        const city =
            document.createElement("p");

        city.textContent =
            "المدينة: " +
            listing.city;

        card.appendChild(city);


        const quantity =
            document.createElement("p");

        quantity.textContent =
            "الكمية: " +
            item.quantity;

        card.appendChild(quantity);


        const itemTotal =
            Number(listing.price) *
            Number(item.quantity);


        total += itemTotal;


        const totalElement =
            document.createElement("p");

        totalElement.textContent =
            "المجموع: " +
            itemTotal +
            " درهم";

        card.appendChild(totalElement);


        const removeButton =
            document.createElement("button");

        removeButton.textContent =
            "إزالة من السلة";


        removeButton.addEventListener(
            "click",
            async function () {

                const {
                    error
                } = await supabase
                    .from("cart_items")
                    .delete()
                    .eq(
                        "id",
                        item.id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );


                if (error) {

                    alert(
                        "تعذر إزالة المنتج."
                    );

                    return;
                }


                loadCart();
            }
        );


        card.appendChild(
            removeButton
        );


        cartList.appendChild(card);

    });


    cartTotal.textContent =
        total.toFixed(2);
}


checkoutButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "checkout.html";

    }
);


loadCart();
