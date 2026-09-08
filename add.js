const form = document.getElementById("listingForm");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const type = document.getElementById("type").value;
    const title = document.getElementById("title").value;
    const price = document.getElementById("price").value;
    const city = document.getElementById("city").value;
    const description = document.getElementById("description").value;
    const images = document.getElementById("images").files;

    if (images.length === 0) {
        alert("يرجى اختيار صورة واحدة على الأقل");
        return;
    }

    let imageNames = "";

    for (let i = 0; i < images.length; i++) {
        imageNames += "\n- " + images[i].name;
    }

    alert(
        "تم إنشاء الإعلان بنجاح! 🎉\n\n" +
        "النوع: " + type +
        "\nالاسم: " + title +
        "\nالسعر: " + price + " درهم" +
        "\nالمدينة: " + city +
        "\nالوصف: " + description +
        "\n\nالصور:" + imageNames
    );

    form.reset();
});
