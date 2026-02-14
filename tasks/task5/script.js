function createNumbers(clock) {
    const numbers = clock.querySelector(".numbers");
    const radius = 90;
    const center = 100;

    for (let i = 1; i <= 12; i++) {

        const angle = (i * 30 - 90) * Math.PI / 180;

        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        const number = document.createElement("span");

        number.textContent = i;
        number.style.left = x + "px";
        number.style.top = y + "px";

        numbers.appendChild(number);
    }
}


function rotateHand(hand, hour) {
    const angle = hour * 30;

    hand.style.transform =
        `translateX(-50%) translateY(-100%) rotate(${angle}deg)`;
}


function getAngle(clock, mouseX, mouseY) {

    const rect = clock.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    let angle = Math.atan2(dy, dx) * 180 / Math.PI;

    angle += 90;

    if (angle < 0) angle += 360;

    return angle;
}


function angleToHour(angle) {

    let hour = Math.round(angle / 30);

    if (hour === 0) hour = 12;
    if (hour > 12) hour = 12;

    return hour;
}


const leftInput = document.getElementById("leftInput");
const leftHand = document.getElementById("leftHand");


leftInput.addEventListener("input", () => {

    let value = Number(leftInput.value);

    if (isNaN(value)) return;

    if (value < 0) value = 0;
    if (value > 24) value = 24;

    let hour = value % 12;

    if (hour === 0) hour = 12;

    rotateHand(leftHand, hour);
});


const rightClock = document.getElementById("rightClock");
const rightHand = document.getElementById("rightHand");
const rightOutput = document.getElementById("rightOutput");

let dragging = false;


rightHand.addEventListener("mousedown", () => {
    dragging = true;
});

document.addEventListener("mouseup", () => {
    dragging = false;
});


document.addEventListener("mousemove", (e) => {

    if (!dragging) return;

    const angle = getAngle(
        rightClock,
        e.clientX,
        e.clientY
    );

    const hour = angleToHour(angle);

    rotateHand(rightHand, hour);

    rightOutput.value = hour;
});


document.querySelectorAll(".clock").forEach(clock => {
    createNumbers(clock);
});

rotateHand(leftHand, 12);
rotateHand(rightHand, 12);

rightOutput.value = 12;
