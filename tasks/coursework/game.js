import * as Utils from './utils.js';

const PLAYER_KEY = 'kukly_player';
const SCORES_KEY = 'kukly_scores';

const DOLLS = [
  { id: 'd1', file: 'assets/doll2.png', name: 'Кукла 1' },
  { id: 'd2', file: 'assets/doll2.png', name: 'Кукла 2' },
  { id: 'd3', file: 'assets/doll2.png', name: 'Кукла 3' }
];

const CLOTHES = [
  {id:'c1',file:'assets/clothes/winter_blue_outer.png',type:'outer',season:'winter',color:'blue',style:'classic',top:'20%',left:'27%',width:'45%',height:'30%'},
  {id:'c2',file:'assets/clothes/winter_brown_hat.png',type:'hat',season:'winter',color:'red',style:'casual',top:'-2%',left:'37%',width:'22%',height:'20%'},
  {id:'c3',file:'assets/clothes/blue_bottom.png',type:'bottom',season:'winter',color:'blue',style:'casual',top:'37%',left:'34.5%',width:'30%',height:'50%'},
  {id:'c4',file:'assets/clothes/winter_top_blue.png',type:'top',season:'winter',color:'blue',style:'classic',top:'20%',left:'25%',width:'50%',height:'27%'},
  {id:'c6',file:'assets/clothes/winter_top_green.png',type:'top',season:'winter',color:'green',style:'classic',top:'22%',left:'25%',width:'50%',height:'27%'},
  {id:'c7',file:'assets/clothes/winter_top_red.png',type:'top',season:'winter',color:'red',style:'classic',top:'22%',left:'25%',width:'50%',height:'27%'},
  {id:'c5',file:'assets/clothes/winter_brown_shoes.png',type:'shoes',season:'winter',color:'brown',style:'sport',top:'70%',left:'31%',width:'40%',height:'26%'},
  {id:'c9',file:'assets/clothes/summer_blue_hat.png',type:'hat',season:'summer',color:'blue',style:'classic',top:'1%',left:'33%',width:'30%',height:'12%'},
  {id:'c10',file:'assets/clothes/summer_purple_top_3.png',type:'top',season:'summer',color:'purple',style:'sport',top:'22%',left:'29%',width:'40%',height:'29%'},
  {id:'c11',file:'assets/clothes/summer_blue_bottom_2.png',type:'bottom',season:'summer',color:'blue',style:'casual',top:'38%',left:'34.5%',width:'30%',height:'30%'},
  {id:'c12',file:'assets/skirt.png',type:'bottom',season:'summer',color:'green',style:'casual',top:'35%',left:'29.5%',width:'40%',height:'20%'},
  {id:'c13',file:'assets/clothes/summer_pink_shoes.png',type:'shoes',season:'summer',color:'brown',style:'casual',top:'84%',left:'36%',width:'30%',height:'13%'},
];

