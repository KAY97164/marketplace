const form = document.getElementById("listingForm");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const type = document.getElementById("type").value;
    const title = document.getElementById("title").value;
    const price = document.getElementById("price").value;
    const city = document.getElementById("city").value;
    const description = document.getElementById("description").value;

    alert(
        "تم إنشاء الإعلان بنجاح!\n\n" +
        "النوع: " + type +
        "\nالاسم: " + title +
        "\nالسعر: " + price + " درهم" +
        "\nالمدينة: " + city +
        "\nالوصف: " + description
    );

    form.reset();
});
