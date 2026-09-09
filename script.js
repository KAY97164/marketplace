const listingsContainer = document.getElementById("listingsContainer");

async function loadListings() {

    if (!listingsContainer) {
        return;
    }

    listingsContainer.innerHTML = "<p>جاري تحميل الإعلانات...</p>";

    const { data: listings, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);

        listingsContainer.innerHTML =
            "<p>حدث خطأ أثناء تحميل الإعلانات.</p>";

        return;
    }

    if (!listings || listings.length === 0) {

        listingsContainer.innerHTML =
            "<p>لا توجد إعلانات حتى الآن.</p>";

        return;
    }

    listingsContainer.innerHTML = "";

    listings.forEach(function (listing) {

        const card = document.createElement("article");

        card.className = "listing-card";
card.style.cursor = "pointer";

card.addEventListener("click", function () {
    window.location.href =
        "listing.html?id=" + listing.id;
});
        let imageHTML = "";

        if (
            listing.image_urls &&
            listing.image_urls.length > 0
        ) {

            imageHTML =
                '<img src="' +
                listing.image_urls[0] +
                '" alt="' +
                listing.title +
                '">';

        }

        card.innerHTML =
            imageHTML +
            "<h3>" +
            listing.title +
            "</h3>" +

            "<p><strong>السعر:</strong> " +
            listing.price +
            " درهم</p>" +

            "<p><strong>المدينة:</strong> " +
            listing.city +
            "</p>" +

            "<p>" +
            listing.description +
            "</p>";

        listingsContainer.appendChild(card);

    });
}

loadListings();
