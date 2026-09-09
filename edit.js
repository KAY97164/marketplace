const editForm = document.getElementById("editForm");

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

let currentUser = null;
let currentListing = null;

async function getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.href = "auth.html";
        return null;
    }

    return data.user;
}

async function loadListing() {
    if (!listingId) {
        alert("الإعلان غير موجود.");
        window.location.href = "profile.html";
        return;
    }

    const { data: listing, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .eq("user_id", currentUser.id)
        .single();

    if (error || !listing) {
        console.error(error);
        alert("تعذر تحميل الإعلان.");
        window.location.href = "profile.html";
        return;
    }

    currentListing = listing;

    document.getElementById("type").value =
        listing.type || "product";

    document.getElementById("title").value =
        listing.title || "";

    document.getElementById("price").value =
        listing.price ?? "";

    document.getElementById("currency").value =
        listing.currency || "MAD";

    document.getElementById("country").value =
        listing.country || "";

    document.getElementById("city").value =
        listing.city || "";

    document.getElementById("description").value =
        listing.description || "";
}

editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUser || !currentListing) {
        alert("تعذر تحميل الإعلان.");
        return;
    }

    const type =
        document.getElementById("type").value;

    const title =
        document.getElementById("title").value.trim();

    const price =
        Number(document.getElementById("price").value);

    const currency =
        document.getElementById("currency").value;

    const country =
        document.getElementById("country").value.trim();

    const city =
        document.getElementById("city").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const images =
        document.getElementById("images").files;

    if (!title || !country || !city || !description) {
        alert("يرجى ملء جميع البيانات.");
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        alert("يرجى إدخال سعر صحيح.");
        return;
    }

    try {
        let imageUrls =
            Array.isArray(currentListing.image_urls)
                ? [...currentListing.image_urls]
                : [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            const safeName =
                image.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );

            const fileName =
                currentUser.id +
                "/" +
                currentListing.id +
                "/" +
                Date.now() +
                "-" +
                i +
                "-" +
                safeName;

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

        const { error: updateError } =
            await supabase
                .from("listings")
                .update({
                    type,
                    title,
                    price,
                    currency,
                    country,
                    city,
                    description,
                    image_urls: imageUrls
                })
                .eq("id", currentListing.id)
                .eq("user_id", currentUser.id);

        if (updateError) {
            throw updateError;
        }

        alert("تم حفظ التعديلات بنجاح! 🎉");

        window.location.href =
            "listing.html?id=" +
            currentListing.id;

    } catch (error) {
        console.error(error);

        alert(
            "حدث خطأ أثناء تعديل الإعلان:\n\n" +
            error.message
        );
    }
});

async function start() {
    currentUser = await getUser();

    if (!currentUser) return;

    await loadListing();
}

start();
