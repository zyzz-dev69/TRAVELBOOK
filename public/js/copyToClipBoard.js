function copyToClipBoard() {
    // Get the text field
    let inputText = document.getElementById('clickToCopy');

    // Select the text field
    inputText.select();
    inputText.setSelectionRange(0, 99999); // For mobile devices

    // Copy the text inside the text field
    navigator.clipboard.writeText(inputText.value);

    // Alert the copied text
    alert("Copied the text: " + inputText.value);
}