export default class Game {
  constructor(){
    this.state = {
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

    this.fallingInterval = null;
    this.fallingAnimations = [];
    this.keyboardHandler = null;

    this.splash = Utils.$('#splash');
    this.game = Utils.$('#game');
    this.scoreboard = Utils.$('#scoreboard');

    this.playerNameInput = Utils.$('#playerName');
    this.startBtn = Utils.$('#startBtn');
    this.scoreBtn = Utils.$('#scoreBtn');
    this.nameDisplay = Utils.$('#nameDisplay');
    this.levelDisplay = Utils.$('#levelDisplay');
    this.timerDisplay = Utils.$('#timerDisplay');
    this.scoreDisplay = Utils.$('#scoreDisplay');
    this.taskText = Utils.$('#taskText');
    this.dollsArea = Utils.$('#dollsArea');
    this.clothesArea = Utils.$('#clothesArea');
    this.restartLevelBtn = Utils.$('#restartLevel');
    this.savePNGBtn = Utils.$('#savePNG');
    this.quitToMenuBtn = Utils.$('#quitToMenu');
    this.scoresList = Utils.$('#scoresList');
    this.backToMenu = Utils.$('#backToMenu');
    this.clearScores = Utils.$('#clearScores');

    this.mo = new MutationObserver(()=>this.enableDragAfterRender());
    this.mo.observe(this.clothesArea, {childList:true, subtree:true});

    this.initBindings();
  }

  init(){
    const stored = localStorage.getItem(PLAYER_KEY);
    if(stored){ this.playerNameInput.value = stored }
    this.renderScores();
  }

  initBindings(){
    this.startBtn.addEventListener('click', ()=>{
      const name = this.playerNameInput.value.trim() || 'Игрок';
      this.state.player = name;
      localStorage.setItem(PLAYER_KEY, name);
      this.startGame();
    });

    this.scoreBtn.addEventListener('click', ()=> this.showScreen('scoreboard'));

    this.restartLevelBtn.addEventListener('click', ()=> { this.finishLevel(false); });
    this.quitToMenuBtn.addEventListener('click', ()=> { this.stopTimer(); this.showScreen('splash'); });

    this.backToMenu.addEventListener('click', ()=> this.showScreen('splash'));
    this.clearScores.addEventListener('click', ()=> { localStorage.removeItem(SCORES_KEY); this.renderScores(); });

    this.savePNGBtn.addEventListener('click', ()=> this.saveCompositionAsPNG());

    this.clothesArea.addEventListener('contextmenu', (e)=>{
      e.preventDefault();
      const target = e.target.closest('.cloth');
      if(!target) return;
      const id = target.dataset.id;
      this.showContextMenu(e.pageX, e.pageY, id);
    });

    this.dollsArea.addEventListener('dblclick', (e)=> this.onDollDoubleClick(e));
  }

  onDollDoubleClick(e){
    if(this.state.level !== 2) return;

    let clothImg = e.target.closest('img[data-cloth-id]');
    let doll = null;
    let clothToRemove = null;

    if(clothImg) {
      const clothId = clothImg.dataset.clothId;
      const dollEl = clothImg.closest('.doll');
      if(dollEl) {
        doll = this.state.dolls.find(x=>x.el===dollEl);
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
        doll = this.state.dolls.find(x=>x.el===target);
        if(doll && doll.worn.length) {
          clothToRemove = doll.worn[doll.worn.length - 1];
        }
      }
    }

    if(doll && clothToRemove) {
      const removeIndex = doll.worn.indexOf(clothToRemove);
      if(removeIndex >= 0) {
        doll.worn.splice(removeIndex, 1);
        this.redrawDollClothes(doll);

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
          const clothesAreaRect = this.clothesArea.getBoundingClientRect();

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
              this.addClothToInventory(clothToRemove);
              this.showFeedback('ok', 'Одежда снята');
            }, 900);
          });
        } else {
          this.addClothToInventory(clothToRemove);
          this.showFeedback('ok', 'Одежда снята');
        }
      }
    }
  }

  showScreen(name){
    Utils.$all('.screen').forEach(s=>s.classList.remove('active'));
    if(name==='splash') this.splash.classList.add('active');
    if(name==='game') this.game.classList.add('active');
    if(name==='scoreboard') this.scoreboard.classList.add('active');
  }

  startGame(){
    this.state.level = 1;
    this.state.score = 0;
    this.showScreen('game');
    this.nameDisplay.textContent = this.state.player;
    this.nextLevel();
  }

  nextLevel(){
    if(this.state.level>3){
      this.finishGame();
      return;
    }
    this.setupLevel(this.state.level);
  }

  setupLevel(level){
    this.disableFallingClothes();
    this.disableKeyboardControls();

    this.state.clothes = CLOTHES.map(c=>Object.assign({}, c));
    this.state.dolls = [];
    this.state.running = true;
    this.stopTimer();
    this.state.level3Stage = 1;
    this.state.level3CaughtClothes = [];
    this.state.level3TotalClothes = 0;
    this.state.basketPosition = 50;

    this.dollsArea.innerHTML = '';
    this.clothesArea.innerHTML = '';

    const basket = document.querySelector('.basket');
    if(basket) basket.remove();

    this.showLevelDescription(level);

    if(level===1){
      this.state.timer = 90;
      this.generateTask({seasonOnly:true});
      this.renderDolls(1);
      this.renderClothes(8, false, true);
      this.enableDragAndDrop();
    } else if(level===2){
      this.state.timer = 60;
      this.generateTask({seasonColor:true});
      this.renderDolls(2);

      let selectedClothes = [];
      const selectedIds = new Set();
      const types = ['hat', 'top', 'bottom', 'shoes'];

      types.forEach(type => {
        if(this.state.task && this.state.task.parts && this.state.task.parts[0]) {
          const taskPart = this.state.task.parts[0];
          const clothesOfType = CLOTHES.filter(c => 
            c.season === taskPart.season && 
            c.color === taskPart.color && 
            (type === 'top' ? (c.type === 'top' || c.type === 'outer' || c.type === 'dress') : c.type === type) &&
            !selectedIds.has(c.id)
          );

          const count = Math.random() < 0.5 ? 1 : 2;
          const toAdd = clothesOfType.slice(0, Math.min(count, clothesOfType.length));
          toAdd.forEach(cloth => { selectedClothes.push(cloth); selectedIds.add(cloth.id); });
        }

        if(this.state.task && this.state.task.parts && this.state.task.parts[1]) {
          const taskPart = this.state.task.parts[1];
          const clothesOfType = CLOTHES.filter(c => 
            c.season === taskPart.season && 
            c.color === taskPart.color && 
            (type === 'top' ? (c.type === 'top' || c.type === 'outer' || c.type === 'dress') : c.type === type) &&
            !selectedIds.has(c.id)
          );

          const count = Math.random() < 0.5 ? 1 : 2;
          const toAdd = clothesOfType.slice(0, Math.min(count, clothesOfType.length));
          toAdd.forEach(cloth => { selectedClothes.push(cloth); selectedIds.add(cloth.id); });
        }
      });

      const remainingClothes = CLOTHES.filter(c => !selectedIds.has(c.id));
      const needed = Math.max(0, 16 - selectedClothes.length);
      const shuffled = remainingClothes.sort(() => Math.random() - 0.5);
      const toAdd = shuffled.slice(0, needed);
      toAdd.forEach(cloth => { selectedClothes.push(cloth); selectedIds.add(cloth.id); });

      this.state.dolls.forEach((doll, dollIdx) => {
        if(this.state.task && this.state.task.parts && this.state.task.parts[dollIdx]) {
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

      this.state.clothes = selectedClothes.sort(() => Math.random() - 0.5);
      this.renderClothes(Math.min(16, selectedClothes.length));

      this.state.dolls.forEach((doll) => { this.redrawDollClothes(doll); });

      this.enableAnimationsForClothes();
    } else if(level===3){
      this.state.level3Stage = 1;
      this.state.level3CaughtClothes = [];
      this.state.level3TotalClothes = 15;
      this.state.timer = 120;
      this.generateTask({multiDoll:true});
      this.renderDolls(0);
      this.renderClothes(0);

      this.dollsArea.style.minHeight = '600px';

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
      this.dollsArea.appendChild(counter);

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
      this.dollsArea.appendChild(instruction);

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
    }

    this.updateUI();
    this.levelDisplay.textContent = this.state.level;

    this.showLevelDescription(level);
  }

  generateTask(opts={}){
    const seasons = ['winter','summer'];
    const colors = ['red','blue','green','purple','brown'];
    if(opts.seasonOnly){
      const s = Utils.randChoice(seasons);
      this.state.task = { type:'season', season:s, text:`Одень куклу для ${s}` };
    } else if(opts.seasonColor){
      const s1 = Utils.randChoice(seasons);
      const c1 = Utils.randChoice(colors);
      const s2 = Utils.randChoice(seasons);
      const c2 = Utils.randChoice(colors);
      this.state.task = { 
        type:'seasonColor', 
        season:s1, 
        color:c1, 
        text:`Кукла 1: ${s1} ${c1} | Кукла 2: ${s2} ${c2}`,
        parts: [{season:s1, color:c1}, {season:s2, color:c2}]
      };
    } else if(opts.multiDoll){
      const t1 = Utils.randChoice(seasons);
      const c1 = Utils.randChoice(colors);
      const t2 = Utils.randChoice(seasons);
      const c2 = Utils.randChoice(colors);
      const t3 = Utils.randChoice(seasons);
      const c3 = Utils.randChoice(colors);
      this.state.task = { 
        type:'multi', 
        parts:[
          {season:t1,color:c1},
          {season:t2,color:c2},
          {season:t3,color:c3}
        ], 
        text:`Три куклы: 1) ${t1} ${c1}  2) ${t2} ${c2}  3) ${t3} ${c3}` 
      };
    }
    this.taskText.textContent = this.state.task.text;
  }

  getNeededClothesForLevel3(){
    if(!this.state.task || this.state.task.type !== 'multi') return [];
    const needed = [];
    this.state.task.parts.forEach((part, dollIndex) => {
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

  getTargetDollIndexForCloth(season, color){
    if(!this.state.task || this.state.task.type !== 'multi') return 0;
    const dollIndex = this.state.task.parts.findIndex(part => part.season === season && part.color === color);
    return dollIndex >= 0 ? dollIndex : 0;
  }

  renderDolls(count=1){
    this.dollsArea.innerHTML = '';
    this.state.dolls = [];
    for(let i=0;i<count;i++){
      const d = DOLLS[i % DOLLS.length];
      const wrapper = document.createElement('div');
      wrapper.className = 'doll';
      wrapper.dataset.slot = `doll-${i}`;
      wrapper.dataset.dollIndex = i;

      let taskHint = '';
      if(this.state.level === 3 && this.state.task && this.state.task.type === 'multi' && this.state.task.parts[i]) {
        const part = this.state.task.parts[i];
        taskHint = `<div class="doll-task-hint" style="position:absolute;top:4px;left:50%;transform:translateX(-50%);background:rgba(107,91,149,0.9);color:white;padding:5px 10px;border-radius:5px;font-size:12px;white-space:nowrap;z-index:1000;">Кукла ${i+1}: ${part.season} ${part.color}</div>`;
      } else if(this.state.level === 2 && this.state.task && this.state.task.parts && this.state.task.parts[i]) {
        const part = this.state.task.parts[i];
        taskHint = `<div class="doll-task-hint" style="position:absolute;top:4px;left:50%;transform:translateX(-50%);background:rgba(107,91,149,0.9);color:white;padding:5px 10px;border-radius:5px;font-size:12px;white-space:nowrap;z-index:1000;">Кукла ${i+1}: ${part.season} ${part.color}</div>`;
      }

      wrapper.innerHTML = `
        ${taskHint}
        <img crossOrigin="anonymous" src="${d.file}" alt="${d.name}" style="max-width:90%;max-height:90%;opacity:0.95" draggable="false" />
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
        this.wearCloth(id, wrapper);
      });
      this.dollsArea.appendChild(wrapper);
      this.state.dolls.push({id:d.id, el:wrapper, worn:[], dollIndex: i, wornIds: new Set(), correctIds: new Set()});
    }
    this.dollsArea.style.justifyContent = count===1 ? 'center' : count===0 ? 'center' : 'space-around';
  }

  renderClothes(count=6, randomize=false, ensureCorrect=false){
    this.clothesArea.innerHTML = '';
    let items = this.state.clothes.slice();

    if(ensureCorrect && this.state.task) {
      const correctClothes = CLOTHES.filter(c => {
        if(this.state.task.type === 'season') {
          return c.season === this.state.task.season;
        }
        return false;
      });
      items = correctClothes.slice();
      const wrongClothes = CLOTHES.filter(c => c.season !== this.state.task.season);
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
      card.draggable = !(this.state.level === 3 && this.state.level3Stage === 1);
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
      this.clothesArea.appendChild(card);
    });

    if(this.state.level === 1 || this.state.level === 2 || this.state.level === 3) {
      this.enableAnimationsForClothes();
    }
  }

  enableDragAndDrop(){
    if(this.state.level === 3 && this.state.level3Stage === 1) {
      Utils.$all('.cloth').forEach(cloth => {
        cloth.draggable = false;
        cloth.style.cursor = 'not-allowed';
        cloth.style.opacity = '0.5';
      });
      return;
    }

    if(this.state.level === 1) {
      Utils.$all('.doll').forEach(d=>{
        const layer = d.querySelector('[data-layer="clothes"]');
        if(layer) {
          layer.addEventListener('click', ()=>{
            const doll = this.state.dolls.find(x=>x.el===d);
            if(!doll || !doll.worn.length) return;
            doll.worn.pop();
            this.redrawDollClothes(doll);
            this.applyPenalty('remove');
          });
        }
      });
    }
  }

  showContextMenu(x,y,id){
    const menu = document.createElement('div');
    menu.style.position='fixed';menu.style.left=`${x}px`;menu.style.top=`${y}px`;
    menu.style.background='#fff';menu.style.border='1px solid #ddd';menu.style.padding='8px';menu.style.zIndex=9999;borderRadius='6px';
    menu.innerHTML = `<div class="menuItem" data-act="wear">Надеть</div><div class="menuItem" data-act="info">Инфо</div><div class="menuItem" data-act="remove">Удалить</div>`;
    document.body.appendChild(menu);
    const cleanup = ()=>{ menu.remove(); document.removeEventListener('click',cleanup) };
    menu.addEventListener('click', (e)=>{
      const act = e.target.dataset.act;
      if(act==='wear') this.wearCloth(id);
      if(act==='info') alert('Информация о вещи: ' + id);
      if(act==='remove') this.removeClothFromInventory(id);
      cleanup();
    });
    setTimeout(()=>document.addEventListener('click',cleanup),10);
  }

  wearCloth(id, dollEl=null, instanceId=null){
    let cloth = null;
    if(this.state.level === 3 && this.state.level3CaughtClothes.length > 0) {
      if(instanceId) {
        cloth = this.state.level3CaughtClothes.find(c => c.instanceId === instanceId);
      } else {
        cloth = this.state.level3CaughtClothes.find(c => c.id === id);
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
      doll = this.state.dolls.find(x=>x.el===dollEl);
    } else if(this.state.level === 3 && this.state.task && this.state.task.type === 'multi') {
      if(cloth.targetDollIndex !== undefined) {
        doll = this.state.dolls[cloth.targetDollIndex];
      } else {
        const dollIndex = this.state.dolls.findIndex((d, idx) => {
          const taskPart = this.state.task.parts[idx];
          return taskPart && cloth.season === taskPart.season && cloth.color === taskPart.color;
        });
        doll = dollIndex >= 0 ? this.state.dolls[dollIndex] : this.state.dolls[0];
      }
    } else {
      doll = dollEl ? this.state.dolls.find(x=>x.el===dollEl) : this.state.dolls[0];
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
      this.showFeedback('bad', 'Уже надета одежда этого типа!');
      return;
    }

    const clothCopy = Object.assign({}, cloth);

    const dollRect = doll.el.getBoundingClientRect();
    const clothCard = this.clothesArea.querySelector(`.cloth[data-id="${id}"]`);
    if(clothCard) {
      const cardRect = clothCard.getBoundingClientRect();
      this.animateClothToDoll(clothCard, dollRect, () => {
        doll.worn.push(clothCopy);
        this.redrawDollClothes(doll);
        const isCorrect = this.evaluateAttempt(clothCopy, doll);
        this.animateDollResult(doll.el, isCorrect);
      });
    } else {
      doll.worn.push(clothCopy);
      this.redrawDollClothes(doll);
      const isCorrect = this.evaluateAttempt(clothCopy, doll);
      this.animateDollResult(doll.el, isCorrect);
    }

    if(this.state.level === 1 || this.state.level === 2) {
      this.removeClothFromInventory(id);
    } else if(this.state.level === 3) {
      if(instanceId) {
        const index = this.state.level3CaughtClothes.findIndex(c => c.instanceId === instanceId);
        if(index >= 0) {
          this.state.level3CaughtClothes.splice(index, 1);
        }
      } else {
        const index = this.state.level3CaughtClothes.findIndex(c => c.id === id);
        if(index >= 0) {
          this.state.level3CaughtClothes.splice(index, 1);
        }
      }
      this.removeClothFromInventory(id);
    }
  }

  removeClothFromInventory(id){
    const el = this.clothesArea.querySelector(`.cloth[data-id="${id}"]`);
    if(el) el.remove();
  }

  addClothToInventory(cloth){
    const card = document.createElement('div');
    card.className = 'cloth';
    card.draggable = !(this.state.level === 3 && this.state.level3Stage === 1);
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
    this.clothesArea.appendChild(card);

    card.style.transform = 'scale(0)';
    card.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
      card.style.transform = 'scale(1)';
    }, 10);

    if(this.state.level === 2 || this.state.level === 3) {
      const index = this.clothesArea.querySelectorAll('.cloth').length - 1;
      card.animate([
        {transform:'translateY(0px) scale(1)'},
        {transform:'translateY(-6px) scale(1)'},
        {transform:'translateY(0px) scale(1)'}
      ], {duration:1200 + index*80, iterations:Infinity});
    }
  }

  redrawDollClothes(doll) {
    if(!doll || !doll.el) {
      console.warn('Invalid doll object:', doll);
      return;
    }

    const getLayerForType = (type) => {
      if(type === 'hat') return doll.el.querySelector('[data-layer="hat"]');
      if(type === 'top' || type === 'outer' || type === 'dress') return doll.el.querySelector('[data-layer="top"]');
      if(type === 'bottom') return doll.el.querySelector('[data-layer="bottom"]');
      if(type === 'shoes') return doll.el.querySelector('[data-layer="shoes"]');
      return doll.el.querySelector('[data-layer="clothes"]');
    };

    const layers = doll.el.querySelectorAll('[data-layer]');
    if(!layers || layers.length === 0) {
      console.warn('No layers found for doll');
      return;
    }

    layers.forEach(layer => { if(layer) layer.innerHTML = ''; });

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
      img.crossOrigin = 'anonymous';
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

      if (cloth.top) layer.style.top = cloth.top;
      if (cloth.left) layer.style.left = cloth.left;
      if (cloth.width) layer.style.width = cloth.width;
      if (cloth.height) layer.style.height = cloth.height;

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

      img.onload = function() { console.log('Cloth image loaded successfully:', cloth.file, 'on layer:', cloth.type); };

      layer.appendChild(img);
    });

    console.log('Redrawn clothes for doll:', doll.worn.length, 'items');
  }

  disableFallingClothes(){
    if(this.fallingInterval) {
      clearInterval(this.fallingInterval);
      this.fallingInterval = null;
    }
    this.fallingAnimations.forEach(anim => clearInterval(anim));
    this.fallingAnimations = [];
    Utils.$all('.cloth.falling').forEach(el => el.remove());
  }

  enableFallingClothes(){
    this.disableFallingClothes();
    if(this.state.level !== 3 || this.state.level3Stage !== 1) return;

    let isLevel3stage2started = false;
    const maxCaught = this.state.level3TotalClothes || 15;

    this.fallingInterval = setInterval(()=>{
      if(this.state.level3CaughtClothes.length >= maxCaught) {
        clearInterval(this.fallingInterval);
        this.fallingInterval = null;
        return;
      }

      const neededClothes = this.getNeededClothesForLevel3();
      let c;
      if((Math.random() < 0.7) && neededClothes.length > 0) {
        c = neededClothes[Math.floor(Math.random() * neededClothes.length)];
      } else {
        c = CLOTHES[Math.floor(Math.random()*CLOTHES.length)];
      }

      const el = document.createElement('div');
      el.className = 'cloth falling';
      el.style.position='absolute';
      el.style.left = Math.random() * (this.dollsArea.clientWidth - 80) + 'px';
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
      this.dollsArea.appendChild(el);

      const speed = 2 + Math.random()*2;
      const t = setInterval(()=>{
        const top = parseFloat(el.style.top);
        el.style.top = (top + speed) + 'px';

        if(this.state.level === 3 && this.state.level3Stage === 1 && !el.dataset.caught && this.state.level3CaughtClothes.length < 15) {
          const basket = document.querySelector('.basket');
          if(basket) {
            const r1 = el.getBoundingClientRect();
            const r2 = basket.getBoundingClientRect();
            const isColliding = !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);

            if(isColliding){
              el.dataset.caught = 'true';

              clearInterval(t);
              this.fallingAnimations = this.fallingAnimations.filter(a => a !== t);

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
                targetDollIndex: this.getTargetDollIndexForCloth(el.dataset.season, el.dataset.color)
              };
              this.state.level3CaughtClothes.push(clothData);

              const counter = document.getElementById('level3-counter-permanent');
              if(counter) {
                counter.textContent = `Поймано: ${this.state.level3CaughtClothes.length}/15`;
                if(this.state.level3CaughtClothes.length === 15) {
                  counter.style.color = '#00ff00';
                }
              }

              const basketRect = basket.getBoundingClientRect();
              this.animateClothToDoll(el, basketRect, () => {
                el.remove();
                this.showFeedback('ok', `Поймано: ${clothData.type}`);

                if(this.state.level3CaughtClothes.length == 15) {
                  setTimeout(() => {
                    if (!isLevel3stage2started) {
                      this.startLevel3Stage2();
                      isLevel3stage2started = true;
                    }
                  }, 500);
                }
              });
              return;
            }
          }
        }

        if(this.state.level === 3 && this.state.level3Stage === 2) {
          this.state.dolls.forEach(doll=>{
            const r1 = el.getBoundingClientRect();
            const r2 = doll.el.getBoundingClientRect();
            if(!(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom)){
              this.wearCloth(el.dataset.id, doll.el, el.dataset.instanceId);
              el.remove();
              clearInterval(t);
              this.fallingAnimations = this.fallingAnimations.filter(a => a !== t);
            }
          });
        }

        if(parseFloat(el.style.top) > this.dollsArea.clientHeight + 100){ 
          el.remove(); 
          clearInterval(t);
          this.fallingAnimations = this.fallingAnimations.filter(a => a !== t);
        }
      }, 30);
      this.fallingAnimations.push(t);
    }, 800);
  }

  renderBasket(){
    const basket = document.createElement('div');
    basket.className = 'basket';
    basket.style.position = 'absolute';
    basket.style.bottom = '20px';
    basket.style.left = this.state.basketPosition + '%';
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
    this.dollsArea.appendChild(basket);
  }

  startLevel3Stage2(){
    this.state.level3Stage = 2;
    const basket = document.querySelector('.basket');
    if(basket) basket.remove();
    const instruction = document.getElementById('level3-instruction');
    if(instruction) instruction.remove();

    this.disableFallingClothes();

    const caughtClothes = this.state.level3CaughtClothes;
    this.clothesArea.innerHTML = '';

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

        const clothesAreaRect = this.clothesArea.getBoundingClientRect();
        requestAnimationFrame(() => {
          tempEl.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
          tempEl.style.left = (clothesAreaRect.left + clothesAreaRect.width / 2) + 'px';
          tempEl.style.top = (clothesAreaRect.top + clothesAreaRect.height / 2) + 'px';
          tempEl.style.transform = 'scale(0.3) rotate(360deg)';
          tempEl.style.opacity = '0';

          setTimeout(() => {
            tempEl.remove();
            this.addClothToInventory(cloth);
          }, 600);
        });
      }, idx * 150);
    });

    setTimeout(() => {
      this.renderDolls(3);
      this.enableDragAndDrop();
      this.showFeedback('ok', 'Теперь оденьте кукол!');
      this.startTimer();
    }, caughtClothes.length * 100 + 500);
  }

  disableKeyboardControls(){
    if(this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  enableKeyboardControls(){
    this.disableKeyboardControls();
    this.keyboardHandler = (e)=>this.onKeyNav(e);
    document.addEventListener('keydown', this.keyboardHandler);
  }

  onKeyNav(e){
    if(!this.state.running || this.state.level !== 3) return;

    if(['ArrowLeft','ArrowRight','Space'].includes(e.code)){
      e.preventDefault();
    }

    if(this.state.level3Stage === 1) {
      const basket = document.querySelector('.basket');
      if(!basket) return;

      if(e.code==='ArrowLeft'){
        this.state.basketPosition = Math.max(5, this.state.basketPosition - 3);
        basket.style.left = this.state.basketPosition + '%';
      } else if(e.code==='ArrowRight'){
        this.state.basketPosition = Math.min(95, this.state.basketPosition + 3);
        basket.style.left = this.state.basketPosition + '%';
      }
      return;
    }

    if(this.state.level3Stage === 2) {
      if(e.code==='ArrowLeft'){
        this.focusPrevDoll();
      } else if(e.code==='ArrowRight'){
        this.focusNextDoll();
      } else if(e.code==='Space'){
        const focused = document.querySelector('.doll.focus');
        if(focused){
          const doll = this.state.dolls.find(x=>x.el===focused);
          if(doll && doll.worn.length){ doll.worn.pop(); this.redrawDollClothes(doll); this.applyPenalty('remove'); }
        }
      }
    }
  }

  focusPrevDoll(){ const idx = this.state.dolls.findIndex(d=>d.el.classList.contains('focus')); if(idx<0) { this.state.dolls[0].el.classList.add('focus'); return } this.state.dolls[idx].el.classList.remove('focus'); const prev = (idx-1+this.state.dolls.length)%this.state.dolls.length; this.state.dolls[prev].el.classList.add('focus'); }
  focusNextDoll(){ const idx = this.state.dolls.findIndex(d=>d.el.classList.contains('focus')); if(idx<0) { this.state.dolls[0].el.classList.add('focus'); return } this.state.dolls[idx].el.classList.remove('focus'); const next = (idx+1)%this.state.dolls.length; this.state.dolls[next].el.classList.add('focus'); }

  evaluateAttempt(cloth, doll){
    let correct=false;
    if(this.state.task.type==='season'){
      correct = cloth.season === this.state.task.season;
    } else if(this.state.task.type==='seasonColor'){
      const dollIndex = this.state.dolls.indexOf(doll);
      if(this.state.task.parts && this.state.task.parts[dollIndex] && this.state.task.parts[dollIndex] !== null) {
        const taskPart = this.state.task.parts[dollIndex];
        correct = cloth.season === taskPart.season && cloth.color === taskPart.color;
      } else {
        correct = false;
      }
    } else if(this.state.task.type==='multi'){
      const dollIndex = this.state.dolls.indexOf(doll);
      if(dollIndex >= 0 && this.state.task.parts[dollIndex]) {
        const taskPart = this.state.task.parts[dollIndex];
        correct = cloth.season === taskPart.season && cloth.color === taskPart.color;
      } else {
        correct = false;
      }
    }

    if(this.state.level === 2) {
      if(correct) {
        if(!doll.correctIds.has(cloth.id)) {
          this.addScore(10);
          doll.correctIds.add(cloth.id);
          this.showFeedback('ok', 'Правильно! +10');
        } else {
          this.showFeedback('ok', 'Уже учтено');
        }
      } else {
        this.applyPenalty('wrong');
        this.showFeedback('bad','Неправильно −5');
      }
    } else {
      if(correct){
        this.addScore(10);
        this.showFeedback('ok', 'Правильно! +10');
      } else {
        this.applyPenalty('wrong');
        this.showFeedback('bad','Неправильно −5');
      }
    }
    this.updateUI();

    return correct;
  }

  animateClothToDoll(clothCard, dollRect, callback) {
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

  animateDollResult(dollEl, isCorrect) {
    if(isCorrect) {
      dollEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      dollEl.style.transform = 'scale(1.05)';
      dollEl.style.boxShadow = '0 0 30px rgba(76, 175, 80, 0.6)';

      this.createSparkles(dollEl, true);

      setTimeout(() => {
        dollEl.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        dollEl.style.transform = 'scale(1)';
        dollEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
      }, 500);
    } else {
      dollEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      dollEl.style.animation = 'shake 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

      this.createSparkles(dollEl, false);

      setTimeout(() => {
        dollEl.style.animation = '';
      }, 600);
    }
  }

  createSparkles(element, isSuccess) {
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

  showLevelDescription(level) {
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

    this.state.running = false;
    this.stopTimer();

    const closeBtn = descEl.querySelector('#close-description');
    const closeDescription = () => {
      descEl.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      descEl.style.opacity = '0';
      descEl.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => {
        descEl.remove();
        this.state.running = true;
        this.startTimer();
        if(level === 3){
          this.renderBasket();
          this.enableFallingClothes();
          this.enableKeyboardControls();
        }
      }, 400);
    };

    closeBtn.addEventListener('click', closeDescription);
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'rgba(255, 255, 255, 0.3)'; closeBtn.style.transform = 'scale(1.02)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'rgba(255, 255, 255, 0.2)'; closeBtn.style.transform = 'scale(1)'; });
  }

  animateClothToInventory(clothElement, targetRect, callback) {
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

  addScore(n){ this.state.score += n; }
  applyPenalty(reason){ if(reason==='wrong'){ this.state.score -= 5; this.state.timer = Math.max(0, this.state.timer - 2); } if(reason==='remove'){ this.state.score -= 3; this.state.timer = Math.max(0, this.state.timer - 1); } this.updateUI(); }

  updateUI(){
    this.scoreDisplay.textContent = this.state.score;
    this.timerDisplay.textContent = Utils.formatTime(this.state.timer);
    this.levelDisplay.textContent = this.state.level;
    this.nameDisplay.textContent = this.state.player;
  }

  startTimer(){
    this.stopTimer();
    if(this.state.level === 3 && this.state.level3Stage === 1) {
      return;
    }
    this.state.intervalId = setInterval(()=>{
      this.state.timer -= 1;
      if(this.state.timer<=0){
        this.stopTimer();
        this.finishLevel(true);
        return;
      }
      this.updateUI();
    },1000);
  }
  stopTimer(){ if(this.state.intervalId) clearInterval(this.state.intervalId); this.state.intervalId = null; }

  finishLevel(timeUp=false){
    this.stopTimer();
    let success = false;
    if(this.state.level===1){ success = this.state.score >= 0; }
    else if(this.state.level===2){ success = this.state.score >= 0; }
    else if(this.state.level===3){ success = this.state.level3CaughtClothes.length > 0 || this.state.score >= 0; }
    if(timeUp && this.state.level < 3) { success = true; }
    if(success){
      this.showFeedback('ok','Уровень пройден!');
      this.state.level += 1;
      setTimeout(() => { this.nextLevel(); }, 1000);
    } else {
      this.showFeedback('bad','Уровень не пройден. Игра окончена.');
      this.finishGame();
    }
  }

  finishGame(){
    this.state.running = false;
    this.stopTimer();
    this.saveResult();
    this.renderScores();
    this.showScreen('scoreboard');
  }

  saveResult(){
    const rec = { name: this.state.player, score: this.state.score, date: new Date().toISOString(), level: this.state.level };
    const arr = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');

    const existingIndex = arr.findIndex(r => r.name.toLowerCase() === this.state.player.toLowerCase());

    if(existingIndex >= 0) {
      if(this.state.score > arr[existingIndex].score) {
        arr[existingIndex] = rec;
      }
    } else {
      arr.push(rec);
    }

    arr.sort((a,b)=>b.score - a.score);
    localStorage.setItem(SCORES_KEY, JSON.stringify(arr.slice(0,100)));
  }

  renderScores(){
    const arr = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
    this.scoresList.innerHTML = '';
    if(arr.length===0){ 
      this.scoresList.innerHTML = '<div class="center" style="padding:40px;text-align:center;color:#999;">Рейтинг пока пусто. Сыграйте первую игру!</div>'; 
      return; 
    }

    arr.forEach((r, idx)=>{
      const item = document.createElement('div');
      item.className = 'score-item';
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1);
      const dateStr = new Date(r.date).toLocaleDateString('ru-RU');
      item.innerHTML = `<div style="flex:1"><strong style="font-size:16px;">${medal} ${r.name}</strong><div style="font-size:12px;color:#999;margin-top:4px;">Уровень: ${r.level}/3 • ${dateStr}</div></div><div style="text-align:right;"><div style="font-size:20px;font-weight:bold;color:#6b5b95;">${r.score}</div><div style="font-size:11px;color:#999;">очков</div></div>`;
      this.scoresList.appendChild(item);
    });
  }

  showFeedback(type, text){
    const t = document.createElement('div');
    t.textContent = text;
    t.style.position='fixed';t.style.right='20px';t.style.bottom='20px';t.style.background= type==='ok' ? '#dff2e1' : '#ffe6e6';
    t.style.padding='10px 14px';t.style.border='1px solid #ddd';t.style.borderRadius='8px';t.style.zIndex=9999;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1500);
  }

  async saveCompositionAsPNG(){
    try {
      const dollEls = Array.from(this.dollsArea.querySelectorAll('.doll'));

      if(dollEls.length === 0) {
        this.showFeedback('bad', 'Нет кукол для сохранения');
        return;
      }

      const rect = this.dollsArea.getBoundingClientRect();

      if(typeof html2canvas !== 'undefined') {
        html2canvas(this.dollsArea, { 
          scale: 2,
          width: rect.width,
          height: rect.height,
          backgroundColor: '#f7f6fb',
          allowTaint: true,
          useCORS: true,
          logging: false
        }).then(canvas => {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.state.player || 'player'}_composition_${new Date().toISOString().slice(0, 10)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          this.showFeedback('ok', 'Образ сохранён!');
        }).catch(err => {
          console.error('html2canvas error:', err);
          this.fallbackSaveMethod();
        });
      } else {
        this.fallbackSaveMethod();
      }
    } catch(err) {
      console.error('Error in saveCompositionAsPNG:', err);
      this.showFeedback('bad', 'Ошибка при сохранении образа');
    }
  }

  fallbackSaveMethod(){
    const canvas = document.createElement('canvas');
    const padding = 40;
    const dollWidth = 240;
    const dollHeight = 400;
    const dollEls = Array.from(this.dollsArea.querySelectorAll('.doll'));

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

      const doll = this.state.dolls[idx];
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
    a.download = `${this.state.player || 'player'}_composition_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showFeedback('ok', 'Образ сохранён (текстовый формат)');
  }

  enableAnimationsForClothes(){
    const items = this.clothesArea.querySelectorAll('.cloth');
    items.forEach((el,i)=>{
      el.animate([{transform:'translateY(0px)'},{transform:'translateY(-6px)'},{transform:'translateY(0px)'}],{duration:1200 + i*80, iterations:Infinity});
    });
  }

  enableDragAfterRender(){
    Utils.$all('.cloth').forEach(card=>{
      card.addEventListener('dragstart', (e)=>{
        e.dataTransfer.setData('text/plain', card.dataset.id);
        setTimeout(()=>card.classList.add('dragging'), 10);
      });
      card.addEventListener('dragend', ()=>card.classList.remove('dragging'));
    });
  }
}
