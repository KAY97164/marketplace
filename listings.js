const listingDetails =
    document.getElementById("listingDetails");


async function loadListing() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const listingId =
        params.get("id");


    if (!listingId) {

        listingDetails.innerHTML =
            "<p>لم يتم تحديد الإعلان.</p>";

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

        listingDetails.innerHTML =
            "<p>تعذر تحميل الإعلان.</p>";

        return;
    }


    const {
        data: {
            user: currentUser
        }
    } = await supabase.auth.getUser();


    let isFavorite = false;


    if (currentUser) {

        const {
            data: favorite
        } = await supabase
            .from("favorites")
            .select("id")
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "listing_id",
                listing.id
            )
            .maybeSingle();


        isFavorite = !!favorite;
    }


    listingDetails.innerHTML = "";


    if (
        listing.image_urls &&
        listing.image_urls.length > 0
    ) {

        const imagesContainer =
            document.createElement("div");

        imagesContainer.className =
            "listing-images";


        listing.image_urls.forEach(
            function (url) {

                const image =
                    document.createElement("img");

                image.src = url;
                image.alt = listing.title;

                imagesContainer.appendChild(
                    image
                );
            }
        );


        listingDetails.appendChild(
            imagesContainer
        );
    }


    const title =
        document.createElement("h2");

    title.textContent =
        listing.title;

    listingDetails.appendChild(title);


    const price =
        document.createElement("p");

    price.textContent =
        "السعر: " +
        listing.price +
        " درهم";

    listingDetails.appendChild(price);


    const city =
        document.createElement("p");

    city.textContent =
        "المدينة: " +
        listing.city;

    listingDetails.appendChild(city);


    const type =
        document.createElement("p");

    type.textContent =
        "النوع: " +
        (
            listing.type === "product"
                ? "منتج"
                : "خدمة"
        );

    listingDetails.appendChild(type);


    const descriptionTitle =
        document.createElement("h3");

    descriptionTitle.textContent =
        "الوصف";

    listingDetails.appendChild(
        descriptionTitle
    );


    const description =
        document.createElement("p");

    description.textContent =
        listing.description || "";

    listingDetails.appendChild(
        description
    );


    const favoriteButton =
        document.createElement("button");

    favoriteButton.id =
        "favoriteButton";

    favoriteButton.textContent =
        isFavorite
            ? "❤️ إزالة من المفضلة"
            : "♡ إضافة إلى المفضلة";

    listingDetails.appendChild(
        favoriteButton
    );


    const cartButton =
        document.createElement("button");

    cartButton.id =
        "addToCartButton";

    cartButton.textContent =
        "🛒 أضف إلى السلة";

    listingDetails.appendChild(
        cartButton
    );


    const contactButton =
        document.createElement("button");

    contactButton.id =
        "contactSeller";

    contactButton.textContent =
        "تواصل مع البائع";

    listingDetails.appendChild(
        contactButton
    );


    const separator =
        document.createElement("hr");

    listingDetails.appendChild(
        separator
    );


    const reviewsSection =
        document.createElement("section");

    reviewsSection.id =
        "reviewsSection";


    reviewsSection.innerHTML = `
        <h2>⭐ التقييمات والتعليقات</h2>

        <div id="reviewsSummary">
            جاري تحميل التقييمات...
        </div>

        <div id="reviewsList">
            جاري تحميل التعليقات...
        </div>

        <div id="reviewFormContainer"></div>
    `;


    listingDetails.appendChild(
        reviewsSection
    );


    setupFavoriteButton(
        listing,
        currentUser,
        isFavorite
    );


    cartButton.addEventListener(
        "click",
        async function () {

            if (!currentUser) {

                alert(
                    "يجب تسجيل الدخول أولًا."
                );

                window.location.href =
                    "auth.html";

                return;
            }


            if (
                currentUser.id ===
                listing.user_id
            ) {

                alert(
                    "لا يمكنك إضافة إعلانك إلى سلتك."
                );

                return;
            }


            const {
                error
            } = await supabase
                .from("cart_items")
                .insert({
                    user_id:
                        currentUser.id,

                    listing_id:
                        listing.id,

                    quantity: 1
                });


            if (error) {

                if (
                    error.code === "23505"
                ) {

                    alert(
                        "هذا الإعلان موجود بالفعل في السلة."
                    );

                } else {

                    console.error(error);

                    alert(
                        "حدث خطأ أثناء إضافة الإعلان."
                    );
                }

                return;
            }


            alert(
                "تمت إضافة الإعلان إلى السلة 🛒"
            );
        }
    );


    contactButton.addEventListener(
        "click",
        async function () {

            if (!currentUser) {

                alert(
                    "يجب تسجيل الدخول أولًا للتواصل مع البائع."
                );

                window.location.href =
                    "auth.html";

                return;
            }


            if (
                currentUser.id ===
                listing.user_id
            ) {

                alert(
                    "لا يمكنك مراسلة نفسك."
                );

                return;
            }


            const {
                data: existingConversation,
                error: findError
            } = await supabase
                .from("conversations")
                .select("id")
                .eq(
                    "buyer_id",
                    currentUser.id
                )
                .eq(
                    "seller_id",
                    listing.user_id
                )
                .eq(
                    "listing_id",
                    listing.id
                )
                .maybeSingle();


            if (findError) {

                console.error(findError);

                alert(
                    "حدث خطأ أثناء فتح المحادثة."
                );

                return;
            }


            if (existingConversation) {

                window.location.href =
                    "messages.html?conversation=" +
                    existingConversation.id;

                return;
            }


            const {
                data: newConversation,
                error: createError
            } = await supabase
                .from("conversations")
                .insert({

                    buyer_id:
                        currentUser.id,

                    seller_id:
                        listing.user_id,

                    listing_id:
                        listing.id
                })
                .select("id")
                .single();


            if (createError) {

                console.error(createError);

                alert(
                    "حدث خطأ أثناء إنشاء المحادثة."
                );

                return;
            }


            window.location.href =
                "messages.html?conversation=" +
                newConversation.id;
        }
    );


    await loadReviews(
        listing.id,
        currentUser
    );
}


