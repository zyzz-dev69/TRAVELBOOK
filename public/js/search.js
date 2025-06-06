let searchInput = document.querySelectorAll('.search');
let searchResult = document.querySelectorAll('.searchResult');
searchResult.forEach((res) => res.style.visibility = 'hidden');
searchInput.forEach((input) => input.addEventListener('blur', async () => {
    searchResult.forEach((res) => res.style.visibility = 'hidden');
    // searchResult.forEach((res) => res.innerHTML = "");
}));
searchInput.forEach((input) => input.addEventListener("input", async () => {
    searchResult.forEach((res) => res.style.visibility = 'visible');
    const query = input.value.trim();
    if (query.length === 0) return searchResult.forEach((res) => res.innerHTML = "");

    const res = await fetch(`/searchTitles?q=${query}`);
    const titles = await res.json();
    console.log(titles)
    if (titles.length == 0) {
        console.log("yes")
        return searchResult.forEach((res) => res.innerHTML = `<p style="color:red;margin-top:1rem; width:18rem">No Listing Found!</p>`);
    }
    searchResult.forEach((res) => res.innerHTML = titles.map((t) => `<a href="/listings/${t._id}">${t.title}</a>`).join(""));
}));

let clicked = document.getElementById('clickToHideNavItems');
clicked.addEventListener('click', () => {
    console.log("hey")
    let items = document.querySelectorAll('.hiddenBySearch');
    items.forEach((item) => item.classList.toggle('displayNone'));
    let searchSmall = document.getElementById('searchSmall');
    // if(searchSmall.type === 'hidden'){
    //     searchSmall.type = 'text';
    // }else searchSmall.type = 'hidden';

    searchSmall.type === 'hidden' ? searchSmall.type = 'text' : searchSmall.type = 'hidden';

    clicked.classList.toggle('fa-search');
    clicked.classList.toggle('fa-close');
    // searchResult.forEach((res) => res.innerHTML = "")
    // clicked.addEventListener('click', () => {
    //     let items = document.querySelectorAll('.hiddenBySearch');
    //     items.forEach((item) => item.classList.toggle('displayNone'));
    //     document.getElementById('searchSmall').type = 'hidden';

    //     clicked.classList.remove('fa-close');
    //     clicked.classList.add('fa-search');
    // })
})