const listingsContainer =
    document.getElementById("listingsContainer");

const searchInput =
    document.getElementById("searchInput");

const typeFilter =
    document.getElementById("typeFilter");

const cityFilter =
    document.getElementById("cityFilter");

const minPrice =
    document.getElementById("minPrice");

const maxPrice =
    document.getElementById("maxPrice");

const sortFilter =
    document.getElementById("sortFilter");

const searchButton =
    document.getElementById("searchButton");


async function loadListings() {

    if (!listingsContainer) {
        return;
    }

    listingsContainer.innerHTML =
        "<p>جاري تحميل الإعلانات...</p>";

    let query = supabase
        .from("listings")
        .select("*");


    // البحث بالكلمات
    const search =
        searchInput
            ? searchInput.value.trim()
            : "";

    if (search) {

        query = query.or(
            "title.ilike.%" +
            search +
            "%,description.ilike.%" +
            search +
            "%"
        );

    }


    // فلترة النوع
    const type =
        typeFilter
            ? typeFilter.value
            : "";

    if (type) {
        query = query.eq("type", type);
    }


    // فلترة المدينة
    const city =
        cityFilter
            ? cityFilter.value.trim()
            : "";

    if (city) {
        query = query.ilike(
            "city",
            "%" + city + "%"
        );
    }


    // أقل سعر
    const minimum =
        minPrice
            ? minPrice.value
            : "";

    if (minimum !== "") {

        query = query.gte(
            "price",
            Number(minimum)
        );

    }


    // أعلى سعر
    const maximum =
        maxPrice
            ? maxPrice.value
            : "";

    if (maximum !== "") {

        query = query.lte(
            "price",
            Number(maximum)
        );

    }


    // الترتيب
    const sort =
        sortFilter
            ? sortFilter.value
            : "newest";


    if (sort === "newest") {

        query = query.order(
            "created_at",
            {
                ascending: false
            }
        );

    } else if (sort === "oldest") {

        query = query.order(
            "created_at",
            {
                ascending: true
            }
        );

    } else if (sort === "price_low") {

        query = query.order(
            "price",
            {
                ascending: true
            }
        );

    } else if (sort === "price_high") {

        query = query.order(
            "price",
            {
                ascending: false
            }
        );

    }


    const {
        data: listings,
        error
    } = await query;


    if (error) {

        console.error(error);

        listingsContainer.innerHTML =
            "<p>حدث خطأ أثناء تحميل الإعلانات.</p>";

        return;
    }


    if (!listings || listings.length === 0) {

        listingsContainer.innerHTML =
            "<p>لم نجد أي إعلانات مطابقة.</p>";

        return;
    }


    listingsContainer.innerHTML = "";


    listings.forEach(function (listing) {

        const card =
            document.createElement("article");

        card.className =
            "listing-card";

        card.style.cursor =
            "pointer";


        card.addEventListener(
            "click",
            function () {

                window.location.href =
                    "listing.html?id=" +
                    listing.id;

            }
        );


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

        price.innerHTML =
            "<strong>السعر:</strong> " +
            listing.price +
            " درهم";

        card.appendChild(price);


        const city =
            document.createElement("p");

        city.innerHTML =
            "<strong>المدينة:</strong> " +
            listing.city;

        card.appendChild(city);


        const typeText =
            listing.type === "product"
                ? "منتج"
                : "خدمة";


        const typeElement =
            document.createElement("p");

        typeElement.innerHTML =
            "<strong>النوع:</strong> " +
            typeText;

        card.appendChild(typeElement);


        const description =
            document.createElement("p");

        description.textContent =
            listing.description;

        card.appendChild(description);


        listingsContainer.appendChild(card);

    });

}


if (searchButton) {

    searchButton.addEventListener(
        "click",
        loadListings
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                loadListings();

            }

        }
    );

}


loadListings();
