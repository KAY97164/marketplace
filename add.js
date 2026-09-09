const form = document.getElementById("listingForm");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const type = document.getElementById("type").value;
    const title = document.getElementById("title").value.trim();
    const price = Number(document.getElementById("price").value);
    const currency = document.getElementById("currency").value;
    const country = document.getElementById("country").value.trim();
    const city = document.getElementById("city").value.trim();
    const description = document.getElementById("description").value.trim();
    const images = document.getElementById("images").files;

    if (!title || !country || !city || !description) {
        alert("يرجى ملء جميع البيانات.");
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        alert("يرجى إدخال سعر صحيح.");
        return;
    }

    if (images.length === 0) {
        alert("يرجى اختيار صورة واحدة على الأقل.");
        return;
    }

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
        alert("يجب تسجيل الدخول أولًا لإضافة إعلان.");
        window.location.href = "auth.html";
        return;
    }

    try {
        const { data: listing, error: listingError } =
            await supabase
                .from("listings")
                .insert({
                    title: title,
                    type: type,
                    price: price,
                    currency: currency,
                    country: country,
                    city: city,
                    description: description,
                    user_id: user.id,
                    image_urls: []
                })
                .select()
                .single();

        if (listingError) {
            throw listingError;
        }

        const imageUrls = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            const safeName = image.name
                .replace(/[^a-zA-Z0-9._-]/g, "_");

            const fileName =
                user.id +
                "/" +
                listing.id +
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

            imageUrls.push(publicUrlData.publicUrl);
        }

        const { error: updateError } =
            await supabase
                .from("listings")
                .update({
                    image_urls: imageUrls
                })
                .eq("id", listing.id)
                .eq("user_id", user.id);

        if (updateError) {
            throw updateError;
        }

        alert("تم نشر الإعلان بنجاح! 🌍🎉");

        form.reset();

        window.location.href = "index.html";

    } catch (error) {
        console.error(error);

        alert(
            "حدث خطأ أثناء نشر الإعلان:\n\n" +
            error.message
        );
    }
});
