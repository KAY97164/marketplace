const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const message = document.getElementById("message");
const signupMessage = document.getElementById("signupMessage");


// تسجيل الدخول
loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "جاري تسجيل الدخول...";

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        message.textContent = "فشل تسجيل الدخول: " + error.message;
        return;
    }

    message.textContent = "تم تسجيل الدخول بنجاح! 🎉";

    setTimeout(function () {
        window.location.href = "index.html";
    }, 1000);

});


// إنشاء حساب
signupForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    signupMessage.textContent = "جاري إنشاء الحساب...";

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        signupMessage.textContent =
            "فشل إنشاء الحساب: " + error.message;
        return;
    }

    signupMessage.textContent =
        "تم إنشاء الحساب بنجاح! 🎉";

});
