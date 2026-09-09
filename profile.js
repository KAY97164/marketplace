const userEmail =
    document.getElementById("userEmail");

const myListings =
    document.getElementById("myListings");

const logoutButton =
    document.getElementById("logoutButton");

const profileForm =
    document.getElementById("profileForm");

const usernameInput =
    document.getElementById("username");

const avatarInput =
    document.getElementById("avatar");

const avatarContainer =
    document.getElementById("avatarContainer");

const profileMessage =
    document.getElementById("profileMessage");


let currentUser = null;


async function loadProfile() {

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


    currentUser = user;


    userEmail.textContent =
        "البريد الإلكتروني: " +
        user.email;


    const {
        data: profile,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    if (error) {

        console.error(error);

    }


    if (profile) {

        usernameInput.value =
            profile.username || "";


        if (profile.avatar_url) {

            showAvatar(
                profile.avatar_url
            );

        } else {

            avatarContainer.innerHTML =
                "<p>لا توجد صورة شخصية.</p>";

        }

    } else {

        avatarContainer.innerHTML =
            "<p>لا توجد صورة شخصية.</p>";

    }


    await loadMyListings();

}


function showAvatar(url) {

    avatarContainer.innerHTML = "";


    const image =
        document.createElement("img");

    image.src =
        url;

    image.alt =
        "الصورة الشخصية";

    image.style.width =
        "150px";

    image.style.height =
        "150px";

    image.style.objectFit =
        "cover";

    image.style.borderRadius =
        "50%";


    avatarContainer.appendChild(
        image
    );

}


profileForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const username =
            usernameInput.value.trim();

        const avatar =
            avatarInput.files[0];


        if (username.length < 3) {

            profileMessage.textContent =
                "اسم المستخدم يجب أن يحتوي على 3 أحرف على الأقل.";

            return;
        }


        profileMessage.textContent =
            "جاري حفظ الملف الشخصي...";


        try {

            let avatarUrl = null;


            const {
                data: existingProfile
            } = await supabase
                .from("profiles")
                .select("avatar_url")
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


            if (existingProfile) {

                avatarUrl =
                    existingProfile.avatar_url;

            }


            if (avatar) {

                const fileName =
                    currentUser.id +
                    "/" +
                    Date.now() +
                    "-" +
                    avatar.name;


                const {
                    error: uploadError
                } = await supabase
                    .storage
                    .from("profile-images")
                    .upload(
                        fileName,
                        avatar
                    );


                if (uploadError) {
                    throw uploadError;
                }


                const {
                    data: publicUrlData
                } = supabase
                    .storage
                    .from("profile-images")
                    .getPublicUrl(
                        fileName
                    );


                avatarUrl =
                    publicUrlData.publicUrl;

            }


            const {
                error: profileError
            } = await supabase
                .from("profiles")
                .upsert({

                    id:
                        currentUser.id,

                    username:
                        username,

                    avatar_url:
                        avatarUrl

                });


            if (profileError) {
                throw profileError;
            }


            if (avatarUrl) {

                showAvatar(
                    avatarUrl
                );

            }


            profileMessage.textContent =
                "تم حفظ الملف الشخصي بنجاح! 🎉";


        } catch (error) {

            console.error(error);

            profileMessage.textContent =
                "حدث خطأ: " +
                error.message;

        }

    }
);


async function loadMyListings() {

    const {
        data: listings,
        error
    } = await supabase
        .from("listings")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        myListings.innerHTML =
            "<p>حدث خطأ أثناء تحميل إعلاناتك.</p>";

        return;
    }


    myListings.innerHTML = "";


    if (
        !listings ||
        listings.length === 0
    ) {

        myListings.innerHTML =
            "<p>ليس لديك إعلانات حتى الآن.</p>";

        return;
    }


    listings.forEach(
        function (listing) {

            const card =
                document.createElement("article");

            card.className =
                "listing-card";


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

                card.appendChild(
                    image
                );

            }


            const title =
                document.createElement("h3");

            title.textContent =
                listing.title;

            card.appendChild(
                title
            );


            const price =
                document.createElement("p");

            price.textContent =
                Number(listing.price).toFixed(2) +
                " درهم";

            card.appendChild(
                price
            );


            const city =
                document.createElement("p");

            city.textContent =
                listing.city;

            card.appendChild(
                city
            );


            const editButton =
                document.createElement("button");

            editButton.textContent =
                "تعديل";


            editButton.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "edit.html?id=" +
                        listing.id;

                }
            );


            card.appendChild(
                editButton
            );


            const deleteButton =
                document.createElement("button");

            deleteButton.textContent =
                "حذف";


            deleteButton.addEventListener(
                "click",
                async function () {

                    const confirmed =
                        confirm(
                            "هل أنتِ متأكدة من حذف هذا الإعلان؟"
                        );


                    if (!confirmed) {
                        return;
                    }


                    const {
                        error
                    } = await supabase
                        .from("listings")
                        .delete()
                        .eq(
                            "id",
                            listing.id
                        )
                        .eq(
                            "user_id",
                            currentUser.id
                        );


                    if (error) {

                        alert(
                            "حدث خطأ أثناء حذف الإعلان: " +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "تم حذف الإعلان."
                    );


                    loadMyListings();

                }
            );


            card.appendChild(
                deleteButton
            );


            myListings.appendChild(
                card
            );

        }
    );

}


logoutButton.addEventListener(
    "click",
    async function () {

        const {
            error
        } = await supabase.auth.signOut();


        if (error) {

            alert(
                "حدث خطأ أثناء تسجيل الخروج: " +
                error.message
            );

            return;
        }


        window.location.href =
            "index.html";

    }
);


loadProfile();
