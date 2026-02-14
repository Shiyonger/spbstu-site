const PLAYER_KEY = 'kukly_player';
const SCORES_KEY = 'kukly_scores';

const STATE = {
  player: null,
  level: 1,
  score: 0,
  timer: 60,
  task: null,
  dolls: [],
  clothes: [],
  running: false,
  intervalId: null,
  level3Stage: 1,
  level3CaughtClothes: [],
  level3TotalClothes: 0,
  basketPosition: 0
};

const DOLLS = [
  { id: 'd1', file: 'assets/doll2.png', name: 'Кукла 1' },
  { id: 'd2', file: 'assets/doll2.png', name: 'Кукла 2' },
  { id: 'd3', file: 'assets/doll2.png', name: 'Кукла 3' }
];

const CLOTHES = [
  // Зима
  {id:'c1',file:'assets/clothes/winter_blue_outer.png',type:'outer',season:'winter',color:'blue',style:'classic',top:'13%',left:'24.5%',width:'50%',height:'45%'},
  {id:'c2',file:'assets/clothes/winter_brown_hat.png',type:'hat',season:'winter',color:'red',style:'casual',top:'-1%',left:'-1.5%',width:'100%',height:'20%'},
  {id:'c3',file:'assets/clothes/blue_bottom.png',type:'bottom',season:'winter',color:'blue',style:'casual',top:'37%',left:'0.5%',width:'100%',height:'50%'},
  {id:'c4',file:'assets/clothes/winter_top_blue.png',type:'top',season:'winter',color:'blue',style:'classic',top:'20%',left:'0',width:'100%',height:'27%'},
  {id:'c6',file:'assets/clothes/winter_top_green.png',type:'top',season:'winter',color:'green',style:'classic',top:'22%',left:'0',width:'100%',height:'27%'},
  {id:'c7',file:'assets/clothes/winter_top_red.png',type:'top',season:'winter',color:'red',style:'classic',top:'22%',left:'0',width:'100%',height:'27%'},
  {id:'c5',file:'assets/clothes/winter_brown_shoes.png',type:'shoes',season:'winter',color:'brown',style:'sport',top:'70%',left:'1%',width:'100%',height:'26%'},
  // {id:'c6',file:'assets/skirt.png',type:'hat',season:'winter',color:'green',style:'casual'},
  // {id:'c7',file:'assets/skirt.png',type:'outer',season:'winter',color:'yellow',style:'classic'},
  // {id:'c8',file:'assets/skirt.png',type:'bottom',season:'winter',color:'purple',style:'casual'},
  // {id:'c25',file:'assets/skirt.png',type:'hat',season:'winter',color:'brown',style:'casual'},
  // {id:'c26',file:'assets/skirt.png',type:'top',season:'winter',color:'brown',style:'classic'},
  // {id:'c27',file:'assets/skirt.png',type:'bottom',season:'winter',color:'brown',style:'casual'},
  // {id:'c28',file:'assets/skirt.png',type:'shoes',season:'winter',color:'brown',style:'sport'},
  // {id:'c29',file:'assets/skirt.png',type:'outer',season:'winter',color:'brown',style:'classic'},
  
  // Лето
  {id:'c9',file:'assets/clothes/summer_blue_hat.png',type:'hat',season:'summer',color:'blue',style:'classic',top:'1%',left:'-0.5%',width:'100%',height:'12%'},
  {id:'c10',file:'assets/clothes/summer_purple_top_3.png',type:'top',season:'summer',color:'purple',style:'sport',top:'22%',left:'-0.5%',width:'100%',height:'29%'},
  {id:'c11',file:'assets/clothes/summer_blue_bottom_2.png',type:'bottom',season:'summer',color:'blue',style:'casual',top:'38%',left:'34.5%',width:'30%',height:'30%'},
  {id:'c12',file:'assets/skirt.png',type:'bottom',season:'summer',color:'green',style:'casual',top:'30%',left:'29.5%',width:'40%',height:'30%'},
  {id:'c13',file:'assets/clothes/summer_pink_shoes.png',type:'shoes',season:'summer',color:'brown',style:'casual',top:'84%',left:'36%',width:'30%',height:'13%'},
];

