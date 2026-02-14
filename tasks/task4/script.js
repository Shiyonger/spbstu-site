// -             --Баа - 2f - аа - --    Ffff - Ва - 5 - dd - k6-**-1 - ау - Аааа - 3 - hh - Ббб - 4

const ui = {
    input: document.getElementById('sourceText'),
    button: document.getElementById('parseButton'),
    top: document.getElementById('zoneTop'),
    left: document.getElementById('zoneLeft'),
    output: document.getElementById('resultWords'),
    template: document.getElementById('chipTpl')
};

ui.button.addEventListener('click', parseInput);

['top', 'left'].forEach(zone => {
    ui[zone].addEventListener('dragover', allowDrop);
    ui[zone].addEventListener('dragenter', highlightZone);
    ui[zone].addEventListener('dragleave', unhighlightZone);
    ui[zone].addEventListener('drop', dropChip);
});

function parseInput() {
    clearAll();

    const raw = ui.input.value;
    if (!raw) return;

    const parts = raw.split('-').map(x => x.trim()).filter(Boolean);

    const lower = [];
    const upper = [];
    const nums = [];

    const symbols = ['@', '*'];

    parts.forEach(p => {
        let flag = true;
        for (let i = 0; i < symbols.length; i++) {
            if (symbols[i] === p)
                flag = false;
        };
        if (flag) {
            if (!isNaN(p)) nums.push(+p);
            else if (p[0] === p[0].toUpperCase()) upper.push(p);
            else lower.push(p);
        };
    });

    lower.sort();
    upper.sort();
    nums.sort((a, b) => a - b);

    let order = 0;
    const data = [];

    lower.forEach((v, i) => data.push(makeItem('a', i, v)));
    upper.forEach((v, i) => data.push(makeItem('b', i, v)));
    nums.forEach((v, i) => data.push(makeItem('n', i, String(v))));

    data.forEach(d => ui.top.appendChild(buildChip(d)));

    function makeItem(prefix, i, value) {
        return { key: prefix + (i + 1), value, order: order++ };
    }
}

function buildChip(info) {
    const el = ui.template.content.firstElementChild.cloneNode(true);

    el.dataset.id = info.key;
    el.dataset.order = info.order;
    el.dataset.zone = 'top';
    el.dataset.value = info.value;

    el.style.background = 'lightgrey';
    el.style.color = 'black';

    el.querySelector('.chip-key').textContent = info.key;
    el.querySelector('.chip-value').textContent = info.value;

    el.addEventListener('dragstart', startDrag);
    el.addEventListener('dragend', endDrag);
    el.addEventListener('click', chipClick);

    return el;
}

function clearAll() {
    ui.top.innerHTML = '';
    ui.left.innerHTML = '';
    ui.output.innerHTML = '';
}

/* Drag & Drop */

function startDrag(e) {
    e.dataTransfer.setData('id', e.target.dataset.id);
}

function endDrag() {
    ui.top.classList.remove('drag-over');
    ui.left.classList.remove('drag-over');
}

function allowDrop(e) {
    e.preventDefault();
}

function highlightZone(e) {
    e.currentTarget.classList.add('drag-over');
}

function unhighlightZone(e) {
    e.currentTarget.classList.remove('drag-over');
}

function dropChip(e) {
    e.preventDefault();

    const id = e.dataTransfer.getData('id');
    const chip = document.querySelector(`.chip[data-id="${id}"]`);
    if (!chip) return;

    const zone = e.currentTarget;
    zone.classList.remove('drag-over');

    if (zone === ui.left) {
        placeOnLeft(chip, e);
    } else {
        restoreToTop(chip);
    }
}

function placeOnLeft(chip, e) {
    ui.left.appendChild(chip);
    chip.dataset.zone = 'left';

    const rect = ui.left.getBoundingClientRect();
    chip.style.left = Math.max(10, e.clientX - rect.left - 50) + 'px';
    chip.style.top = Math.max(10, e.clientY - rect.top - 20) + 'px';
    chip.style.position = 'absolute';

    const palette = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink'];
    chip.style.background = palette[Math.floor(Math.random() * palette.length)];
}

function restoreToTop(chip) {
    chip.style.position = '';
    chip.style.left = '';
    chip.style.top = '';
    chip.style.background = 'lightgrey';
    chip.style.color = 'black';
    chip.dataset.zone = 'top';

    const order = +chip.dataset.order;
    const children = [...ui.top.children];

    const before = children.find(c => +c.dataset.order > order);
    before ? ui.top.insertBefore(chip, before) : ui.top.appendChild(chip);
}

/* Click */

function chipClick(e) {
    const chip = e.currentTarget;
    if (chip.dataset.zone !== 'left') return;

    const word = document.createElement('div');
    word.className = 'word-item';
    word.textContent = chip.dataset.value;
    word.style.color = chip.style.background;

    ui.output.appendChild(word);
}

clearAll();