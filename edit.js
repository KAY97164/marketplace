const form = document.getElementById("editForm");
const message = document.getElementById("message");

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

let currentUser = null;
let currentListing = null;


async function loadListing() {

    if (!listingId) {

        message.textContent =
            "لم يتم تحديد الإعلان.";

        form.style.display = "none";

        return;
    }


    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();


    if (userError || !user) {

        window.location.href = "auth.html";

        return;
    }


    currentUser = user;


    const { data: listing, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .eq("user_id", user.id)
        .single();


    if (error || !listing) {

        message.textContent =
            "لا يمكنك تعديل هذا الإعلان.";

        form.style.display = "none";

        return;
    }


    currentListing = listing;


    document.getElementById("type").value =
        listing.type;

    document.getElementById("title").value =
        listing.title;

    document.getElementById("price").value =
        listing.price;

    document.getElementById("city").value =
        listing.city;

    document.getElementById("description").value =
        listing.description;

}


form.addEventListener("submit", async function (event) {

    event.preventDefault();


    if (!currentUser || !currentListing) {
        return;
    }


    message.textContent =
        "جاري حفظ التعديلات...";


    const type =
        document.getElementById("type").value;

    const title =
        document.getElementById("title").value.trim();

    const price =
        document.getElementById("price").value;

    const city =
        document.getElementById("city").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const newImages =
        document.getElementById("images").files;


    try {

        let imageUrls =
            currentListing.image_urls || [];


        // رفع الصور الجديدة
        for (let i = 0; i < newImages.length; i++) {

            const image = newImages[i];

            const fileName =
                currentUser.id +
                "/" +
                currentListing.id +
                "/" +
                Date.now() +
                "-" +
                image.name;


            const { error: uploadError } =
                await supabase
                    .storage
                    .from("listing-images")
                    .upload(fileName, image);


            if (uploadError) {
                throw uploadError;
            }


            const { data: publicUrlData } =
                supabase
                    .storage
                    .from("listing-images")
                    .getPublicUrl(fileName);


            imageUrls.push(
                publicUrlData.publicUrl
            );
        }


        // تحديث الإعلان
        const { error: updateError } =
            await supabase
                .from("listings")
                .update({

                    type: type,
                    title: title,
                    price: price,
                    city: city,
                    description: description,
                    image_urls: imageUrls

                })
                .eq("id", currentListing.id)
                .eq("user_id", currentUser.id);


        if (updateError) {
            throw updateError;
        }


        message.textContent =
            "تم حفظ التعديلات بنجاح! 🎉";


        setTimeout(function () {

            window.location.href =
                "profile.html";

        }, 1000);


    } catch (error) {

        console.error(error);

        message.textContent =
            "حدث خطأ: " + error.message;

    }

});


loadListing();