function $(sel) { return document.querySelector(sel) }
function $all(sel){ return Array.from(document.querySelectorAll(sel)) }
function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function formatTime(s){ const m = Math.floor(s/60); const ss = s%60; return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}` }

const splash = $('#splash');
const game = $('#game');
const scoreboard = $('#scoreboard');

const playerNameInput = $('#playerName');
const startBtn = $('#startBtn');
const scoreBtn = $('#scoreBtn');
const nameDisplay = $('#nameDisplay');
const levelDisplay = $('#levelDisplay');
const timerDisplay = $('#timerDisplay');
const scoreDisplay = $('#scoreDisplay');
const taskText = $('#taskText');
const dollsArea = $('#dollsArea');
const clothesArea = $('#clothesArea');
const restartLevelBtn = $('#restartLevel');
const savePNGBtn = $('#savePNG');
const quitToMenuBtn = $('#quitToMenu');
const scoresList = $('#scoresList');
const backToMenu = $('#backToMenu');
const clearScores = $('#clearScores');

function init(){
  const stored = localStorage.getItem(PLAYER_KEY);
  if(stored){ playerNameInput.value = stored }
  attachHandlers();
  renderScores();
}
init();

startBtn.addEventListener('click', ()=>{
  const name = playerNameInput.value.trim() || 'Игрок';
  STATE.player = name;
  localStorage.setItem(PLAYER_KEY, name);
  startGame();
});
scoreBtn.addEventListener('click', ()=> showScreen('scoreboard'));

restartLevelBtn.addEventListener('click', ()=> {
  finishLevel(false);
});
quitToMenuBtn.addEventListener('click', ()=> {
  stopTimer();
  showScreen('splash');
});

backToMenu.addEventListener('click', ()=> showScreen('splash'));
clearScores.addEventListener('click', ()=> { localStorage.removeItem(SCORES_KEY); renderScores(); });

savePNGBtn.addEventListener('click', saveCompositionAsPNG);

clothesArea.addEventListener('contextmenu', (e)=>{
  e.preventDefault();
  const target = e.target.closest('.cloth');
  if(!target) return;
  const id = target.dataset.id;
  showContextMenu(e.pageX, e.pageY, id);
});

dollsArea.addEventListener('dblclick', (e)=>{
  if(STATE.level !== 2) return;
  
  let clothImg = e.target.closest('img[data-cloth-id]');
  let doll = null;
  let clothToRemove = null;
  
  if(clothImg) {
    const clothId = clothImg.dataset.clothId;
    const dollEl = clothImg.closest('.doll');
    if(dollEl) {
      doll = STATE.dolls.find(x=>x.el===dollEl);
      if(doll) {
        const wornIndex = doll.worn.findIndex(w => w.id === clothId);
        if(wornIndex >= 0) {
          clothToRemove = doll.worn[wornIndex];
        }
      }
    }
  } else {
    const target = e.target.closest('.doll');
    if(target) {
      doll = STATE.dolls.find(x=>x.el===target);
      if(doll && doll.worn.length) {
        clothToRemove = doll.worn[doll.worn.length - 1];
      }
    }
  }
  
  if(doll && clothToRemove) {
    const removeIndex = doll.worn.indexOf(clothToRemove);
    if(removeIndex >= 0) {
      doll.worn.splice(removeIndex, 1);
      redrawDollClothes(doll);
      
      const layerForType = (type) => {
        if(type === 'hat') return doll.el.querySelector('[data-layer="hat"]');
        if(type === 'top' || type === 'outer' || type === 'dress') return doll.el.querySelector('[data-layer="top"]');
        if(type === 'bottom') return doll.el.querySelector('[data-layer="bottom"]');
        if(type === 'shoes') return doll.el.querySelector('[data-layer="shoes"]');
        return null;
      };
      
      const targetLayer = layerForType(clothToRemove.type);
      
      if(targetLayer) {
        const layerRect = targetLayer.getBoundingClientRect();
        const clothesAreaRect = clothesArea.getBoundingClientRect();
        
        const clone = document.createElement('img');
        clone.src = clothToRemove.file || 'assets/skirt.png';
        clone.style.position = 'fixed';
        clone.style.left = layerRect.left + layerRect.width / 2 + 'px';
        clone.style.top = layerRect.top + layerRect.height / 2 + 'px';
        clone.style.width = layerRect.width + 'px';
        clone.style.height = layerRect.height + 'px';
        clone.style.zIndex = '10000';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'none';
        clone.style.transform = 'translate(-50%, -50%)';
        clone.style.objectFit = 'contain';
        document.body.appendChild(clone);
        
        requestAnimationFrame(() => {
          clone.style.transition = 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          clone.style.left = (clothesAreaRect.left + clothesAreaRect.width / 2) + 'px';
          clone.style.top = (clothesAreaRect.top + clothesAreaRect.height / 2) + 'px';
          clone.style.transform = 'translate(-50%, -50%) scale(0.3) rotate(-180deg)';
          clone.style.opacity = '0';
          
          setTimeout(() => {
            clone.remove();
            addClothToInventory(clothToRemove);
            showFeedback('ok', 'Одежда снята');
          }, 900);
        });
      } else {
        addClothToInventory(clothToRemove);
        showFeedback('ok', 'Одежда снята');
      }
    }
  }
});

function showScreen(name){
  $all('.screen').forEach(s=>s.classList.remove('active'));
  if(name==='splash') splash.classList.add('active');
  if(name==='game') game.classList.add('active');
  if(name==='scoreboard') scoreboard.classList.add('active');
}

function startGame(){
  STATE.level = 1;
  STATE.score = 0;
  showScreen('game');
  nameDisplay.textContent = STATE.player;
  nextLevel();
}

function nextLevel(){
  if(STATE.level>3){
    finishGame();
    return;
  }
  setupLevel(STATE.level);
}

function setupLevel(level){
  disableFallingClothes();
  disableKeyboardControls();
  
  STATE.clothes = CLOTHES.map(c=>Object.assign({}, c));
  STATE.dolls = [];
  STATE.running = true;
  stopTimer();
  STATE.level3Stage = 1;
  STATE.level3CaughtClothes = [];
  STATE.level3TotalClothes = 0;
  STATE.basketPosition = 50;
  
  dollsArea.innerHTML = '';
  clothesArea.innerHTML = '';
  
  const basket = document.querySelector('.basket');
  if(basket) basket.remove();

  showLevelDescription(level);
  
  if(level===1){
    STATE.timer = 90;
    generateTask({seasonOnly:true});
    renderDolls(1);
    renderClothes(8, false, true);
    enableDragAndDrop();
  } else if(level===2){
    STATE.timer = 60;
    generateTask({seasonColor:true});
    renderDolls(2);
    
    let selectedClothes = [];
    const selectedIds = new Set();
    const types = ['hat', 'top', 'bottom', 'shoes'];
    
    types.forEach(type => {
      if(STATE.task && STATE.task.parts && STATE.task.parts[0]) {
        const taskPart = STATE.task.parts[0];
        console.log(taskPart);
        const clothesOfType = CLOTHES.filter(c => 
          c.season === taskPart.season && 
          c.color === taskPart.color && 
          (type === 'top' ? (c.type === 'top' || c.type === 'outer' || c.type === 'dress') : c.type === type) &&
          !selectedIds.has(c.id)
        );
        clothesOfType.forEach(c => console.log(c));
        
        const count = Math.random() < 0.5 ? 1 : 2;
        const toAdd = clothesOfType.slice(0, Math.min(count, clothesOfType.length));
        toAdd.forEach(cloth => {
          selectedClothes.push(cloth);
          selectedIds.add(cloth.id);
        });
      }
      
      if(STATE.task && STATE.task.parts && STATE.task.parts[1]) {
        const taskPart = STATE.task.parts[1];
        console.log(taskPart);
        const clothesOfType = CLOTHES.filter(c => 
          c.season === taskPart.season && 
          c.color === taskPart.color && 
          (type === 'top' ? (c.type === 'top' || c.type === 'outer' || c.type === 'dress') : c.type === type) &&
          !selectedIds.has(c.id)
        );
        
        const count = Math.random() < 0.5 ? 1 : 2;
        const toAdd = clothesOfType.slice(0, Math.min(count, clothesOfType.length));
        toAdd.forEach(cloth => {
          selectedClothes.push(cloth);
          selectedIds.add(cloth.id);
        });
      }
    });
    
    console.log(selectedClothes.length);
    selectedClothes.forEach(c => console.log(c));
    const remainingClothes = CLOTHES.filter(c => !selectedIds.has(c.id));
    const needed = Math.max(0, 16 - selectedClothes.length);
    const shuffled = remainingClothes.sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, needed);
    toAdd.forEach(cloth => {
      selectedClothes.push(cloth);
      selectedIds.add(cloth.id);
    });
    
    STATE.dolls.forEach((doll, dollIdx) => {
      if(STATE.task && STATE.task.parts && STATE.task.parts[dollIdx]) {
        const clothesToWear = [];
        const clothesByType = {
          'hat': selectedClothes.filter(c => c.type === 'hat'),
          'top': selectedClothes.filter(c => c.type === 'top' || c.type === 'outer' || c.type === 'dress'),
          'bottom': selectedClothes.filter(c => c.type === 'bottom'),
          'shoes': selectedClothes.filter(c => c.type === 'shoes')
        };
        
        Object.keys(clothesByType).forEach(typeKey => {
          if(clothesByType[typeKey].length > 0 && Math.random() < 0.7) {
            const cloth = clothesByType[typeKey][Math.floor(Math.random() * clothesByType[typeKey].length)];
            if(!clothesToWear.find(w => w.id === cloth.id)) {
              clothesToWear.push(Object.assign({}, cloth));
              selectedClothes = selectedClothes.filter(c => c.id !== cloth.id);
            }
          }
        });
        
        doll.worn = clothesToWear;
      }
    });
    
    STATE.clothes = selectedClothes.sort(() => Math.random() - 0.5);
    renderClothes(Math.min(16, selectedClothes.length));
    
    STATE.dolls.forEach((doll) => {
      redrawDollClothes(doll);
    });
    
    enableDoubleClickAndContext();
    enableAnimationsForClothes();
  } else if(level===3){
    STATE.level3Stage = 1;
    STATE.level3CaughtClothes = [];
    STATE.level3TotalClothes = 15;
    STATE.timer = 120;
    generateTask({multiDoll:true});
    renderDolls(0);
    renderClothes(0);
    
    dollsArea.style.minHeight = '600px';
    
    const counter = document.createElement('div');
    counter.id = 'level3-counter-permanent';
    counter.style.position = 'absolute';
    counter.style.top = '20px';
    counter.style.right = '20px';
    counter.style.background = 'rgba(107, 91, 149, 0.95)';
    counter.style.color = '#ffd700';
    counter.style.padding = '12px 18px';
    counter.style.borderRadius = '10px';
    counter.style.zIndex = '1001';
    counter.style.fontSize = '18px';
    counter.style.fontWeight = 'bold';
    counter.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    counter.innerHTML = 'Поймано: 0/15';
    dollsArea.appendChild(counter);
    
    const instruction = document.createElement('div');
    instruction.id = 'level3-instruction';
    instruction.style.position = 'absolute';
    instruction.style.top = '20px';
    instruction.style.left = '50%';
    instruction.style.transform = 'translateX(-50%)';
    instruction.style.background = 'rgba(107, 91, 149, 0.95)';
    instruction.style.color = 'white';
    instruction.style.padding = '15px 20px';
    instruction.style.borderRadius = '10px';
    instruction.style.zIndex = '1000';
    instruction.style.textAlign = 'center';
    instruction.style.fontSize = '16px';
    instruction.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    instruction.style.transition = 'opacity 0.5s ease-out';
    instruction.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px;">Этап 1: Ловля одежды</div>
      <div style="font-size:14px;">Используйте стрелки ← → для управления корзинкой</div>
      <div style="font-size:14px;margin-top:5px;">Поймайте ровно 15 предметов одежды!</div>
    `;
    dollsArea.appendChild(instruction);
    
    setTimeout(() => {
      if(instruction && instruction.parentNode) {
        instruction.style.opacity = '0';
        instruction.style.pointerEvents = 'none';
        setTimeout(() => {
          if(instruction && instruction.parentNode) {
            instruction.remove();
          }
        }, 500);
      }
    }, 10000);
    
    STATE.basketPosition = 50;
    renderBasket();
  }

  updateUI();
  levelDisplay.textContent = STATE.level;
  
  showLevelDescription(level);
}

