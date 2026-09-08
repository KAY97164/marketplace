const listingDetails = document.getElementById("listingDetails");

async function loadListing() {

    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("id");

    if (!listingId) {
        listingDetails.innerHTML =
            "<p>لم يتم تحديد الإعلان.</p>";
        return;
    }

    const { data: listing, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

    if (error) {
        console.error(error);

        listingDetails.innerHTML =
            "<p>تعذر تحميل الإعلان.</p>";

        return;
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
            ${listing.type}
        </p>

        <h3>الوصف</h3>

        <p>
            ${listing.description}
        </p>

        <button id="contactSeller">
            تواصل مع البائع
        </button>

    `;

    document
        .getElementById("contactSeller")
        .addEventListener("click", function () {

            alert(
                "نظام الرسائل سنضيفه في الخطوة القادمة."
            );

        });

}

loadListing();
