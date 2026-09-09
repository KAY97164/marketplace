const publicProfile = document.getElementById("publicProfile");
const sellerListings = document.getElementById("sellerListings");

const params = new URLSearchParams(window.location.search);
const sellerId = params.get("id");

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

async function loadProfile() {
    if (!sellerId) {
        publicProfile.textContent = "ملف البائع غير موجود.";
        sellerListings.textContent = "";
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", sellerId)
        .maybeSingle();

    if (profileError) {
        console.error(profileError);
        publicProfile.textContent = "تعذر تحميل ملف البائع.";
        return;
    }

    publicProfile.innerHTML = "";

    const title = createElement(
        "h2",
        profile && profile.username
            ? profile.username
            : "بائع على Chronet"
    );

    publicProfile.appendChild(title);

    if (profile && profile.avatar_url) {
        const avatar = document.createElement("img");

        avatar.src = profile.avatar_url;
        avatar.alt = "الصورة الشخصية";
        avatar.width = 120;
        avatar.height = 120;

        publicProfile.appendChild(avatar);
    }

    const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", sellerId)
        .order("created_at", { ascending: false });

    if (listingsError) {
        console.error(listingsError);
        sellerListings.textContent =
            "تعذر تحميل إعلانات البائع.";
        return;
    }

    sellerListings.innerHTML = "";

    if (!listings || listings.length === 0) {
        sellerListings.textContent =
            "لا توجد إعلانات لهذا البائع.";
        return;
    }

    listings.forEach(function (listing) {
        const card = document.createElement("article");
        card.className = "listing-card";
        card.style.cursor = "pointer";

        if (
            listing.image_urls &&
            listing.image_urls.length > 0
        ) {
            const image = document.createElement("img");

            image.src = listing.image_urls[0];
            image.alt = listing.title;
            image.loading = "lazy";

            card.appendChild(image);
        }

        const title = createElement(
            "h3",
            listing.title
        );

        const price = createElement(
            "p",
            "السعر: " +
            Number(listing.price).toFixed(2) +
            " درهم"
        );

        const city = createElement(
            "p",
            "المدينة: " +
            (listing.city || "غير محددة")
        );

        const type = createElement(
            "p",
            "النوع: " +
            (listing.type === "product"
                ? "منتج"
                : "خدمة")
        );

        const description = createElement(
            "p",
            listing.description || ""
        );

        card.appendChild(title);
        card.appendChild(price);
        card.appendChild(city);
        card.appendChild(type);
        card.appendChild(description);

        card.addEventListener("click", function () {
            window.location.href =
                "listing.html?id=" + listing.id;
        });

        sellerListings.appendChild(card);
    });
}

loadProfile();