function generateTask(opts={}){
  const seasons = ['winter','summer'];
  const colors = ['red','blue','green','purple','brown'];
  const styles = ['classic','casual','sport'];
  if(opts.seasonOnly){
    const s = randChoice(seasons);
    STATE.task = { type:'season', season:s, text:`Одень куклу для ${s}` };
  } else if(opts.seasonColor){
    const s1 = randChoice(seasons);
    const c1 = randChoice(colors);
    const s2 = randChoice(seasons);
    const c2 = randChoice(colors);
    STATE.task = { 
      type:'seasonColor', 
      season:s1, 
      color:c1, 
      text:`Кукла 1: ${s1} ${c1} | Кукла 2: ${s2} ${c2}`,
      parts: [{season:s1, color:c1}, {season:s2, color:c2}]
    };
  } else if(opts.multiDoll){
    const t1 = randChoice(seasons);
    const c1 = randChoice(colors);
    const t2 = randChoice(seasons);
    const c2 = randChoice(colors);
    const t3 = randChoice(seasons);
    const c3 = randChoice(colors);
    STATE.task = { 
      type:'multi', 
      parts:[
        {season:t1,color:c1},
        {season:t2,color:c2},
        {season:t3,color:c3}
      ], 
      text:`Три куклы: 1) ${t1} ${c1}  2) ${t2} ${c2}  3) ${t3} ${c3}` 
    };
  }
  taskText.textContent = STATE.task.text;
}

function getNeededClothesForLevel3(){
  if(!STATE.task || STATE.task.type !== 'multi') return [];
  const needed = [];
  STATE.task.parts.forEach((part, dollIndex) => {
    const matching = CLOTHES.filter(c => c.season === part.season && c.color === part.color);
    matching.forEach(cloth => {
      needed.push({
        ...cloth,
        targetDollIndex: dollIndex,
        targetSeason: part.season,
        targetColor: part.color
      });
    });
  });
  return needed;
}

function getTargetDollIndexForCloth(season, color){
  if(!STATE.task || STATE.task.type !== 'multi') return 0;
  const dollIndex = STATE.task.parts.findIndex(part => part.season === season && part.color === color);
  return dollIndex >= 0 ? dollIndex : 0;
}

function renderDolls(count=1){
  dollsArea.innerHTML = '';
  STATE.dolls = [];
  for(let i=0;i<count;i++){
    const d = DOLLS[i % DOLLS.length];
    const wrapper = document.createElement('div');
    wrapper.className = 'doll';
    wrapper.dataset.slot = `doll-${i}`;
    wrapper.dataset.dollIndex = i;
    
    let taskHint = '';
    if(STATE.level === 3 && STATE.task && STATE.task.type === 'multi' && STATE.task.parts[i]) {
      const part = STATE.task.parts[i];
      taskHint = `<div class="doll-task-hint" style="position:absolute;top:4px;left:50%;transform:translateX(-50%);background:rgba(107,91,149,0.9);color:white;padding:5px 10px;border-radius:5px;font-size:12px;white-space:nowrap;z-index:1000;">Кукла ${i+1}: ${part.season} ${part.color}</div>`;
    } else if(STATE.level === 2 && STATE.task && STATE.task.parts && STATE.task.parts[i]) {
      const part = STATE.task.parts[i];
      taskHint = `<div class="doll-task-hint" style="position:absolute;top:4px;left:50%;transform:translateX(-50%);background:rgba(107,91,149,0.9);color:white;padding:5px 10px;border-radius:5px;font-size:12px;white-space:nowrap;z-index:1000;">Кукла ${i+1}: ${part.season} ${part.color}</div>`;
    }
    
    wrapper.innerHTML = `
      ${taskHint}
      <img src="${d.file}" alt="${d.name}" style="max-width:90%;max-height:90%;opacity:0.95" draggable="false" />
      <div class="layer" data-layer="clothes" style="pointer-events:auto;position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;cursor:pointer;"></div>
      <div class="layer" data-layer="hat" style="pointer-events:auto;position:absolute;top:0;left:0;width:100%;height:30%;z-index:11;cursor:pointer;"></div>
      <div class="layer" data-layer="top" style="pointer-events:auto;position:absolute;top:20%;left:0;width:100%;height:50%;z-index:13;cursor:pointer;"></div>
      <div class="layer" data-layer="bottom" style="pointer-events:auto;position:absolute;top:50%;left:0;width:100%;height:30%;z-index:12;cursor:pointer;"></div>
      <div class="layer" data-layer="shoes" style="pointer-events:auto;position:absolute;bottom:0;left:0;width:100%;height:25%;z-index:15;cursor:pointer;"></div>
    `;
    wrapper.addEventListener('dragover', (e)=>e.preventDefault());
    wrapper.addEventListener('drop', (e)=>{
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      wearCloth(id, wrapper);
    });
    dollsArea.appendChild(wrapper);
    STATE.dolls.push({id:d.id, el:wrapper, worn:[], dollIndex: i, wornIds: new Set(), correctIds: new Set()});
  }
  dollsArea.style.justifyContent = count===1 ? 'center' : count===0 ? 'center' : 'space-around';
}

