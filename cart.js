const cartList =
    document.getElementById("cartList");

const cartTotal =
    document.getElementById("cartTotal");

const checkoutButton =
    document.getElementById("checkoutButton");

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
                type,
                image_urls,
                user_id
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


    if (!items || items.length === 0) {

        cartList.innerHTML =
            "<p>السلة فارغة 🛒</p>";

        cartTotal.textContent =
            "0";

        checkoutButton.disabled =
            true;

        return;
    }


    checkoutButton.disabled =
        false;


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
            Number(listing.price).toFixed(2) +
            " درهم";

        card.appendChild(price);


        const quantityContainer =
            document.createElement("div");


        const quantityLabel =
            document.createElement("span");

        quantityLabel.textContent =
            "الكمية: ";

        quantityContainer.appendChild(
            quantityLabel
        );


        const decreaseButton =
            document.createElement("button");

        decreaseButton.textContent =
            "−";


        const quantityValue =
            document.createElement("span");

        quantityValue.textContent =
            item.quantity;

        quantityValue.style.margin =
            "0 15px";


        const increaseButton =
            document.createElement("button");

        increaseButton.textContent =
            "+";


        quantityContainer.appendChild(
            decreaseButton
        );

        quantityContainer.appendChild(
            quantityValue
        );

        quantityContainer.appendChild(
            increaseButton
        );


        card.appendChild(
            quantityContainer
        );


        const itemTotal =
            Number(listing.price) *
            Number(item.quantity);

        total +=
            itemTotal;


        const totalElement =
            document.createElement("p");

        totalElement.textContent =
            "المجموع: " +
            itemTotal.toFixed(2) +
            " درهم";

        card.appendChild(
            totalElement
        );


        decreaseButton.addEventListener(
            "click",
            async function () {

                if (item.quantity <= 1) {

                    await removeItem(
                        item.id
                    );

                    return;
                }


                await updateQuantity(
                    item.id,
                    item.quantity - 1
                );

            }
        );


        increaseButton.addEventListener(
            "click",
            async function () {

                await updateQuantity(
                    item.id,
                    item.quantity + 1
                );

            }
        );


        const removeButton =
            document.createElement("button");

        removeButton.textContent =
            "إزالة من السلة";


        removeButton.addEventListener(
            "click",
            async function () {

                await removeItem(
                    item.id
                );

            }
        );


        card.appendChild(
            removeButton
        );


        cartList.appendChild(
            card
        );

    });


    cartTotal.textContent =
        total.toFixed(2);

}


async function updateQuantity(
    itemId,
    quantity
) {

    const {
        error
    } = await supabase
        .from("cart_items")
        .update({
            quantity: quantity
        })
        .eq(
            "id",
            itemId
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(error);

        alert(
            "تعذر تحديث الكمية."
        );

        return;
    }


    await loadCart();

}


async function removeItem(
    itemId
) {

    const {
        error
    } = await supabase
        .from("cart_items")
        .delete()
        .eq(
            "id",
            itemId
        )
        .eq(
            "user_id",
            currentUser.id
        );


    if (error) {

        console.error(error);

        alert(
            "تعذر إزالة المنتج."
        );

        return;
    }


    await loadCart();

}


checkoutButton.addEventListener(
    "click",
    function () {

        window.location.href =
            "checkout.html";

    }
);


loadCart();
