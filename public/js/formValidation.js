document.querySelector("form").addEventListener('submit', function (e) {
    const fileInput = document.getElementById('img');
    const file = fileInput.files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            e.preventDefault();
            alert("Only jpeg, png and jpeg files are allowed!");
        };
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            e.preventDefault();
            alert("Max 2MB file size!");
        }
    };
    const priceInput = document.getElementById('price');
    if (priceInput.value < 99) {
        e.preventDefault();
        console.log(priceInput.value)
        alert("Price for listing must be atleast 100PKR.");
    }
});

//Password Show/Hide Toggle 
let input = document.getElementById('pwd');
let eyeIcon = document.getElementById('eyeIcon');
eyeIcon.addEventListener("click", () => {
    // input.type = input.type === 'password'
    //     ? 'text' | eyeIcon.classList.remove('fa-eye') | eyeIcon.classList.add('fa-eye-slash')
    //     : 'password' | eyeIcon.classList.remove('fa-eye-slash') | eyeIcon.classList.add('fa-eye');
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
});

eyeIcon.removeClassList('fa-eye') || eyeIcon.addClassList('fa-eye-lash');
eyeIcon.removeClassList('fa-eye-lash') || eyeIcon.addClassList('fa-eye');