function renderClothes(count=6, randomize=false, ensureCorrect=false){
  clothesArea.innerHTML = '';
  let items = STATE.clothes.slice();
  
  if(ensureCorrect && STATE.task) {
    const correctClothes = CLOTHES.filter(c => {
      if(STATE.task.type === 'season') {
        return c.season === STATE.task.season;
      }
      return false;
    });
    items = correctClothes.slice();
    const wrongClothes = CLOTHES.filter(c => c.season !== STATE.task.season);
    const extraCount = Math.max(0, count - items.length);
    for(let i = 0; i < extraCount; i++) {
      items.push(wrongClothes[Math.floor(Math.random() * wrongClothes.length)]);
    }
    items = items.sort(() => Math.random() - 0.5).slice(0, count);
  } else if(randomize) {
    items = [];
    for(let i=0;i<count;i++){
      const c = CLOTHES[Math.floor(Math.random()*CLOTHES.length)];
      items.push(Object.assign({}, c, {instance: i}));
    }
  } else {
    items = items.slice(0,count);
  }

  items.forEach(it=>{
    const card = document.createElement('div');
    card.className = 'cloth';
    card.draggable = !(STATE.level === 3 && STATE.level3Stage === 1);
    card.dataset.id = it.id;
    card.innerHTML = `
      <div class="meta">
        <div>${it.type}</div>
        <div style="font-size:11px;color:#888">${it.season} • ${it.color}</div>
      </div>
    `;
    const img = document.createElement('img');
    img.src = it.file;
    img.alt = it.id;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.position = 'absolute';
    img.style.opacity = 0.12;
    img.style.pointerEvents = 'none';
    card.style.position = 'relative';
    card.appendChild(img);

    card.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', it.id);
      setTimeout(()=>card.classList.add('dragging'), 10);
    });
    card.addEventListener('dragend', ()=>card.classList.remove('dragging'));
    clothesArea.appendChild(card);
  });
  
  if(STATE.level === 1 || STATE.level === 2 || STATE.level === 3) {
    enableAnimationsForClothes();
  }
}

function enableDragAndDrop(){
  if(STATE.level === 3 && STATE.level3Stage === 1) {
    $all('.cloth').forEach(cloth => {
      cloth.draggable = false;
      cloth.style.cursor = 'not-allowed';
      cloth.style.opacity = '0.5';
    });
    return;
  }
  
  if(STATE.level === 1) {
    $all('.doll').forEach(d=>{
      const layer = d.querySelector('[data-layer="clothes"]');
      if(layer) {
        layer.addEventListener('click', ()=>{
          const doll = STATE.dolls.find(x=>x.el===d);
          if(!doll || !doll.worn.length) return;
          doll.worn.pop();
          redrawDollClothes(doll);
          applyPenalty('remove');
        });
      }
    });
  }
}

function enableDoubleClickAndContext(){
}

function showContextMenu(x,y,id){
  const menu = document.createElement('div');
  menu.style.position='fixed';menu.style.left=`${x}px`;menu.style.top=`${y}px`;
  menu.style.background='#fff';menu.style.border='1px solid #ddd';menu.style.padding='8px';menu.style.zIndex=9999;borderRadius='6px';
  menu.innerHTML = `<div class="menuItem" data-act="wear">Надеть</div><div class="menuItem" data-act="info">Инфо</div><div class="menuItem" data-act="remove">Удалить</div>`;
  document.body.appendChild(menu);
  const cleanup = ()=>{ menu.remove(); document.removeEventListener('click',cleanup) };
  menu.addEventListener('click', (e)=>{
    const act = e.target.dataset.act;
    if(act==='wear') wearCloth(id);
    if(act==='info') alert('Информация о вещи: ' + id);
    if(act==='remove') removeClothFromInventory(id);
    cleanup();
  });
  setTimeout(()=>document.addEventListener('click',cleanup),10);
}

function wearCloth(id, dollEl=null, instanceId=null){
  let cloth = null;
  if(STATE.level === 3 && STATE.level3CaughtClothes.length > 0) {
    if(instanceId) {
      cloth = STATE.level3CaughtClothes.find(c => c.instanceId === instanceId);
    } else {
      cloth = STATE.level3CaughtClothes.find(c => c.id === id);
    }
  }
  if(!cloth) {
    cloth = CLOTHES.find(c=>c.id===id);
  }
  if(!cloth) {
    console.warn('Cloth not found:', id);
    return;
  }
  
  let doll = null;
  if(dollEl) {
    doll = STATE.dolls.find(x=>x.el===dollEl);
  } else if(STATE.level === 3 && STATE.task && STATE.task.type === 'multi') {
    if(cloth.targetDollIndex !== undefined) {
      doll = STATE.dolls[cloth.targetDollIndex];
    } else {
      const dollIndex = STATE.dolls.findIndex((d, idx) => {
        const taskPart = STATE.task.parts[idx];
        return taskPart && cloth.season === taskPart.season && cloth.color === taskPart.color;
      });
      doll = dollIndex >= 0 ? STATE.dolls[dollIndex] : STATE.dolls[0];
    }
  } else {
    doll = dollEl ? STATE.dolls.find(x=>x.el===dollEl) : STATE.dolls[0];
  }
  
  if(!doll) {
    console.warn('Doll not found');
    return;
  }
  
  const hasSameType = doll.worn.some(wornCloth => {
    const compatibleTypes = {
      'top': ['top', 'outer', 'dress'],
      'outer': ['top', 'outer', 'dress'],
      'dress': ['top', 'outer', 'dress'],
      'bottom': ['bottom'],
      'hat': ['hat'],
      'shoes': ['shoes']
    };
    const wornType = wornCloth.type;
    const newType = cloth.type;
    if(compatibleTypes[wornType] && compatibleTypes[wornType].includes(newType)) {
      return true;
    }
    return wornType === newType;
  });
  
  if(hasSameType) {
    showFeedback('bad', 'Уже надета одежда этого типа!');
    return;
  }
  
  const clothCopy = Object.assign({}, cloth);
  
  const dollRect = doll.el.getBoundingClientRect();
  const clothCard = clothesArea.querySelector(`.cloth[data-id="${id}"]`);
  if(clothCard) {
    const cardRect = clothCard.getBoundingClientRect();
    animateClothToDoll(clothCard, dollRect, () => {
      doll.worn.push(clothCopy);
      redrawDollClothes(doll);
      const isCorrect = evaluateAttempt(clothCopy, doll);
      animateDollResult(doll.el, isCorrect);
    });
  } else {
    doll.worn.push(clothCopy);
    redrawDollClothes(doll);
    const isCorrect = evaluateAttempt(clothCopy, doll);
    animateDollResult(doll.el, isCorrect);
  }
  
  if(STATE.level === 1 || STATE.level === 2) {
    removeClothFromInventory(id);
  } else if(STATE.level === 3) {
    if(instanceId) {
      const index = STATE.level3CaughtClothes.findIndex(c => c.instanceId === instanceId);
      if(index >= 0) {
        STATE.level3CaughtClothes.splice(index, 1);
      }
    } else {
      const index = STATE.level3CaughtClothes.findIndex(c => c.id === id);
      if(index >= 0) {
        STATE.level3CaughtClothes.splice(index, 1);
      }
    }
    removeClothFromInventory(id);
  }
}

function removeClothFromInventory(id){
  const el = clothesArea.querySelector(`.cloth[data-id="${id}"]`);
  if(el) el.remove();
}

