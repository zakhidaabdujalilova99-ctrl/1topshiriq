let web3;
let userAccount = null;
let els = {}; 

const gameState = {
    tokens: 0,
    gas: 0.050,
    pph: 0,
    energy: 1000,
    maxEnergy: 1000,
    rank: 'Bronze Miner',
    combo: 0,
    multiplier: 1,
    lastClick: 0,
    upgrades: [
        { id: 1, name: 'Neural Processor', cost: 100, pph: 15, level: 0, icon: 'cpu' },
        { id: 2, name: 'Quantum Core', cost: 500, pph: 85, level: 0, icon: 'zap' },
        { id: 3, name: 'Satellite Node', cost: 2500, pph: 450, level: 0, icon: 'satellite' },
        { id: 4, name: 'AI Server Farm', cost: 12000, pph: 2200, level: 0, icon: 'server' },
        { id: 5, name: 'Dysons Sphere', cost: 100000, pph: 15000, level: 0, icon: 'sun' }
    ]
};

window.addEventListener('load', function() {
    try {
        console.log("Initializing Cyber Clicker...");
        
        // Map elements
        els = {
            tokenBalance: document.getElementById('tokenBalance'),
            gasBalance: document.getElementById('gasBalance'),
            pphValue: document.getElementById('pphValue'),
            energyValue: document.getElementById('energyValue'),
            energyBar: document.getElementById('energyBar'),
            clickBtn: document.getElementById('clickBtn'),
            upgradeList: document.getElementById('upgradeList'),
            walletAddress: document.getElementById('walletAddress'),
            walletShort: document.getElementById('walletShort'),
            userRank: document.getElementById('userRank'),
            comboText: document.getElementById('comboText'),
            logs: document.getElementById('logs')
        };

        if (els.clickBtn) {
            els.clickBtn.addEventListener('click', handleTap);
        }

        renderUpgrades();
        startLoops();
        updateUI();
        addLog("SYSTEM ONLINE. ALL MODULES FUNCTIONAL.", "success");
        
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error("Initialization Error:", err);
        alert("O'yinni yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang.");
    }
});

function addLog(msg, type) {
    if (!els.logs) return;
    const entry = document.createElement('div');
    entry.style.color = type === 'success' ? '#00ff88' : (type === 'error' ? '#ff4d4d' : 'rgba(255,255,255,0.4)');
    entry.style.marginBottom = '10px';
    entry.innerHTML = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    els.logs.prepend(entry);
}

function updateUI() {
    try {
        if (els.tokenBalance) els.tokenBalance.textContent = Math.floor(gameState.tokens).toLocaleString();
        if (els.gasBalance) els.gasBalance.textContent = gameState.gas.toFixed(3) + " ETH";
        if (els.pphValue) els.pphValue.textContent = "+" + gameState.pph.toLocaleString() + " / HR";
        if (els.energyValue) els.energyValue.textContent = Math.floor(gameState.energy);
        if (els.energyBar) els.energyBar.style.width = (gameState.energy / gameState.maxEnergy * 100) + '%';
        
        updateRank();
        if (els.userRank) els.userRank.textContent = gameState.rank;

        if (gameState.tokens >= 100) {
            const modal = document.getElementById('restModal');
            if (modal) modal.classList.add('active');
        }
    } catch (e) {}
}

function handleTap(e) {
    if (gameState.energy < 1) return;
    
    const now = Date.now();
    const diff = now - gameState.lastClick;
    gameState.lastClick = now;

    if (diff < 300) {
        gameState.combo++;
        if (gameState.combo > 10) {
            gameState.multiplier = 2;
            if (els.comboText) els.comboText.classList.add('active');
            triggerShake();
        }
    } else {
        gameState.combo = 0;
        gameState.multiplier = 1;
        if (els.comboText) els.comboText.classList.remove('active');
    }

    const rect = els.clickBtn ? els.clickBtn.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    const x = (e && e.clientX) || (rect.left + rect.width / 2);
    const y = (e && e.clientY) || (rect.top + rect.height / 2);
    
    createParticle(x, y, "+" + (1 * gameState.multiplier));

    gameState.tokens += (1 * gameState.multiplier);
    gameState.energy -= 1;
    updateUI();
}

function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.textContent = text;
    document.body.appendChild(p);
    setTimeout(function() { p.remove(); }, 1000);
}

function triggerShake() {
    const app = document.querySelector('.app-container');
    if (app) {
        app.style.transform = 'translate(' + (Math.random() * 4 - 2) + 'px, ' + (Math.random() * 4 - 2) + 'px)';
        setTimeout(function() { app.style.transform = 'none'; }, 50);
    }
}