function setupFavoriteButton(
    listing,
    currentUser,
    isFavorite
) {

    const button =
        document.getElementById(
            "favoriteButton"
        );

    let favoriteState =
        isFavorite;


    button.addEventListener(
        "click",
        async function () {

            if (!currentUser) {

                alert(
                    "يجب تسجيل الدخول أولًا."
                );

                window.location.href =
                    "auth.html";

                return;
            }


            if (favoriteState) {

                const {
                    error
                } = await supabase
                    .from("favorites")
                    .delete()
                    .eq(
                        "user_id",
                        currentUser.id
                    )
                    .eq(
                        "listing_id",
                        listing.id
                    );


                if (error) {

                    console.error(error);

                    alert(
                        "حدث خطأ أثناء إزالة الإعلان."
                    );

                    return;
                }


                favoriteState = false;

                button.textContent =
                    "♡ إضافة إلى المفضلة";

            } else {

                const {
                    error
                } = await supabase
                    .from("favorites")
                    .insert({

                        user_id:
                            currentUser.id,

                        listing_id:
                            listing.id
                    });


                if (error) {

                    console.error(error);

                    alert(
                        "حدث خطأ أثناء إضافة الإعلان."
                    );

                    return;
                }


                favoriteState = true;

                button.textContent =
                    "❤️ إزالة من المفضلة";
            }
        }
    );
}


async function loadReviews(
    listingId,
    currentUser
) {

    const reviewsSummary =
        document.getElementById(
            "reviewsSummary"
        );

    const reviewsList =
        document.getElementById(
            "reviewsList"
        );

    const reviewFormContainer =
        document.getElementById(
            "reviewFormContainer"
        );


    const {
        data: reviews,
        error
    } = await supabase
        .from("reviews")
        .select(`
            id,
            user_id,
            rating,
            comment,
            created_at
        `)
        .eq(
            "listing_id",
            listingId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        reviewsSummary.innerHTML =
            "<p>تعذر تحميل التقييمات.</p>";

        reviewsList.innerHTML = "";

        return;
    }


    if (
        !reviews ||
        reviews.length === 0
    ) {

        reviewsSummary.innerHTML =
            "<p>لا توجد تقييمات لهذا الإعلان بعد.</p>";

    } else {

        const total =
            reviews.reduce(
                function (sum, review) {

                    return sum +
                        review.rating;

                },
                0
            );


        const average =
            total / reviews.length;


        reviewsSummary.innerHTML = `
            <h3>
                ⭐ ${average.toFixed(1)} / 5
            </h3>

            <p>
                بناءً على ${reviews.length}
                تقييم
            </p>
        `;
    }


    reviewsList.innerHTML = "";


    if (
        reviews &&
        reviews.length > 0
    ) {

        reviews.forEach(
            function (review) {

                const reviewElement =
                    document.createElement(
                        "article"
                    );


                reviewElement.className =
                    "review-card";


                const rating =
                    document.createElement(
                        "h4"
                    );


                rating.textContent =
                    "⭐".repeat(
                        review.rating
                    );


                reviewElement.appendChild(
                    rating
                );


                const comment =
                    document.createElement(
                        "p"
                    );


                comment.textContent =
                    review.comment ||
                    "بدون تعليق";


                reviewElement.appendChild(
                    comment
                );


                if (
                    currentUser &&
                    currentUser.id ===
                    review.user_id
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

                            const confirmed =
                                confirm(
                                    "هل تريد حذف تقييمك؟"
                                );


                            if (!confirmed) {
                                return;
                            }


                            const {
                                error
                            } = await supabase
                                .from("reviews")
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