function addClothToInventory(cloth){
  const card = document.createElement('div');
  card.className = 'cloth';
  card.draggable = !(STATE.level === 3 && STATE.level3Stage === 1);
  card.dataset.id = cloth.id;
  card.innerHTML = `
    <div class="meta">
      <div>${cloth.type || 'item'}</div>
      <div style="font-size:11px;color:#888">${cloth.season || ''} • ${cloth.color || ''}</div>
    </div>
  `;
  const img = document.createElement('img');
  img.src = cloth.file || 'assets/skirt.png';
  img.alt = cloth.id;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.style.position = 'absolute';
  img.style.opacity = 0.12;
  img.style.pointerEvents = 'none';
  card.style.position = 'relative';
  card.appendChild(img);
  
  card.addEventListener('dragstart', (e)=>{
    e.dataTransfer.setData('text/plain', cloth.id);
    setTimeout(()=>card.classList.add('dragging'), 10);
  });
  card.addEventListener('dragend', ()=>card.classList.remove('dragging'));
  clothesArea.appendChild(card);
  
  card.style.transform = 'scale(0)';
  card.style.transition = 'transform 0.3s ease-out';
  setTimeout(() => {
    card.style.transform = 'scale(1)';
  }, 10);
  
  if(STATE.level === 2 || STATE.level === 3) {
    const index = clothesArea.querySelectorAll('.cloth').length - 1;
    card.animate([
      {transform:'translateY(0px) scale(1)'},
      {transform:'translateY(-6px) scale(1)'},
      {transform:'translateY(0px) scale(1)'}
    ], {duration:1200 + index*80, iterations:Infinity});
  }
}

function redrawDollClothes(doll) {
  if(!doll || !doll.el) {
    console.warn('Invalid doll object:', doll);
    return;
  }
  
  const getLayerForType = (type) => {
    if(type === 'hat') return doll.el.querySelector('[data-layer="hat"]');
    if(type === 'top' || type === 'outer' || type === 'dress') return doll.el.querySelector('[data-layer="top"]');
    if(type === 'bottom') return doll.el.querySelector('[data-layer="bottom"]');
    if(type === 'shoes') return doll.el.querySelector('[data-layer="shoes"]');
    return doll.el.querySelector('[data-layer="clothes"]'); // fallback
  };

  const layers = doll.el.querySelectorAll('[data-layer]');
  if(!layers || layers.length === 0) {
    console.warn('No layers found for doll');
    return;
  }
  
  layers.forEach(layer => {
    if(layer) layer.innerHTML = '';
  });

  if(!doll.worn || doll.worn.length === 0) {
    return;
  }

  doll.worn.forEach((cloth, index) => {
    if(!cloth) return;
    
    const layer = getLayerForType(cloth.type);
    if(!layer) {
      console.warn('Layer not found for cloth type:', cloth.type, 'Available layers:', Array.from(layers).map(l => l.dataset.layer));
      return;
    }

    const img = document.createElement('img');
    img.src = cloth.file || 'assets/skirt.png';
    img.alt = cloth.id || 'cloth';
    img.dataset.clothId = cloth.id;

    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    img.style.zIndex = String(10 + index);
    img.style.display = 'block';

    if (cloth.type === 'shoes') {
      img.style.top = '40%';
      img.style.height = '60%';
      img.style.width = '60%';
      img.style.left = '20%';
    }

    if (cloth.top)
      layer.style.top = cloth.top;
    if (cloth.left)
      layer.style.left = cloth.left;
    if (cloth.width)
      layer.style.width = cloth.width;
    if (cloth.height)
      layer.style.height = cloth.height;

    img.onerror = function() {
      console.warn('Failed to load cloth image:', cloth.file);
      const fallback = document.createElement('div');
      fallback.style.position = 'absolute';
      fallback.style.top = '50%';
      fallback.style.left = '50%';
      fallback.style.transform = 'translate(-50%, -50%)';
      fallback.style.padding = '4px 8px';
      fallback.style.background = 'rgba(107, 91, 149, 0.8)';
      fallback.style.color = 'white';
      fallback.style.borderRadius = '4px';
      fallback.style.fontSize = '12px';
      fallback.style.zIndex = String(10 + index);
      fallback.textContent = cloth.type || 'item';
      fallback.dataset.clothId = cloth.id;
      layer.appendChild(fallback);
      img.remove();
    };

    img.onload = function() {
      console.log('Cloth image loaded successfully:', cloth.file, 'on layer:', cloth.type);
    };

    layer.appendChild(img);
  });
  
  console.log('Redrawn clothes for doll:', doll.worn.length, 'items');
}


let fallingInterval = null;
let fallingAnimations = [];
let keyboardHandler = null;

function disableFallingClothes(){
  if(fallingInterval) {
    clearInterval(fallingInterval);
    fallingInterval = null;
  }
  fallingAnimations.forEach(anim => clearInterval(anim));
  fallingAnimations = [];
  $all('.cloth.falling').forEach(el => el.remove());
}

function enableFallingClothes(){
  disableFallingClothes();
  if(STATE.level !== 3 || STATE.level3Stage !== 1) return;

  let isLevel3stage2started = false;
  
  const maxCaught = STATE.level3TotalClothes || 15;
  
  fallingInterval = setInterval(()=>{
    if(STATE.level3CaughtClothes.length >= maxCaught) {
      clearInterval(fallingInterval);
      fallingInterval = null;
      return;
    }
    
    const neededClothes = getNeededClothesForLevel3();
    let c;
    if((Math.random() < 0.7) && neededClothes.length > 0) {
      c = neededClothes[Math.floor(Math.random() * neededClothes.length)];
    } else {
      c = CLOTHES[Math.floor(Math.random()*CLOTHES.length)];
    }
    
    const el = document.createElement('div');
    el.className = 'cloth falling';
    el.style.position='absolute';
    el.style.left = Math.random() * (dollsArea.clientWidth - 80) + 'px';
    el.style.top = '-80px';
    el.style.zIndex = 200;
    el.dataset.id = c.id;
    el.dataset.season = c.season;
    el.dataset.color = c.color;
    el.dataset.type = c.type;
    el.dataset.instanceId = `${c.id}_${Date.now()}_${Math.random()}`;
    el.textContent = `${c.type}\n${c.season} ${c.color}`;
    el.style.background = '#fff';
    el.style.border = '2px solid #6b5b95';
    el.style.borderRadius = '8px';
    el.style.padding = '8px';
    el.style.fontSize = '11px';
    el.style.textAlign = 'center';
    dollsArea.appendChild(el);

    const speed = 2 + Math.random()*2;
    const t = setInterval(()=>{
      const top = parseFloat(el.style.top);
      el.style.top = (top + speed) + 'px';
      
      if(STATE.level === 3 && STATE.level3Stage === 1 && !el.dataset.caught && STATE.level3CaughtClothes.length < 15) {
        const basket = document.querySelector('.basket');
        if(basket) {
          const r1 = el.getBoundingClientRect();
          const r2 = basket.getBoundingClientRect();
          const isColliding = !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
          
          if(isColliding){
            el.dataset.caught = 'true';
            
            clearInterval(t);
            fallingAnimations = fallingAnimations.filter(a => a !== t);
            
            const originalCloth = CLOTHES.find(cl => cl.id === el.dataset.id);
            const clothData = {
              id: el.dataset.id,
              instanceId: el.dataset.instanceId,
              season: el.dataset.season,
              color: el.dataset.color,
              type: el.dataset.type,
              file: originalCloth?.file || 'assets/skirt.png',
              top: originalCloth.top,
              left: originalCloth.left,
              width: originalCloth.width,
              height: originalCloth.height,
              targetDollIndex: getTargetDollIndexForCloth(el.dataset.season, el.dataset.color)
            };
            STATE.level3CaughtClothes.push(clothData);
            
            const counter = document.getElementById('level3-counter-permanent');
            if(counter) {
              counter.textContent = `Поймано: ${STATE.level3CaughtClothes.length}/15`;
              if(STATE.level3CaughtClothes.length === 15) {
                counter.style.color = '#00ff00';
              }
            }
            
            const basketRect = basket.getBoundingClientRect();
            animateClothToDoll(el, basketRect, () => {
              el.remove();
              showFeedback('ok', `Поймано: ${clothData.type}`);
              
              if(STATE.level3CaughtClothes.length == 15) {
                setTimeout(() => {
                  if (!isLevel3stage2started) {
                    startLevel3Stage2();
                    isLevel3stage2started = true;
                  }
                }, 500);
              }
            });
            return;
          }
        }
      }
      
      if(STATE.level === 3 && STATE.level3Stage === 2) {
        STATE.dolls.forEach(doll=>{
          const r1 = el.getBoundingClientRect();
          const r2 = doll.el.getBoundingClientRect();
          if(!(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom)){
            wearCloth(el.dataset.id, doll.el, el.dataset.instanceId);
            el.remove();
            clearInterval(t);
            fallingAnimations = fallingAnimations.filter(a => a !== t);
          }
        });
      }
      
      if(parseFloat(el.style.top) > dollsArea.clientHeight + 100){ 
        el.remove(); 
        clearInterval(t);
        fallingAnimations = fallingAnimations.filter(a => a !== t);
      }
    }, 30);
    fallingAnimations.push(t);
  }, 800);
}

