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


    let currentUser = null;


    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();


    currentUser = user;


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


        if (favorite) {
            isFavorite = true;
        }

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

        <p>
            ${listing.description}
        </p>

        <button id="favoriteButton">
            ${isFavorite
                ? "❤️ إزالة من المفضلة"
                : "♡ إضافة إلى المفضلة"}
        </button>

        <button id="contactSeller">
            تواصل مع البائع
        </button>

    `;


    const favoriteButton =
        document.getElementById(
            "favoriteButton"
        );


    favoriteButton.addEventListener(
        "click",
        async function () {

            if (!currentUser) {

                alert(
                    "يجب تسجيل الدخول أولًا لإضافة الإعلان إلى المفضلة."
                );

                window.location.href =
                    "auth.html";

                return;
            }


            if (isFavorite) {

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
                        "حدث خطأ أثناء إزالة الإعلان من المفضلة."
                    );

                    return;
                }


                isFavorite = false;

                favoriteButton.textContent =
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
                        "حدث خطأ أثناء إضافة الإعلان إلى المفضلة."
                    );

                    return;
                }


                isFavorite = true;

                favoriteButton.textContent =
                    "❤️ إزالة من المفضلة";

            }

        }
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

}


loadListing();
