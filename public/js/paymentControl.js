let duration = document.getElementById('duration');
let cost = document.getElementById('paymentAmount');
const initialCost = cost.value;
duration.addEventListener("input", () => {
    let totalCost = initialCost * duration.value;
    cost.setAttribute('value', totalCost);
});
