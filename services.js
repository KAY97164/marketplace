const servicesContainer =
    document.getElementById("servicesContainer");

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

async function loadServices() {
    const {
        data: services,
        error
    } = await supabase
        .from("listings")
        .select("*")
        .eq("type", "service")
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        console.error(error);

        servicesContainer.textContent =
            "تعذر تحميل الخدمات.";

        return;
    }

    servicesContainer.innerHTML = "";

    if (!services || services.length === 0) {
        servicesContainer.textContent =
            "لا توجد خدمات حاليًا.";

        return;
    }

    services.forEach(function (service) {

        const card =
            document.createElement("article");

        card.className =
            "listing-card";

        card.style.cursor =
            "pointer";

        if (
            service.image_urls &&
            service.image_urls.length > 0
        ) {
            const image =
                document.createElement("img");

            image.src =
                service.image_urls[0];

            image.alt =
                service.title;

            image.loading =
                "lazy";

            card.appendChild(image);
        }

        const title =
            document.createElement("h3");

        title.textContent =
            service.title;

        card.appendChild(title);

        const price =
            document.createElement("p");

        price.textContent =
            "السعر: " +
            formatPrice(
                service.price,
                service.currency
            );

        card.appendChild(price);

        const country =
            document.createElement("p");

        country.textContent =
            "الدولة: " +
            (
                service.country ||
                "غير محددة"
            );

        card.appendChild(country);

        const city =
            document.createElement("p");

        city.textContent =
            "المدينة: " +
            (
                service.city ||
                "غير محددة"
            );

        card.appendChild(city);

        const description =
            document.createElement("p");

        description.textContent =
            service.description || "";

        card.appendChild(description);

        card.addEventListener(
            "click",
            function () {
                window.location.href =
                    "listing.html?id=" +
                    service.id;
            }
        );

        servicesContainer.appendChild(
            card
        );
    });
}

loadServices();
