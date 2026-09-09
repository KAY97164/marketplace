const listingDetails =
    document.getElementById("listingDetails");

async function loadListing() {

    const params =
        new URLSearchParams(window.location.search);

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
            .eq("user_id", currentUser.id)
            .eq("listing_id", listing.id)
            .maybeSingle();

        isFavorite = !!favorite;
    }

    let imagesHTML = "";

    if (
        listing.image_urls &&
        listing.image_urls.length > 0
    ) {

        imagesHTML = `
            <div class="listing-images">

                ${listing.image_urls.map(function (url) {

                    return `
                        <img
                            src="${url}"
                            alt="${listing.title}"
                        >
                    `;

                }).join("")}

            </div>
        `;

    } else {

        imagesHTML =
            "<p>لا توجد صور لهذا الإعلان.</p>";
    }

    const typeText =
        listing.type === "product"
            ? "منتج"
            : "خدمة";

    listingDetails.innerHTML = `

        ${imagesHTML}

        <h2>${listing.title}</h2>

        <p>
            <strong>السعر:</strong>
            ${listing.price} درهم
        </p>

        <p>
            <strong>المدينة:</strong>
            ${listing.city}
        </p>

        <p>
            <strong>النوع:</strong>
            ${typeText}
        </p>

        <h3>الوصف</h3>

        <p>${listing.description}</p>

        <button id="favoriteButton">
            ${
                isFavorite
                    ? "❤️ إزالة من المفضلة"
                    : "♡ إضافة إلى المفضلة"
            }
        </button>

        <button id="contactSeller">
            تواصل مع البائع
        </button>

        <hr>

        <section id="reviewsSection">

            <h2>⭐ التقييمات والتعليقات</h2>

            <div id="reviewsSummary">
                جاري تحميل التقييمات...
            </div>

            <div id="reviewsList">
                جاري تحميل التعليقات...
            </div>

            <div id="reviewFormContainer"></div>

        </section>
    `;

    setupFavoriteButton(
        listing,
        currentUser,
        isFavorite
    );

    document
        .getElementById("contactSeller")
        .addEventListener(
            "click",
            function () {

                alert(
                    "نظام الرسائل سنضيفه في الخطوة القادمة."
                );

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


    // حساب متوسط التقييم

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
                    return sum + review.rating;
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


                const stars =
                    "⭐".repeat(
                        review.rating
                    );


                const comment =
                    document.createElement(
                        "p"
                    );

                comment.textContent =
                    review.comment ||
                    "بدون تعليق";


                const rating =
                    document.createElement(
                        "h4"
                    );

                rating.textContent =
                    stars;


                reviewElement.appendChild(
                    rating
                );

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
                                    "حدث خطأ أثناء حذف التقييم."
                                );

                                return;
                            }


                            await loadReviews(
                                listingId,
                                currentUser
                            );
                        }
                    );


                    reviewElement.appendChild(
                        deleteButton
                    );
                }


                reviewsList.appendChild(
                    reviewElement
                );
            }
        );
    }


    // نموذج إضافة التقييم

    if (!currentUser) {

        reviewFormContainer.innerHTML = `
            <p>
                <a href="auth.html">
                    سجّل الدخول
                </a>
                لإضافة تقييم وتعليق.
            </p>
        `;

        return;
    }


    const alreadyReviewed =
        reviews &&
        reviews.some(
            function (review) {
                return (
                    review.user_id ===
                    currentUser.id
                );
            }
        );


    if (alreadyReviewed) {

        reviewFormContainer.innerHTML = `
            <p>
                لقد قيّمت هذا الإعلان بالفعل.
            </p>
        `;

        return;
    }


    reviewFormContainer.innerHTML = `

        <hr>

        <h3>
            أضف تقييمك
        </h3>

        <form id="reviewForm">

            <label for="rating">
                التقييم
            </label>

            <select
                id="rating"
                required
            >

                <option value="">
                    اختر التقييم
                </option>

                <option value="5">
                    ⭐⭐⭐⭐⭐ ممتاز
                </option>

                <option value="4">
                    ⭐⭐⭐⭐ جيد جدًا
                </option>

                <option value="3">
                    ⭐⭐⭐ جيد
                </option>

                <option value="2">
                    ⭐⭐ ضعيف
                </option>

                <option value="1">
                    ⭐ سيئ
                </option>

            </select>


            <label for="reviewComment">
                تعليقك
            </label>

            <textarea
                id="reviewComment"
                rows="5"
                maxlength="1000"
                placeholder="اكتب رأيك عن الإعلان..."
            ></textarea>


            <button type="submit">
                نشر التقييم
            </button>

        </form>

        <p id="reviewMessage"></p>
    `;


    document
        .getElementById("reviewForm")
        .addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const rating =
                    Number(
                        document.getElementById(
                            "rating"
                        ).value
                    );


                const comment =
                    document.getElementById(
                        "reviewComment"
                    ).value.trim();


                const reviewMessage =
                    document.getElementById(
                        "reviewMessage"
                    );


                if (
                    !rating ||
                    rating < 1 ||
                    rating > 5
                ) {

                    reviewMessage.textContent =
                        "اختر تقييمًا من 1 إلى 5.";

                    return;
                }


                reviewMessage.textContent =
                    "جاري نشر التقييم...";


                const {
                    error
                } = await supabase
                    .from("reviews")
                    .insert({

                        user_id:
                            currentUser.id,

                        listing_id:
                            listingId,

                        rating:
                            rating,

                        comment:
                            comment
                    });


                if (error) {

                    console.error(error);

                    reviewMessage.textContent =
                        "حدث خطأ: " +
                        error.message;

                    return;
                }


                reviewMessage.textContent =
                    "تم نشر تقييمك بنجاح! ⭐";


                await loadReviews(
                    listingId,
                    currentUser
                );
            }
        );
}


loadListing();
