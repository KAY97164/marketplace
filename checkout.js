const checkoutList =
    document.getElementById("checkoutList");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const confirmOrderButton =
    document.getElementById("confirmOrderButton");

const checkoutMessage =
    document.getElementById("checkoutMessage");

let currentUser = null;
let cartItems = [];


async function loadCheckout() {

    const {
        data: {
            user
        },
        error: userError
    } = await supabase.auth.getUser();


    if (userError || !user) {
        window.location.href = "auth.html";
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

        checkoutList.innerHTML =
            "<p>تعذر تحميل الطلب.</p>";

        confirmOrderButton.disabled = true;

        return;
    }


    cartItems = (items || []).filter(function (item) {

        return (
            item.listings &&
            item.listings.type === "product"
        );

    });


    checkoutList.innerHTML = "";


    if (cartItems.length === 0) {

        checkoutList.innerHTML =
            "<p>لا توجد منتجات قابلة للطلب في السلة.</p>";

        checkoutTotal.textContent = "0";

        confirmOrderButton.disabled = true;

        return;
    }


    let total = 0;


    cartItems.forEach(function (item) {

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
            Number(listing.price);


        const quantity =
            Number(item.quantity);


        const itemTotal =
            price * quantity;


        total += itemTotal;


        const priceElement =
            document.createElement("p");

        priceElement.textContent =
            "السعر: " +
            price +
            " درهم";

        card.appendChild(priceElement);


        const quantityElement =
            document.createElement("p");

        quantityElement.textContent =
            "الكمية: " +
            quantity;

        card.appendChild(quantityElement);


        const totalElement =
            document.createElement("p");

        totalElement.textContent =
            "المجموع: " +
            itemTotal.toFixed(2) +
            " درهم";

        card.appendChild(totalElement);


        checkoutList.appendChild(card);

    });


    checkoutTotal.textContent =
        total.toFixed(2);

}


confirmOrderButton.addEventListener(
    "click",
    async function () {

        if (!currentUser) {
            return;
        }


        if (cartItems.length === 0) {
            return;
        }


        const confirmed =
            confirm(
                "هل تريدين تأكيد هذا الطلب؟"
            );


        if (!confirmed) {
            return;
        }


        confirmOrderButton.disabled = true;

        checkoutMessage.textContent =
            "جاري إنشاء الطلب...";


        try {

            let total = 0;


            cartItems.forEach(function (item) {

                total +=
                    Number(item.listings.price) *
                    Number(item.quantity);

            });


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

                    status:
                        "pending"

                })
                .select()
                .single();


            if (orderError) {
                throw orderError;
            }


            const orderItems =
                cartItems.map(function (item) {

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
                            Number(item.listings.price)

                    };

                });


            const {
                error: itemsError
            } = await supabase
                .from("order_items")
                .insert(orderItems);


            if (itemsError) {
                throw itemsError;
            }


            const {
                error: cartError
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


            checkoutMessage.textContent =
                "تم إنشاء طلبك بنجاح! 🎉";


            setTimeout(function () {

                window.location.href =
                    "orders.html";

            }, 1000);


        } catch (error) {

            console.error(error);

            checkoutMessage.textContent =
                "حدث خطأ أثناء إنشاء الطلب: " +
                error.message;

            confirmOrderButton.disabled =
                false;

        }

    }
);


loadCheckout();
