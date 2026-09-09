import { supabase } from "./supabase.js";

const form = document.getElementById("addForm");
const message = document.getElementById("message");
const publishButton = document.getElementById("publishButton");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    publishButton.disabled = true;
    message.textContent = "جاري نشر الإعلان...";

    try {
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error("يجب تسجيل الدخول أولًا.");
        }

        const type = document.getElementById("type").value;
        const title = document.getElementById("title").value.trim();
        const price = Number(document.getElementById("price").value);
        const currency = document.getElementById("currency").value;
        const country = document.getElementById("country").value.trim();
        const city = document.getElementById("city").value.trim();
        const description = document.getElementById("description").value.trim();
        const images = document.getElementById("images").files;

        if (!title) {
            throw new Error("اكتبي عنوان الإعلان.");
        }

        if (!Number.isFinite(price) || price < 0) {
            throw new Error("أدخلي سعرًا صحيحًا.");
        }

        if (!country) {
            throw new Error("اكتبي الدولة.");
        }

        if (!city) {
            throw new Error("اكتبي المدينة.");
        }

        /* إنشاء الإعلان أولًا */
        const { data: listing, error: listingError } = await supabase
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
            throw new Error(
                "لم يتم إنشاء الإعلان: " + listingError.message
            );
        }

        const imageUrls = [];

        /* رفع الصور */
        for (const file of images) {

            const extension =
                file.name.split(".").pop().toLowerCase();

            const filePath =
                `${user.id}/${listing.id}/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from("listing-images")
                .upload(filePath, file);

            if (uploadError) {
                console.error(uploadError);
                continue;
            }

            const { data: publicData } = supabase.storage
                .from("listing-images")
                .getPublicUrl(filePath);

            if (publicData?.publicUrl) {
                imageUrls.push(publicData.publicUrl);
            }
        }

        /* حفظ روابط الصور */
        if (imageUrls.length > 0) {
            const { error: imageUpdateError } = await supabase
                .from("listings")
                .update({
                    image_urls: imageUrls
                })
                .eq("id", listing.id)
                .eq("user_id", user.id);

            if (imageUpdateError) {
                console.error(imageUpdateError);
            }
        }

        message.textContent = "تم نشر الإعلان بنجاح ✅";

        form.reset();

        setTimeout(() => {
            window.location.href =
                `listing.html?id=${listing.id}`;
        }, 800);

    } catch (error) {

        console.error("ADD LISTING ERROR:", error);

        message.textContent =
            error.message || "حدث خطأ أثناء نشر الإعلان.";

        publishButton.disabled = false;
    }
});