function startLoops() {
    setInterval(function() {
        gameState.tokens += (gameState.pph / 3600);
        updateUI();
    }, 1000);

    setInterval(function() {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 5);
            updateUI();
        }
    }, 1000);
}

function renderUpgrades() {
    if (!els.upgradeList) return;
    els.upgradeList.innerHTML = '';
    gameState.upgrades.forEach(function(u) {
        const div = document.createElement('div');
        div.className = 'upgrade-card';
        div.innerHTML = '<div class="upgrade-info">' +
            '<div style="display:flex; align-items:center; gap:12px;">' +
            '<i data-lucide="' + u.icon + '" style="color:var(--primary); width:24px;"></i>' +
            '<h3>' + u.name + '</h3>' +
            '</div>' +
            '<p>Level ' + u.level + ' • <span style="color:#00ff88">+' + u.pph + ' /hr</span></p>' +
            '</div>' +
            '<button class="price-tag" onclick="buyUpgrade(' + u.id + ')">' +
            u.cost.toLocaleString() +
            '</button>';
        els.upgradeList.appendChild(div);
    });
    if (window.lucide) lucide.createIcons();
}

function buyUpgrade(id) {
    const u = gameState.upgrades.find(function(up) { return up.id === id; });
    if (gameState.tokens >= u.cost) {
        gameState.tokens -= u.cost;
        u.level++;
        gameState.pph += u.pph;
        u.cost = Math.floor(u.cost * 1.7);
        addLog("UPGRADE SUCCESS: " + u.name, "success");
        renderUpgrades();
        updateUI();
    } else {
        addLog("INSUFFICIENT CREDITS.", "error");
    }
}

function switchView(id, el) {
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    document.querySelectorAll('.dock-item').forEach(function(d) { d.classList.remove('active'); });
    
    const target = document.getElementById('view-' + id);
    if (target) target.classList.add('active');
    
    if (el) el.classList.add('active');
}

function updateRank() {
    const t = gameState.tokens;
    if (t > 1000000) gameState.rank = 'Diamond Overlord';
    else if (t > 100000) gameState.rank = 'Platinum Archon';
    else if (t > 25000) gameState.rank = 'Gold Master';
    else if (t > 5000) gameState.rank = 'Silver Tech';
}

function resetGame() {
    gameState.tokens = 0;
    gameState.pph = 0;
    gameState.energy = 1000;
    gameState.rank = 'Bronze Miner';
    gameState.combo = 0;
    gameState.multiplier = 1;
    gameState.upgrades.forEach(function(u) {
        u.level = 0;
        if (u.id === 1) u.cost = 100;
        if (u.id === 2) u.cost = 500;
        if (u.id === 3) u.cost = 2500;
        if (u.id === 4) u.cost = 12000;
        if (u.id === 5) u.cost = 100000;
    });
    const modal = document.getElementById('restModal');
    if (modal) modal.classList.remove('active');
    renderUpgrades();
    updateUI();
    addLog("GAME RESTARTED.", "success");
}

function simulateAirdrop() {
    addLog("INITIATING AIRDROP...", "success");
    setTimeout(function() {
        gameState.tokens += 500;
        addLog("AIRDROP SECURED: +500 GLX", "success");
        updateUI();
    }, 1500);
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            const acts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = acts[0];
            if (els.walletAddress) els.walletAddress.textContent = userAccount;
            if (els.walletShort) els.walletShort.textContent = userAccount.slice(0, 8).toUpperCase();
            addLog("CONNECTED: " + userAccount, "success");
        } catch (e) {
            addLog("CONNECTION DENIED.", "error");
        }
    } else {
        userAccount = "0x" + Math.random().toString(16).slice(2, 10);
        if (els.walletAddress) els.walletAddress.textContent = userAccount + "... (DEMO)";
        if (els.walletShort) els.walletShort.textContent = "DEMO_MODE";
        addLog("DEMO MODE ACTIVE.", "success");
    }
}

function resetGame() {
    gameState.tokens = 0;
    gameState.pph = 0;
    gameState.energy = 1000;
    gameState.rank = 'Bronze Miner';
    gameState.combo = 0;
    gameState.multiplier = 1;
    
    // Reset Upgrades
    gameState.upgrades.forEach(u => {
        u.level = 0;
        // Reset costs to original (approximate logic based on current config)
        if (u.id === 1) u.cost = 100;
        if (u.id === 2) u.cost = 500;
        if (u.id === 3) u.cost = 2500;
        if (u.id === 4) u.cost = 12000;
        if (u.id === 5) u.cost = 100000;
    });

    document.getElementById('restModal').classList.remove('active');
    renderUpgrades();
    updateUI();
    addLog("O'yin yangidan boshlandi. Omad!", 'success');
}