function renderBasket(){
  const basket = document.createElement('div');
  basket.className = 'basket';
  basket.style.position = 'absolute';
  basket.style.bottom = '20px';
  basket.style.left = STATE.basketPosition + '%';
  basket.style.width = '100px';
  basket.style.height = '60px';
  basket.style.background = '#6b5b95';
  basket.style.borderRadius = '8px';
  basket.style.border = '3px solid #fff';
  basket.style.zIndex = 300;
  basket.style.transform = 'translateX(-50%)';
  basket.style.display = 'flex';
  basket.style.alignItems = 'center';
  basket.style.justifyContent = 'center';
  basket.style.color = 'white';
  basket.style.fontSize = '12px';
  basket.textContent = '🧺';
  dollsArea.appendChild(basket);
}

function startLevel3Stage2(){
  STATE.level3Stage = 2;
  const basket = document.querySelector('.basket');
  if(basket) basket.remove();
  const instruction = document.getElementById('level3-instruction');
  if(instruction) instruction.remove();
  
  disableFallingClothes();
  
  const caughtClothes = STATE.level3CaughtClothes;
  console.log(STATE.level3CaughtClothes.length);
  clothesArea.innerHTML = '';
  
  const basketEl = document.querySelector('.basket');
  const basketRect = basketEl ? basketEl.getBoundingClientRect() : null;
  
  caughtClothes.forEach((cloth, idx) => {
    setTimeout(() => {
      const tempEl = document.createElement('div');
      tempEl.className = 'cloth';
      tempEl.style.position = 'fixed';
      if(basketRect) {
        tempEl.style.left = basketRect.left + 'px';
        tempEl.style.top = basketRect.top + 'px';
      } else {
        tempEl.style.left = '50%';
        tempEl.style.top = '50%';
      }
      tempEl.style.width = '100px';
      tempEl.style.height = '60px';
      tempEl.style.zIndex = '10000';
      tempEl.style.background = '#fff';
      tempEl.style.border = '2px solid #6b5b95';
      tempEl.style.borderRadius = '8px';
      tempEl.textContent = cloth.type;
      document.body.appendChild(tempEl);
      
      const clothesAreaRect = clothesArea.getBoundingClientRect();
      requestAnimationFrame(() => {
        tempEl.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        tempEl.style.left = (clothesAreaRect.left + clothesAreaRect.width / 2) + 'px';
        tempEl.style.top = (clothesAreaRect.top + clothesAreaRect.height / 2) + 'px';
        tempEl.style.transform = 'scale(0.3) rotate(360deg)';
        tempEl.style.opacity = '0';
        
        setTimeout(() => {
          tempEl.remove();
          addClothToInventory(cloth);
        }, 600);
      });
    }, idx * 150);
  });
  
  setTimeout(() => {
    renderDolls(3);
    enableDragAndDrop();
    showFeedback('ok', 'Теперь оденьте кукол!');
    startTimer();
  }, caughtClothes.length * 100 + 500);
}

function disableKeyboardControls(){
  if(keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }
}

function enableKeyboardControls(){
  disableKeyboardControls();
  keyboardHandler = onKeyNav;
  document.addEventListener('keydown', keyboardHandler);
}

function onKeyNav(e){
  if(!STATE.running || STATE.level !== 3) return;
  
  if(['ArrowLeft','ArrowRight','Space'].includes(e.code)){
    e.preventDefault();
  }
  
  if(STATE.level3Stage === 1) {
    const basket = document.querySelector('.basket');
    if(!basket) return;
    
    if(e.code==='ArrowLeft'){
      STATE.basketPosition = Math.max(5, STATE.basketPosition - 3);
      basket.style.left = STATE.basketPosition + '%';
    } else if(e.code==='ArrowRight'){
      STATE.basketPosition = Math.min(95, STATE.basketPosition + 3);
      basket.style.left = STATE.basketPosition + '%';
    }
    return;
  }
  
  if(STATE.level3Stage === 2) {
    if(e.code==='ArrowLeft'){
      focusPrevDoll();
    } else if(e.code==='ArrowRight'){
      focusNextDoll();
    } else if(e.code==='Space'){
      const focused = document.querySelector('.doll.focus');
      if(focused){
        const doll = STATE.dolls.find(x=>x.el===focused);
        if(doll && doll.worn.length){ doll.worn.pop(); redrawDollClothes(doll); applyPenalty('remove'); }
      }
    }
  }
}
function focusPrevDoll(){ const idx = STATE.dolls.findIndex(d=>d.el.classList.contains('focus')); if(idx<0) { STATE.dolls[0].el.classList.add('focus'); return } STATE.dolls[idx].el.classList.remove('focus'); const prev = (idx-1+STATE.dolls.length)%STATE.dolls.length; STATE.dolls[prev].el.classList.add('focus'); }
function focusNextDoll(){ const idx = STATE.dolls.findIndex(d=>d.el.classList.contains('focus')); if(idx<0) { STATE.dolls[0].el.classList.add('focus'); return } STATE.dolls[idx].el.classList.remove('focus'); const next = (idx+1)%STATE.dolls.length; STATE.dolls[next].el.classList.add('focus'); }

function evaluateAttempt(cloth, doll){
  let correct=false;
  if(STATE.task.type==='season'){
    correct = cloth.season === STATE.task.season;
  } else if(STATE.task.type==='seasonColor'){
    const dollIndex = STATE.dolls.indexOf(doll);
    if(STATE.task.parts && STATE.task.parts[dollIndex] && STATE.task.parts[dollIndex] !== null) {
      const taskPart = STATE.task.parts[dollIndex];
      correct = cloth.season === taskPart.season && cloth.color === taskPart.color;
    } else {
      correct = false;
    }
  } else if(STATE.task.type==='multi'){
    const dollIndex = STATE.dolls.indexOf(doll);
    if(dollIndex >= 0 && STATE.task.parts[dollIndex]) {
      const taskPart = STATE.task.parts[dollIndex];
      correct = cloth.season === taskPart.season && cloth.color === taskPart.color;
    } else {
      correct = false;
    }
  }
  
  if(STATE.level === 2) {
    if(correct) {
      if(!doll.correctIds.has(cloth.id)) {
        addScore(10);
        doll.correctIds.add(cloth.id);
        showFeedback('ok', 'Правильно! +10');
      } else {
        showFeedback('ok', 'Уже учтено');
      }
    } else {
      applyPenalty('wrong');
      showFeedback('bad','Неправильно −5');
    }
  } else {
    if(correct){
      addScore(10);
      showFeedback('ok', 'Правильно! +10');
    } else {
      applyPenalty('wrong');
      showFeedback('bad','Неправильно −5');
    }
  }
  updateUI();
  
  return correct;
}

