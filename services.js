const servicesContainer =
document.getElementById("servicesContainer");

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
        {
            ascending: false
        }
    );

if (error) {
    console.error(error);
    servicesContainer.innerHTML =
        "<p>تعذر تحميل الخدمات.</p>";
    return;
}

servicesContainer.innerHTML = "";

if (!services || services.length === 0) {
    servicesContainer.innerHTML =
        "<p>لا توجد خدمات حاليًا.</p>";
    return;
}

services.forEach(
    function (service) {

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

            card.appendChild(
                image
            );

        }

        const title =
            document.createElement("h3");

        title.textContent =
            service.title;

        card.appendChild(
            title
        );

        const price =
            document.createElement("p");

        price.textContent =
            "السعر: " +
            Number(service.price).toFixed(2) +
            " درهم";

        card.appendChild(
            price
        );

        const city =
            document.createElement("p");

        city.textContent =
            "المدينة: " +
            service.city;

        card.appendChild(
            city
        );

        const description =
            document.createElement("p");

        description.textContent =
            service.description || "";

        card.appendChild(
            description
        );

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

    }
);

}

loadServices();
