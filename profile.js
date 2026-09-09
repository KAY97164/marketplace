const userEmail = document.getElementById("userEmail");
const myListings = document.getElementById("myListings");
const logoutButton = document.getElementById("logoutButton");

async function loadProfile() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {

        window.location.href = "auth.html";
        return;

    }

    userEmail.textContent =
        "البريد الإلكتروني: " + user.email;


    const { data: listings, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });


    if (error) {

        console.error(error);

        myListings.innerHTML =
            "<p>حدث خطأ أثناء تحميل إعلاناتك.</p>";

        return;

    }


    if (!listings || listings.length === 0) {

        myListings.innerHTML =
            "<p>ليس لديك إعلانات حتى الآن.</p>";

        return;

    }


    myListings.innerHTML = "";


    listings.forEach(function (listing) {

        const card = document.createElement("article");

        card.className = "listing-card";


        let imageHTML = "";

        if (
            listing.image_urls &&
            listing.image_urls.length > 0
        ) {

            imageHTML = `
                <img
                    src="${listing.image_urls[0]}"
                    alt="${listing.title}"
                >
            `;

        }


        card.innerHTML = `

            ${imageHTML}

            <h3>${listing.title}</h3>

            <p>
                ${listing.price} درهم
            </p>

            <p>
                ${listing.city}
            </p>

            <button class="editButton">
                تعديل
            </button>

            <button class="deleteButton">
                حذف
            </button>

        `;


        card.querySelector(".editButton")
            .addEventListener("click", function () {

                window.location.href =
                    "edit.html?id=" + listing.id;

            });


        card.querySelector(".deleteButton")
            .addEventListener("click", async function () {

                const confirmed = confirm(
                    "هل أنتِ متأكدة من حذف هذا الإعلان؟"
                );

                if (!confirmed) {
                    return;
                }


                const { error } = await supabase
                    .from("listings")
                    .delete()
                    .eq("id", listing.id)
                    .eq("user_id", user.id);


                if (error) {

                    alert(
                        "حدث خطأ أثناء حذف الإعلان: " +
                        error.message
                    );

                    return;

                }


                alert("تم حذف الإعلان.");

                loadProfile();

            });


        myListings.appendChild(card);

    });

}


logoutButton.addEventListener("click", async function () {

    const { error } = await supabase.auth.signOut();

    if (error) {

        alert(
            "حدث خطأ أثناء تسجيل الخروج: " +
            error.message
        );

        return;

    }

    window.location.href = "index.html";

});


loadProfile();
