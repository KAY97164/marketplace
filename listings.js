const listingDetails = document.getElementById("listingDetails");

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

let currentUser = null;
let currentListing = null;

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

function createElement(tag, text, className) {
    const element = document.createElement(tag);

    if (text !== undefined && text !== null) {
        element.textContent = text;
    }

    if (className) {
        element.className = className;
    }

    return element;
}

async function getCurrentUser() {
    const { data, error } =
        await supabase.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return data.user || null;
}

async function loadListing() {
    if (!listingId) {
        listingDetails.textContent =
            "الإعلان غير موجود.";
        return;
    }

    const {
        data: listing,
        error
    } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

    if (error || !listing) {
        console.error(error);

        listingDetails.textContent =
            "تعذر تحميل الإعلان.";

        return;
    }

    currentListing = listing;

    listingDetails.innerHTML = "";

    const title =
        createElement("h2", listing.title);

    listingDetails.appendChild(title);

    if (
        listing.image_urls &&
        listing.image_urls.length > 0
    ) {
        const gallery =
            document.createElement("div");

        gallery.className =
            "listing-gallery";

        listing.image_urls.forEach(
            function (url) {

                const image =
                    document.createElement("img");

                image.src = url;
                image.alt = listing.title;
                image.loading = "lazy";

                gallery.appendChild(image);
            }
        );

        listingDetails.appendChild(
            gallery
        );
    }

    const price =
        createElement(
            "p",
            "السعر: " +
            formatPrice(
                listing.price,
                listing.currency
            )
        );

    listingDetails.appendChild(price);

    const country =
        createElement(
            "p",
            "الدولة: " +
            (
                listing.country ||
                "غير محددة"
            )
        );

    listingDetails.appendChild(country);

    const city =
        createElement(
            "p",
            "المدينة: " +
            (
                listing.city ||
                "غير محددة"
            )
        );

    listingDetails.appendChild(city);

    const type =
        createElement(
            "p",
            "النوع: " +
            (
                listing.type === "product"
                    ? "منتج"
                    : "خدمة"
            )
        );

    listingDetails.appendChild(type);

    const description =
        createElement(
            "p",
            listing.description ||
            "لا يوجد وصف."
        );

    listingDetails.appendChild(
        description
    );

    const actions =
        document.createElement("div");

    const favoriteButton =
        document.createElement("button");

    favoriteButton.textContent =
        "❤️ إضافة إلى المفضلة";

    favoriteButton.addEventListener(
        "click",
        toggleFavorite
    );

    actions.appendChild(
        favoriteButton
    );

    if (listing.type === "product") {
        const cartButton =
            document.createElement("button");

        cartButton.textContent =
            "🛒 إضافة إلى السلة";

        cartButton.addEventListener(
            "click",
            addToCart
        );

        actions.appendChild(
            cartButton
        );
    }

    const contactButton =
        document.createElement("button");

    contactButton.textContent =
        "💬 التواصل مع البائع";

    contactButton.addEventListener(
        "click",
        contactSeller
    );

    actions.appendChild(
        contactButton
    );

    const sellerButton =
        document.createElement("button");

    sellerButton.textContent =
        "👤 مشاهدة ملف البائع";

    sellerButton.addEventListener(
        "click",
        function () {
            window.location.href =
                "public-profile.html?id=" +
                currentListing.user_id;
        }
    );

    actions.appendChild(
        sellerButton
    );

    const reportButton =
        document.createElement("button");

    reportButton.textContent =
        "🚩 الإبلاغ عن الإعلان";

    reportButton.addEventListener(
        "click",
        reportListing
    );

    actions.appendChild(
        reportButton
    );

    listingDetails.appendChild(
        actions
    );

    await loadReviews();
}

async function toggleFavorite() {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولًا.");
        window.location.href =
            "auth.html";
        return;
    }

    const {
        data: existing
    } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq(
            "listing_id",
            currentListing.id
        )
        .maybeSingle();

    if (existing) {

        const { error } =
            await supabase
                .from("favorites")
                .delete()
                .eq("id", existing.id)
                .eq(
                    "user_id",
                    currentUser.id
                );

        if (error) {
            alert(
                "تعذر إزالة الإعلان من المفضلة."
            );
            return;
        }

        alert(
            "تمت إزالة الإعلان من المفضلة."
        );

    } else {

        const { error } =
            await supabase
                .from("favorites")
                .insert({
                    user_id: currentUser.id,
                    listing_id: currentListing.id
                });

        if (error) {
            alert(
                "تعذر إضافة الإعلان إلى المفضلة."
            );
            return;
        }

        alert(
            "تمت إضافة الإعلان إلى المفضلة ❤️"
        );
    }
}

