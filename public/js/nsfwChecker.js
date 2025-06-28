let fileElem = document.getElementById("img");
let fileList = document.getElementById("fileList");

//EVENT FOR IMAGE UPLOAD
fileElem.addEventListener("change", handleFiles, false);

function handleFiles() {
    fileList.textContent = "";
    const list = document.createElement("div");
    fileList.appendChild(list);
    for (const file of this.files) {
        const div = document.createElement("div");
        div.classList.add("preImg")
        list.appendChild(div);

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        div.appendChild(img);
    }
};