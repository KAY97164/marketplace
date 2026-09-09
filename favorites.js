const favoritesContainer =
    document.getElementById(
        "favoritesContainer"
    );


async function loadFavorites() {

    const {
        data: {
            user
        },
        error: userError
    } = await supabase.auth.getUser();


    if (userError || !user) {

        window.location.href =
            "auth.html";

        return;
    }


    const {
        data: favorites,
        error
    } = await supabase
        .from("favorites")
        .select(`
            id,
            listing_id,
            listings (
                id,
                title,
                price,
                city,
                type,
                description,
                image_urls
            )
        `)
        .eq("user_id", user.id)
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        favoritesContainer.innerHTML =
            "<p>حدث خطأ أثناء تحميل المفضلة.</p>";

        return;
    }


    if (
        !favorites ||
        favorites.length === 0
    ) {

        favoritesContainer.innerHTML =
            "<p>لم تضف أي إعلان إلى المفضلة بعد ❤️</p>";

        return;
    }


    favoritesContainer.innerHTML = "";


    favorites.forEach(function (favorite) {

        const listing =
            favorite.listings;


        if (!listing) {
            return;
        }


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


        price.textContent =
            listing.price +
            " درهم";


        card.appendChild(price);


        const city =
            document.createElement("p");


        city.textContent =
            listing.city;


        card.appendChild(city);


        const removeButton =
            document.createElement("button");


        removeButton.textContent =
            "❤️ إزالة من المفضلة";


        removeButton.addEventListener(
            "click",
            async function (event) {

                event.stopPropagation();


                const {
                    error
                } = await supabase
                    .from("favorites")
                    .delete()
                    .eq(
                        "id",
                        favorite.id
                    );


                if (error) {

                    alert(
                        "حدث خطأ أثناء إزالة الإعلان."
                    );

                    return;
                }


                card.remove();


                if (
                    favoritesContainer
                        .children.length === 0
                ) {

                    favoritesContainer.innerHTML =
                        "<p>لم تعد لديك إعلانات في المفضلة ❤️</p>";

                }

            }
        );


        card.appendChild(
            removeButton
        );


        favoritesContainer.appendChild(
            card
        );

    });

}


loadFavorites();
