import { supabase } from "./supabase.js";

const form = document.getElementById("addForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    message.textContent = "جاري نشر الإعلان...";

    try {
        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error("يجب تسجيل الدخول أولًا.");
        }

        const type = document.getElementById("type").value;
        const title = document.getElementById("title").value.trim();
        const price = Number(document.getElementById("price").value);
        const currency = document.getElementById("currency").value;
        const country = document.getElementById("country").value.trim();
        const city = document.getElementById("city").value.trim();
        const description = document.getElementById("description").value.trim();
        const imageInput = document.getElementById("images");

        if (!title) throw new Error("اكتبي عنوان الإعلان.");
        if (!Number.isFinite(price) || price < 0) {
            throw new Error("السعر غير صحيح.");
        }

        const { data: listing, error: insertError } = await supabase
            .from("listings")
            .insert({
                title,
                type,
                price,
                currency,
                country: country || "Morocco",
                city,
                description,
                user_id: user.id,
                image_urls: []
            })
            .select()
            .single();

        if (insertError) {
            throw new Error("خطأ حفظ الإعلان: " + insertError.message);
        }

        const imageUrls = [];

        if (imageInput && imageInput.files.length > 0) {
            for (const file of imageInput.files) {
                const extension = file.name.split(".").pop();
                const fileName =
                    `${user.id}/${listing.id}-${Date.now()}-${Math.random()
                        .toString(36)
                        .substring(2)}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from("listing-images")
                    .upload(fileName, file);

                if (uploadError) {
                    console.error("Image upload error:", uploadError);
                    continue;
                }

                const { data: publicUrl } = supabase.storage
                    .from("listing-images")
                    .getPublicUrl(fileName);

                if (publicUrl?.publicUrl) {
                    imageUrls.push(publicUrl.publicUrl);
                }
            }
        }

        if (imageUrls.length > 0) {
            const { error: updateError } = await supabase
                .from("listings")
                .update({
                    image_urls: imageUrls
                })
                .eq("id", listing.id)
                .eq("user_id", user.id);

            if (updateError) {
                console.error("Image URL update error:", updateError);
            }
        }

        message.textContent = "تم نشر الإعلان بنجاح ✅";

        setTimeout(() => {
            window.location.href = `listing.html?id=${listing.id}`;
        }, 800);

    } catch (error) {
        console.error(error);
        message.textContent = error.message || "حدث خطأ أثناء نشر الإعلان.";
    }
});
