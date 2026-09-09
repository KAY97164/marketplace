const listingsContainer = document.getElementById("listingsContainer");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const cityFilter = document.getElementById("cityFilter");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortFilter = document.getElementById("sortFilter");
const searchButton = document.getElementById("searchButton");

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

    const symbol = symbols[currency] || currency || "USD";

    return Number(price).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " " + symbol;
}

async function loadListings() {
    if (!listingsContainer) return;

    listingsContainer.innerHTML =
        "<p>جاري تحميل الإعلانات...</p>";

    let query = supabase
        .from("listings")
        .select("*");

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

    const type =
        typeFilter
            ? typeFilter.value
            : "";

    if (type) {
        query = query.eq("type", type);
    }

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

    const sort =
        sortFilter
            ? sortFilter.value
            : "newest";

    if (sort === "newest") {
        query = query.order(
            "created_at",
            { ascending: false }
        );
    } else if (sort === "oldest") {
        query = query.order(
            "created_at",
            { ascending: true }
        );
    } else if (sort === "price_low") {
        query = query.order(
            "price",
            { ascending: true }
        );
    } else if (sort === "price_high") {
        query = query.order(
            "price",
            { ascending: false }
        );
    }

    const {
        data: listings,
        error
    } = await query;

    if (error) {
        console.error(error);

        listingsContainer.textContent =
            "حدث خطأ أثناء تحميل الإعلانات.";

        return;
    }

    if (!listings || listings.length === 0) {
        listingsContainer.textContent =
            "لم نجد أي إعلانات مطابقة.";

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

            image.loading =
                "lazy";

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
            formatPrice(
                listing.price,
                listing.currency
            );

        card.appendChild(price);

        const country =
            document.createElement("p");

        country.textContent =
            "الدولة: " +
            (listing.country ||
                "غير محددة");

        card.appendChild(country);

        const city =
            document.createElement("p");

        city.textContent =
            "المدينة: " +
            (listing.city ||
                "غير محددة");

        card.appendChild(city);

        const typeElement =
            document.createElement("p");

        typeElement.textContent =
            "النوع: " +
            (
                listing.type === "product"
                    ? "منتج"
                    : "خدمة"
            );

        card.appendChild(typeElement);

        const description =
            document.createElement("p");

        description.textContent =
            listing.description || "";

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