function animateClothToDoll(clothCard, dollRect, callback) {
  const cardRect = clothCard.getBoundingClientRect();
  const clone = clothCard.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = cardRect.left + 'px';
  clone.style.top = cardRect.top + 'px';
  clone.style.width = cardRect.width + 'px';
  clone.style.height = cardRect.height + 'px';
  clone.style.zIndex = '10000';
  clone.style.pointerEvents = 'none';
  clone.style.transition = 'none';
  document.body.appendChild(clone);
  
  requestAnimationFrame(() => {
    clone.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    clone.style.left = (dollRect.left + dollRect.width / 2) + 'px';
    clone.style.top = (dollRect.top + dollRect.height / 2) + 'px';
    clone.style.transform = 'scale(0.3) rotate(360deg)';
    clone.style.opacity = '0.8';
    
    setTimeout(() => {
      clone.remove();
      if(callback) callback();
    }, 300);
  });
}

function animateDollResult(dollEl, isCorrect) {
  if(isCorrect) {
    dollEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    dollEl.style.transform = 'scale(1.05)';
    dollEl.style.boxShadow = '0 0 30px rgba(76, 175, 80, 0.6)';
    
    createSparkles(dollEl, true);
    
    setTimeout(() => {
      dollEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      dollEl.style.transform = 'scale(1)';
      dollEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
    }, 500);
  } else {
    dollEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    dollEl.style.animation = 'shake 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    createSparkles(dollEl, false);
    
    setTimeout(() => {
      dollEl.style.animation = '';
    }, 600);
  }
}

function createSparkles(element, isSuccess) {
  const colors = isSuccess ? ['#4CAF50', '#8BC34A', '#CDDC39'] : ['#F44336', '#FF5722', '#FF9800'];
  const count = 8;
  
  for(let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const angle = (Math.PI * 2 * i) / count;
    const distance = 60 + Math.random() * 40;
    
    sparkle.style.position = 'fixed';
    sparkle.style.left = (rect.left + rect.width / 2) + 'px';
    sparkle.style.top = (rect.top + rect.height / 2) + 'px';
    sparkle.style.width = '8px';
    sparkle.style.height = '8px';
    sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
    sparkle.style.borderRadius = '50%';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '10001';
    sparkle.style.boxShadow = `0 0 10px ${sparkle.style.background}`;
    document.body.appendChild(sparkle);
    
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;
    
    sparkle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).onfinish = () => sparkle.remove();
  }
}

function showLevelDescription(level) {
  const existing = document.getElementById('level-description');
  if(existing) existing.remove();
  
  const descriptions = {
    1: {
      title: '👗 Уровень 1: Первые шаги стилиста',
      mechanics: [
        'Перетаскивайте одежду на куклу мышкой',
        'Выбирайте одежду по сезону, указанному в задании'
      ],
      goal: 'Подберите для куклы полный образ: шапка, верх, низ и обувь. Всё должно соответствовать сезону!'
    },
    2: {
      title: '👔 Уровень 2: Стилист двух кукол',
      mechanics: [
        'На этом уровне две куклы с разными заданиями',
        'Каждая кукла должна быть одета в определённый сезон и цвет',
        'Двойной клик на кукле снимает одежду',
        'Правильная одежда дает +10 очков (один раз), неправильная отнимает -5 очков'
      ],
      goal: 'Оденьте обеих кукол правильно: полный образ (шапка, верх, низ, обувь) в нужном сезоне и цвете!'
    },
    3: {
      title: '🎪 Уровень 3: Мастер стилист',
      mechanics: [
        '📍 Этап 1 (ловля): Ловите падающую одежду, управляя корзинкой стрелками ← →. Нужно поймать ровно 15 предметов',
        '👕 Этап 2 (одевание): Оденьте трёх кукол правильно за 2 минуты',
        'У каждой куклы своё задание (сезон + цвет)',
        'После использования одежда исчезает'
      ],
      goal: 'Сначала поймайте 15 предметов одежды, потом оденьте всех трёх кукол согласно их заданиям.'
    }
  };
  
  const desc = descriptions[level];
  if(!desc) return;
  
  const descEl = document.createElement('div');
  descEl.id = 'level-description';
  descEl.style.position = 'fixed';
  descEl.style.top = '50%';
  descEl.style.left = '50%';
  descEl.style.transform = 'translate(-50%, -50%)';
  descEl.style.background = 'linear-gradient(135deg, rgba(107, 91, 149, 0.98) 0%, rgba(118, 75, 162, 0.98) 100%)';
  descEl.style.color = 'white';
  descEl.style.padding = '30px 40px';
  descEl.style.borderRadius = '20px';
  descEl.style.zIndex = '10000';
  descEl.style.maxWidth = '500px';
  descEl.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.4)';
  descEl.style.backdropFilter = 'blur(10px)';
  descEl.style.border = '2px solid rgba(255, 255, 255, 0.2)';
  
  descEl.innerHTML = `
    <h2 style="margin: 0 0 20px 0; font-size: 24px; text-align: center;">${desc.title}</h2>
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Механики:</h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        ${desc.mechanics.map(m => `<li>${m}</li>`).join('')}
      </ul>
    </div>
    <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 10px; margin-top: 20px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px;">Цель:</h3>
      <p style="margin: 0; line-height: 1.6;">${desc.goal}</p>
    </div>
    <button id="close-description" style="margin-top: 20px; width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.3); color: white; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px; transition: all 0.3s;">
      Понятно, начать!
    </button>
  `;
  
  document.body.appendChild(descEl);
  
  descEl.style.opacity = '0';
  descEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
  requestAnimationFrame(() => {
    descEl.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    descEl.style.opacity = '1';
    descEl.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  
  STATE.running = false;
  stopTimer();
  
  const closeBtn = descEl.querySelector('#close-description');
  const closeDescription = () => {
    descEl.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    descEl.style.opacity = '0';
    descEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
      descEl.remove();
      STATE.running = true;
      startTimer();
      if(level === 3){
        enableFallingClothes();
        enableKeyboardControls();
      }
    }, 400);
  };
  
  closeBtn.addEventListener('click', closeDescription);
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    closeBtn.style.transform = 'scale(1.02)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    closeBtn.style.transform = 'scale(1)';
  });
}

function animateClothToInventory(clothElement, targetRect, callback) {
  const rect = clothElement.getBoundingClientRect();
  const clone = clothElement.cloneNode(true);
  clone.style.position = 'fixed';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.zIndex = '10000';
  clone.style.pointerEvents = 'none';
  clone.style.transition = 'none';
  document.body.appendChild(clone);
  
  requestAnimationFrame(() => {
    clone.style.transition = 'all 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    clone.style.left = (targetRect.left + targetRect.width / 2) + 'px';
    clone.style.top = (targetRect.top + targetRect.height / 2) + 'px';
    clone.style.transform = 'scale(0.5) rotate(-180deg)';
    clone.style.opacity = '0.7';
    
    setTimeout(() => {
      clone.remove();
      if(callback) callback();
    }, 900);
  });
}