async function addToCart() {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولًا.");
        window.location.href =
            "auth.html";
        return;
    }

    if (
        currentListing.user_id ===
        currentUser.id
    ) {
        alert(
            "لا يمكنك إضافة إعلانك الخاص إلى السلة."
        );
        return;
    }

    if (
        currentListing.type !==
        "product"
    ) {
        alert(
            "الخدمات لا يمكن إضافتها إلى السلة."
        );
        return;
    }

    const {
        data: existing
    } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", currentUser.id)
        .eq(
            "listing_id",
            currentListing.id
        )
        .maybeSingle();

    if (existing) {

        const { error } =
            await supabase
                .from("cart_items")
                .update({
                    quantity:
                        existing.quantity + 1
                })
                .eq("id", existing.id)
                .eq(
                    "user_id",
                    currentUser.id
                );

        if (error) {
            alert(
                "تعذر تحديث السلة."
            );
            return;
        }

    } else {

        const { error } =
            await supabase
                .from("cart_items")
                .insert({
                    user_id:
                        currentUser.id,
                    listing_id:
                        currentListing.id,
                    quantity: 1
                });

        if (error) {
            alert(
                "تعذر إضافة المنتج إلى السلة."
            );
            return;
        }
    }

    alert(
        "تمت إضافة المنتج إلى السلة 🛒"
    );
}

