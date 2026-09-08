const form = document.getElementById("listingForm");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const type = document.getElementById("type").value;
    const title = document.getElementById("title").value.trim();
    const price = document.getElementById("price").value;
    const city = document.getElementById("city").value.trim();
    const description = document.getElementById("description").value.trim();
    const images = document.getElementById("images").files;

    if (images.length === 0) {
        alert("يرجى اختيار صورة واحدة على الأقل");
        return;
    }

    // معرفة المستخدم الحالي
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

        // 1. إنشاء الإعلان في قاعدة البيانات أولًا
        const {
            data: listing,
            error: listingError
        } = await supabase
            .from("listings")
            .insert({
                title: title,
                type: type,
                price: price,
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

        // 2. رفع الصور
        for (let i = 0; i < images.length; i++) {

            const image = images[i];

            const fileName =
                user.id + "/" +
                listing.id + "/" +
                Date.now() + "-" +
                image.name;

            const {
                error: uploadError
            } = await supabase
                .storage
                .from("listing-images")
                .upload(fileName, image);

            if (uploadError) {
                throw uploadError;
            }

            // 3. الحصول على الرابط العام للصورة
            const {
                data: publicUrlData
            } = supabase
                .storage
                .from("listing-images")
                .getPublicUrl(fileName);

            imageUrls.push(publicUrlData.publicUrl);
        }

        // 4. حفظ روابط الصور داخل الإعلان
        const {
            error: updateError
        } = await supabase
            .from("listings")
            .update({
                image_urls: imageUrls
            })
            .eq("id", listing.id);

        if (updateError) {
            throw updateError;
        }

        alert("تم نشر الإعلان بنجاح! 🎉");

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
