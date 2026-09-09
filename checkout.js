const checkoutList =
    document.getElementById("checkoutList");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const checkoutForm =
    document.getElementById("checkoutForm");

const shippingAddress =
    document.getElementById("shippingAddress");

const paymentMethod =
    document.getElementById("paymentMethod");

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

        checkoutForm.style.display =
            "none";

        return;
    }


    cartItems =
        (items || []).filter(function (item) {

            return (
                item.listings &&
                item.listings.type === "product" &&
                item.listings.user_id !== currentUser.id
            );

        });


    checkoutList.innerHTML = "";


    if (cartItems.length === 0) {

        checkoutList.innerHTML =
            "<p>لا توجد منتجات قابلة للطلب.</p>";

        checkoutTotal.textContent =
            "0";

        checkoutForm.style.display =
            "none";

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

        total +=
            itemTotal;


        const details =
            document.createElement("p");

        details.textContent =
            "السعر: " +
            price +
            " درهم × " +
            quantity +
            " = " +
            itemTotal.toFixed(2) +
            " درهم";

        card.appendChild(details);


        checkoutList.appendChild(card);

    });


    checkoutTotal.textContent =
        total.toFixed(2);

}


checkoutForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const address =
            shippingAddress.value.trim();

        const method =
            paymentMethod.value;


        if (!address) {

            checkoutMessage.textContent =
                "اكتبي عنوان التوصيل.";

            return;
        }


        if (!method) {

            checkoutMessage.textContent =
                "اختاري طريقة الدفع.";

            return;
        }


        if (
            !cartItems ||
            cartItems.length === 0
        ) {

            checkoutMessage.textContent =
                "السلة فارغة.";

            return;
        }


        const confirmed =
            confirm(
                "هل تريدين تأكيد الطلب؟"
            );


        if (!confirmed) {
            return;
        }


        const submitButton =
            checkoutForm.querySelector(
                "button[type='submit']"
            );


        submitButton.disabled =
            true;

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
                        "pending",

                    payment_status:
                        "unpaid",

                    payment_method:
                        method,

                    shipping_address:
                        address

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
                            Number(item.quantity),

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

            submitButton.disabled =
                false;

        }

    }
);


loadCheckout();