function updateRank() {
    const t = gameState.tokens;
    if (t > 1000000) gameState.rank = 'Diamond Overlord';
    else if (t > 100000) gameState.rank = 'Platinum Archon';
    else if (t > 25000) gameState.rank = 'Gold Master';
    else if (t > 5000) gameState.rank = 'Silver Tech';
}

// TAP LOGIC
els.clickBtn.addEventListener('click', (e) => {
    if (gameState.energy < 1) return;
    
    const now = Date.now();
    const diff = now - gameState.lastClick;
    gameState.lastClick = now;

    // Combo Logic
    if (diff < 300) {
        gameState.combo++;
        if (gameState.combo > 10) {
            gameState.multiplier = 2;
            els.comboText.classList.add('active');
            triggerShake();
        }
    } else {
        gameState.combo = 0;
        gameState.multiplier = 1;
        els.comboText.classList.remove('active');
    }

    // Effects
    const rect = els.clickBtn.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);
    createParticle(x, y, `+${1 * gameState.multiplier}`);

    // State
    gameState.tokens += (1 * gameState.multiplier);
    gameState.energy -= 1;
    updateUI();
});

function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.textContent = text;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
}

function triggerShake() {
    const app = document.querySelector('.app-container');
    app.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
    setTimeout(() => app.style.transform = 'none', 50);
}

// GAME LOOPS
function startLoops() {
    setInterval(() => {
        gameState.tokens += (gameState.pph / 3600);
        updateUI();
    }, 1000);

    setInterval(() => {
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 5);
            updateUI();
        }
    }, 1000);
}

// UPGRADES
function renderUpgrades() {
    els.upgradeList.innerHTML = '';
    gameState.upgrades.forEach(u => {
        const div = document.createElement('div');
        div.className = 'upgrade-card';
        div.innerHTML = `
            <div class="upgrade-info">
                <div style="display:flex; align-items:center; gap:12px;">
                    <i data-lucide="${u.icon}" style="color:var(--primary); width:24px;"></i>
                    <h3>${u.name}</h3>
                </div>
                <p>Level ${u.level} • <span style="color:#00ff88">+${u.pph} /hr</span></p>
            </div>
            <button class="price-tag" onclick="buyUpgrade(${u.id})">
                ${u.cost.toLocaleString()}
            </button>
        `;
        els.upgradeList.appendChild(div);
    });
    if (window.lucide) lucide.createIcons();
}

function buyUpgrade(id) {
    const u = gameState.upgrades.find(up => up.id === id);
    if (gameState.tokens >= u.cost) {
        gameState.tokens -= u.cost;
        u.level++;
        gameState.pph += u.pph;
        u.cost = Math.floor(u.cost * 1.7);
        addLog(`UPGRADE SUCCESS: ${u.name} LVL ${u.level}`, 'success');
        renderUpgrades();
        updateUI();
    } else {
        addLog("INSUFFICIENT CREDITS FOR UPGRADE.", 'error');
    }
}

// NAVIGATION
function switchView(id, el) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(d => d.classList.remove('active'));
    
    const targetView = document.getElementById(`view-${id}`);
    if (targetView) targetView.classList.add('active');
    
    if (el) {
        el.classList.add('active');
    } else {
        // Fallback for initial load or programmatic calls
        const navItems = document.querySelectorAll('.dock-item');
        if (id === 'mine') navItems[0].classList.add('active');
        if (id === 'upgrades') navItems[1].classList.add('active');
        if (id === 'web3') navItems[2].classList.add('active');
    }
}

// WEB3
async function connectWallet() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            const acts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = acts[0];
            els.walletAddress.textContent = userAccount;
            els.walletShort.textContent = userAccount.slice(0, 8).toUpperCase();
            addLog("AUTHORIZED: " + userAccount, 'success');
        } catch (e) {
            addLog("AUTHORIZATION REJECTED.", 'error');
        }
    } else {
        userAccount = "0x" + Math.random().toString(16).slice(2, 42);
        els.walletAddress.textContent = userAccount + " (SIMULATED)";
        els.walletShort.textContent = "GUEST_USER";
        addLog("RUNNING IN SIMULATION MODE.", 'success');
    }
}

function simulateAirdrop() {
    addLog("INITIATING AIRDROP PROTOCOL...", 'success');
    let count = 0;
    const interval = setInterval(() => {
        addLog(`DECRYPTING BLOCK ${Math.floor(Math.random()*999)}...`);
        count++;
        if (count > 3) {
            clearInterval(interval);
            const reward = 500;
            gameState.tokens += reward;
            addLog(`AIRDROP SECURED: +${reward} GLX!`, 'success');
            updateUI();
        }
    }, 800);
}