async function contactSeller() {
    if (!currentUser) {
        alert("يجب تسجيل الدخول أولًا.");
        window.location.href =
            "auth.html";
        return;
    }

    if (
        currentListing.user_id ===
        currentUser.id
    ) {
        alert("هذا إعلانك.");
        return;
    }

    const {
        data: existing
    } = await supabase
        .from("conversations")
        .select("id")
        .eq(
            "buyer_id",
            currentUser.id
        )
        .eq(
            "seller_id",
            currentListing.user_id
        )
        .eq(
            "listing_id",
            currentListing.id
        )
        .maybeSingle();

    if (existing) {
        window.location.href =
            "messages.html?conversation=" +
            existing.id;
        return;
    }

    const {
        data: conversation,
        error
    } = await supabase
        .from("conversations")
        .insert({
            buyer_id:
                currentUser.id,
            seller_id:
                currentListing.user_id,
            listing_id:
                currentListing.id
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        alert(
            "تعذر إنشاء المحادثة."
        );
        return;
    }

    window.location.href =
        "messages.html?conversation=" +
        conversation.id;
}

async function reportListing() {
    if (!currentUser) {
        alert(
            "يجب تسجيل الدخول أولًا للإبلاغ عن إعلان."
        );

        window.location.href =
            "auth.html";

        return;
    }

    if (
        currentListing.user_id ===
        currentUser.id
    ) {
        alert(
            "لا يمكنك الإبلاغ عن إعلانك الخاص."
        );
        return;
    }

    const reason =
        prompt(
            "سبب البلاغ:\n\n" +
            "1 - إعلان مزيف أو احتيالي\n" +
            "2 - محتوى ممنوع\n" +
            "3 - معلومات مضللة\n" +
            "4 - إعلان مكرر\n" +
            "5 - سبب آخر\n\n" +
            "اكتبي رقم السبب:"
        );

    if (!reason) return;

    const reasons = {
        "1": "إعلان مزيف أو احتيالي",
        "2": "محتوى ممنوع",
        "3": "معلومات مضللة",
        "4": "إعلان مكرر",
        "5": "سبب آخر"
    };

    const selected =
        reason.trim();

    if (!reasons[selected]) {
        alert(
            "اختاري رقمًا من 1 إلى 5."
        );
        return;
    }

    let details = "";

    if (selected === "5") {
        details =
            prompt(
                "اكتبي سبب البلاغ:"
            ) || "";
    }

    const { error } =
        await supabase
            .from("reports")
            .insert({
                user_id:
                    currentUser.id,
                listing_id:
                    currentListing.id,
                reason:
                    reasons[selected],
                details:
                    details.trim()
            });

    if (error) {

        if (error.code === "23505") {
            alert(
                "لقد أبلغتِ عن هذا الإعلان من قبل."
            );
        } else {
            console.error(error);
            alert(
                "تعذر إرسال البلاغ."
            );
        }

        return;
    }

    alert(
        "تم إرسال البلاغ بنجاح 🚩"
    );
}

async function loadReviews() {
    const section =
        document.createElement("section");

    section.appendChild(
        createElement(
            "h3",
            "التقييمات والتعليقات ⭐"
        )
    );

    const {
        data: reviews,
        error
    } = await supabase
        .from("reviews")
        .select("*")
        .eq(
            "listing_id",
            currentListing.id
        )
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        console.error(error);

        section.appendChild(
            createElement(
                "p",
                "تعذر تحميل التقييمات."
            )
        );

        listingDetails.appendChild(
            section
        );

        return;
    }

    if (
        !reviews ||
        reviews.length === 0
    ) {
        section.appendChild(
            createElement(
                "p",
                "لا توجد تقييمات حتى الآن."
            )
        );
    } else {

        const average =
            reviews.reduce(
                function (sum, review) {
                    return (
                        sum +
                        review.rating
                    );
                },
                0
            ) / reviews.length;

        section.appendChild(
            createElement(
                "p",
                "متوسط التقييم: " +
                average.toFixed(1) +
                " ⭐ (" +
                reviews.length +
                " تقييم)"
            )
        );

        reviews.forEach(
            function (review) {

                const box =
                    document.createElement(
                        "div"
                    );

                box.appendChild(
                    createElement(
                        "strong",
                        "⭐".repeat(
                            review.rating
                        )
                    )
                );

                box.appendChild(
                    createElement(
                        "p",
                        review.comment || ""
                    )
                );

                if (
                    currentUser &&
                    review.user_id ===
                    currentUser.id
                ) {

                    const deleteButton =
                        document.createElement(
                            "button"
                        );

                    deleteButton.textContent =
                        "حذف تقييمي";

                    deleteButton.addEventListener(
                        "click",
                        async function () {

                            const {
                                error
                            } =
                                await supabase
                                    .from(
                                        "reviews"
                                    )
                                    .delete()
                                    .eq(
                                        "id",
                                        review.id
                                    )
                                    .eq(
                                        "user_id",
                                        currentUser.id
                                    );

                            if (error) {
                                alert(
                                    "تعذر حذف التقييم."
                                );
                                return;
                            }

                            await loadListing();
                        }
                    );

                    box.appendChild(
                        deleteButton
                    );
                }

                section.appendChild(
                    box
                );
            }
        );
    }

    if (
        currentUser &&
        currentListing.user_id !==
        currentUser.id
    ) {

        const reviewForm =
            document.createElement(
                "form"
            );

        const rating =
            document.createElement(
                "select"
            );

        rating.required = true;

        for (let i = 1; i <= 5; i++) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = i;
            option.textContent =
                i + " ⭐";

            rating.appendChild(
                option
            );
        }

        const comment =
            document.createElement(
                "textarea"
            );

        comment.placeholder =
            "اكتبي تعليقك...";

        comment.maxLength = 1000;

        const submit =
            document.createElement(
                "button"
            );

        submit.type = "submit";
        submit.textContent =
            "إضافة تقييم";

        reviewForm.appendChild(
            rating
        );

        reviewForm.appendChild(
            comment
        );

        reviewForm.appendChild(
            submit
        );

        reviewForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const { error } =
                    await supabase
                        .from("reviews")
                        .insert({
                            user_id:
                                currentUser.id,
                            listing_id:
                                currentListing.id,
                            rating:
                                Number(
                                    rating.value
                                ),
                            comment:
                                comment.value.trim()
                        });

                if (error) {

                    if (
                        error.code ===
                        "23505"
                    ) {
                        alert(
                            "لقد قيّمتِ هذا الإعلان من قبل."
                        );
                    } else {
                        console.error(error);
                        alert(
                            "تعذر إضافة التقييم."
                        );
                    }

                    return;
                }

                alert(
                    "تمت إضافة تقييمك ⭐"
                );

                await loadListing();
            }
        );

        section.appendChild(
            reviewForm
        );
    }

    listingDetails.appendChild(
        section
    );
}

async function start() {
    currentUser =
        await getCurrentUser();

    await loadListing();
}

start();