function addScore(n){ STATE.score += n; }
function applyPenalty(reason){
  if(reason==='wrong'){ STATE.score -= 5; STATE.timer = Math.max(0, STATE.timer - 2); }
  if(reason==='remove'){ STATE.score -= 3; STATE.timer = Math.max(0, STATE.timer - 1); }
  updateUI();
}

function updateUI(){
  scoreDisplay.textContent = STATE.score;
  timerDisplay.textContent = formatTime(STATE.timer);
  levelDisplay.textContent = STATE.level;
  nameDisplay.textContent = STATE.player;
}

function startTimer(){
  stopTimer();
  if(STATE.level === 3 && STATE.level3Stage === 1) {
    return;
  }
  STATE.intervalId = setInterval(()=>{
    STATE.timer -= 1;
    if(STATE.timer<=0){
      stopTimer();
      finishLevel(true);
      return;
    }
    updateUI();
  },1000);
}
function stopTimer(){ if(STATE.intervalId) clearInterval(STATE.intervalId); STATE.intervalId = null; }

function finishLevel(timeUp=false){
  stopTimer();
  let success = false;
  if(STATE.level===1){
    success = STATE.score >= 0;
  } else if(STATE.level===2){
    success = STATE.score >= 0;
  } else if(STATE.level===3){
    success = STATE.level3CaughtClothes.length > 0 || STATE.score >= 0;
  }
  if(timeUp && STATE.level < 3) {
    success = true;
  }
  if(success){
    showFeedback('ok','Уровень пройден!');
    STATE.level += 1;
    setTimeout(() => {
      nextLevel();
    }, 1000);
  } else {
    showFeedback('bad','Уровень не пройден. Игра окончена.');
    finishGame();
  }
}

function finishGame(){
  STATE.running = false;
  stopTimer();
  saveResult();
  renderScores();
  showScreen('scoreboard');
}

function saveResult(){
  const rec = { name: STATE.player, score: STATE.score, date: new Date().toISOString(), level: STATE.level };
  const arr = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
  
  const existingIndex = arr.findIndex(r => r.name.toLowerCase() === STATE.player.toLowerCase());
  
  if(existingIndex >= 0) {
    if(STATE.score > arr[existingIndex].score) {
      arr[existingIndex] = rec;
    }
  } else {
    arr.push(rec);
  }
  
  arr.sort((a,b)=>b.score - a.score);
  localStorage.setItem(SCORES_KEY, JSON.stringify(arr.slice(0,100)));
}

function renderScores(){
  const arr = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
  scoresList.innerHTML = '';
  if(arr.length===0){ 
    scoresList.innerHTML = '<div class="center" style="padding:40px;text-align:center;color:#999;">Рейтинг пока пусто. Сыграйте первую игру!</div>'; 
    return; 
  }
  
  arr.forEach((r, idx)=>{
    const item = document.createElement('div');
    item.className = 'score-item';
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1);
    const dateStr = new Date(r.date).toLocaleDateString('ru-RU');
    item.innerHTML = `<div style="flex:1"><strong style="font-size:16px;">${medal} ${r.name}</strong><div style="font-size:12px;color:#999;margin-top:4px;">Уровень: ${r.level}/3 • ${dateStr}</div></div><div style="text-align:right;"><div style="font-size:20px;font-weight:bold;color:#6b5b95;">${r.score}</div><div style="font-size:11px;color:#999;">очков</div></div>`;
    scoresList.appendChild(item);
  });
}

function showFeedback(type, text){
  const t = document.createElement('div');
  t.textContent = text;
  t.style.position='fixed';t.style.right='20px';t.style.bottom='20px';t.style.background= type==='ok' ? '#dff2e1' : '#ffe6e6';
  t.style.padding='10px 14px';t.style.border='1px solid #ddd';t.style.borderRadius='8px';t.style.zIndex=9999;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1500);
}

function saveCompositionAsPNG(){
  try {
    const dollEls = Array.from(dollsArea.querySelectorAll('.doll'));
    
    if(dollEls.length === 0) {
      showFeedback('bad', 'Нет кукол для сохранения');
      return;
    }
    
    if(typeof html2canvas !== 'undefined') {
      html2canvas(dollsArea, { 
        scale: 2,
        backgroundColor: '#f7f6fb',
        allowTaint: true,
        useCORS: false,
        logging: false
      }).then(canvas => {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${STATE.player || 'player'}_composition_${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showFeedback('ok', 'Образ сохранён!');
      }).catch(err => {
        console.error('html2canvas error:', err);
        fallbackSaveMethod();
      });
    } else {
      fallbackSaveMethod();
    }
    
    function fallbackSaveMethod() {
      const canvas = document.createElement('canvas');
      const padding = 40;
      const dollWidth = 240;
      const dollHeight = 400;
      
      const cols = Math.min(3, dollEls.length);
      const rows = Math.ceil(dollEls.length / cols);
      
      canvas.width = cols * dollWidth + padding * 2;
      canvas.height = rows * dollHeight + padding * 2;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f7f6fb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      
      for(let i = 0; i < cols; i++) {
        for(let j = 0; j < rows; j++) {
          const x = padding + i * dollWidth;
          const y = padding + j * dollHeight;
          ctx.strokeRect(x, y, dollWidth, dollHeight);
        }
      }
      
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      
      dollEls.forEach((dollEl, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = padding + col * dollWidth + dollWidth / 2;
        const y = padding + row * dollHeight + dollHeight + 20;
        
        const doll = STATE.dolls[idx];
        if(doll && doll.worn && doll.worn.length > 0) {
          const clothList = doll.worn.map(c => `${c.type} (${c.color})`).join(', ');
          ctx.fillText('Кукла ' + (idx + 1) + ':', x, y);
          ctx.font = '12px Arial';
          ctx.fillText(clothList, x, y + 15);
          ctx.font = '14px Arial';
        } else {
          ctx.fillText('Кукла ' + (idx + 1) + ' (голая)', x, y);
        }
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${STATE.player || 'player'}_composition_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showFeedback('ok', 'Образ сохранён (текстовый формат)');
    }
  } catch(err) {
    console.error('Error in saveCompositionAsPNG:', err);
    showFeedback('bad', 'Ошибка при сохранении образа');
  }
}

function removeClothFromUI(id){
  const el = clothesArea.querySelector(`.cloth[data-id="${id}"]`);
  if(el) el.remove();
}

function enableAnimationsForClothes(){
  const items = clothesArea.querySelectorAll('.cloth');
  items.forEach((el,i)=>{
    el.animate([{transform:'translateY(0px)'},{transform:'translateY(-6px)'},{transform:'translateY(0px)'}],{duration:1200 + i*80, iterations:Infinity});
  });
}

function enableDragAfterRender(){
  $all('.cloth').forEach(card=>{
    card.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', card.dataset.id);
      setTimeout(()=>card.classList.add('dragging'), 10);
    });
    card.addEventListener('dragend', ()=>card.classList.remove('dragging'));
  });
}

const mo = new MutationObserver(()=>enableDragAfterRender());
mo.observe(clothesArea, {childList:true, subtree:true});

function attachHandlers(){ }

window._GAME = { STATE, startGame, nextLevel, finishLevel };

