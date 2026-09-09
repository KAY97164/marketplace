const productsContainer =
    document.getElementById("productsContainer");


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
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        productsContainer.innerHTML =
            "<p>تعذر تحميل المنتجات.</p>";

        return;
    }


    productsContainer.innerHTML = "";


    if (
        !products ||
        products.length === 0
    ) {

        productsContainer.innerHTML =
            "<p>لا توجد منتجات حاليًا.</p>";

        return;
    }


    products.forEach(
        function (product) {

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

                card.appendChild(
                    image
                );

            }


            const title =
                document.createElement("h3");

            title.textContent =
                product.title;

            card.appendChild(
                title
            );


            const price =
                document.createElement("p");

            price.textContent =
                "السعر: " +
                Number(product.price).toFixed(2) +
                " درهم";

            card.appendChild(
                price
            );


            const city =
                document.createElement("p");

            city.textContent =
                "المدينة: " +
                product.city;

            card.appendChild(
                city
            );


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

        }
    );

}


loadProducts();
