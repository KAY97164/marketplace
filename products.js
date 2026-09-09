const productsContainer =
    document.getElementById("productsContainer");

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

async function loadProducts() {
    const {
        data: products,
        error
    } = await supabase
        .from("listings")
        .select("*")
        .eq("type", "product")
        .order(
            "created_at",
            { ascending: false }
        );

    if (error) {
        console.error(error);

        productsContainer.textContent =
            "تعذر تحميل المنتجات.";

        return;
    }

    productsContainer.innerHTML = "";

    if (!products || products.length === 0) {
        productsContainer.textContent =
            "لا توجد منتجات حاليًا.";

        return;
    }

    products.forEach(function (product) {

        const card =
            document.createElement("article");

        card.className =
            "listing-card";

        card.style.cursor =
            "pointer";

        if (
            product.image_urls &&
            product.image_urls.length > 0
        ) {
            const image =
                document.createElement("img");

            image.src =
                product.image_urls[0];

            image.alt =
                product.title;

            image.loading =
                "lazy";

            card.appendChild(image);
        }

        const title =
            document.createElement("h3");

        title.textContent =
            product.title;

        card.appendChild(title);

        const price =
            document.createElement("p");

        price.textContent =
            "السعر: " +
            formatPrice(
                product.price,
                product.currency
            );

        card.appendChild(price);

        const country =
            document.createElement("p");

        country.textContent =
            "الدولة: " +
            (
                product.country ||
                "غير محددة"
            );

        card.appendChild(country);

        const city =
            document.createElement("p");

        city.textContent =
            "المدينة: " +
            (
                product.city ||
                "غير محددة"
            );

        card.appendChild(city);

        const description =
            document.createElement("p");

        description.textContent =
            product.description || "";

        card.appendChild(description);

        card.addEventListener(
            "click",
            function () {
                window.location.href =
                    "listing.html?id=" +
                    product.id;
            }
        );

        productsContainer.appendChild(
            card
        );
    });
}

loadProducts();
