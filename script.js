const searchInput = document.querySelector(".search input");
const searchButton = document.querySelector(".search button");

searchButton.addEventListener("click", function () {

    const searchText = searchInput.value.trim();

    if (searchText === "") {
        alert("اكتبي شيئًا للبحث عنه");
    } else {
        alert("أنت تبحثين عن: " + searchText);
    }

});
