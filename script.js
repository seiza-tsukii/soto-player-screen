// Base de données des compétences
const abilitiesDB = {
    // Compétences actives
    "Coup d'épée": {
        type: "active",
        description: "Une attaque basique avec votre arme",
        manaCost: 0,
        vitCost: 1,
        effect: "Inflige ATQ x 1.2 dégâts physiques"
    },
    "Flèche précise": {
        type: "active",
        description: "Une flèche précise qui ne manque jamais sa cible",
        manaCost: 5,
        vitCost: 0,
        effect: "Inflige ATQ x 1.5 dégâts physiques"
    },
    "Soin léger": {
        type: "active",
        description: "Soigne vos blessures",
        manaCost: 15,
        vitCost: 0,
        effect: "Restaure PV max x 0.3"
    },
    "Bouclier magique": {
        type: "active",
        description: "Crée un bouclier protecteur",
        manaCost: 20,
        vitCost: 5,
        effect: "Absorbe MAG x 2 dégâts pendant 2 tours"
    },

    // Passifs
    "Résistance": {
        type: "passive",
        description: "Votre peau durcie réduit les dégâts",
        effect: "Réduit les dégâts reçus de 10%"
    },
    "Régénération": {
        type: "passive",
        description: "Votre corps se soigne naturellement",
        effect: "Régénère 5% PV par tour"
    },
    "Concentration": {
        type: "passive",
        description: "Vous vous concentrez pour des attaques plus précises",
        effect: "+15% chance de coup critique"
    },
    "Instinct de survie": {
        type: "passive",
        description: "Vos réflexes s'aiguisent en situation dangereuse",
        effect: "+20% VIT quand PV < 30%"
    },

    // Ultimes
    "Frappe ultime": {
        type: "ultimate",
        description: "Déchaîne toute votre puissance en une attaque dévastatrice",
        passionCost: 5,
        effect: "Inflige ATQ x 3 + MAG x 1.5 dégâts"
    },
    "Résurrection": {
        type: "ultimate",
        description: "Un dernier souffle pour revenir au combat",
        passionCost: 5,
        effect: "Revive avec 50% PV quand KO"
    },
    "Tempête destructrice": {
        type: "ultimate",
        description: "Déclenche une tempête magique dévastatrice",
        passionCost: 5,
        effect: "Inflige MAG x 4 dégâts à tous les ennemis"
    }
};

// État du joueur
const player = {
    name: "Tristan",
    level: 1,
    xp: 0,
    maxXP: 100,
    stats: {
        ATQ: 10,
        MAG: 8,
        DEF: 12,
        VIT: 14
    },
    resources: {
        maxHP: 50,
        currentHP: 50,
        maxMP: 30,
        currentMP: 30,
        maxVIT: 20,
        currentVIT: 20,
        currentALT: 0
    },
    passionPoints: 0,
    abilities: [],
    passives: [],
    ultimate: null,
    status: [],
    stacks: [],
    hand: [],
    deck: [],
    markedStat: null // Nouvelle propriété pour la stat marquée
};

// Initialisation
function init() {
    setupSelectors();
    initEventListeners();
    updateAllDisplays();
    initCardSystem();
    
    // Exposer les fonctions nécessaires
    window.removeAbility = removeAbility;
    window.removePassive = removePassive;
    window.removeUltimate = removeUltimate;
    window.removeStatusEffect = removeStatusEffect;
    window.removeStackEffect = removeStackEffect;
    window.saveGame = saveGame;
    window.loadGame = loadGame;
    window.getActiveStat = getActiveStat;
    window.incrementStatusTurns = incrementStatusTurns;
    window.decrementStatusTurns = decrementStatusTurns;
    window.incrementStackValue = incrementStackValue;
    window.decrementStackValue = decrementStackValue;
}

function setupSelectors() {
    const activeSelector = document.querySelector('.ability-selector');
    const passiveSelector = document.querySelector('.passive-selector');
    const ultimateSelector = document.querySelector('.ultimate-selector');

    // Vider les sélecteurs
    activeSelector.innerHTML = '<option value="">Choisir une compétence</option>';
    passiveSelector.innerHTML = '<option value="">Choisir un passif</option>';
    ultimateSelector.innerHTML = '<option value="">Choisir une ultime</option>';

    // Remplir les sélecteurs
    Object.entries(abilitiesDB).forEach(([name, data]) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;

        if (data.type === "active") {
            activeSelector.appendChild(option.cloneNode(true));
        } 
        if (data.type === "passive") {
            passiveSelector.appendChild(option.cloneNode(true));
        } 
        if (data.type === "ultimate") {
            ultimateSelector.appendChild(option.cloneNode(true));
        }
    });
}

function initEventListeners() {
    // Compétences
    document.querySelector('.add-ability').addEventListener('click', addSelectedAbility);
    
    // Passifs
    document.querySelector('.add-passive').addEventListener('click', addSelectedPassive);
    
    // Ultime
    document.querySelector('.add-ultimate').addEventListener('click', addSelectedUltimate);
    
    // Points de Passion
    document.querySelectorAll('.passion-stars .star').forEach((star, index) => {
        star.addEventListener('click', () => updatePP(index + 1));
    });
    
    // XP Circles
    document.querySelectorAll('.xp-circle').forEach(circle => {
        circle.addEventListener('click', function() {
            const targetXP = parseInt(this.dataset.xp) * 20;
            updateXP(targetXP);
        });
    });
    
    // Système de cartes
    document.querySelector('.draw-cards').addEventListener('click', drawInitialHand);
    document.querySelector('.reshuffle-cards').addEventListener('click', reshuffleHand);
    document.querySelector('.draw-one-card').addEventListener('click', drawOneCard);
    
    // Dés
    document.querySelector('.roll-d20').addEventListener('click', rollD20);
    
    // Stats
    document.querySelectorAll('.player-stats input').forEach(input => {
        input.addEventListener('change', updateStats);
    });
    
    // Ressources
    document.querySelectorAll('.player-resources input').forEach(input => {
        input.addEventListener('change', updateResources);
    });
    
    // Contrôles de niveau
    document.querySelector('.level-increase').addEventListener('click', () => {
        player.level = Math.min(20, player.level + 1);
        updatePlayerInfo();
    });
    
    document.querySelector('.level-decrease').addEventListener('click', () => {
        player.level = Math.max(1, player.level - 1);
        updatePlayerInfo();
    });
    
    // Boutons d'ajout de statuts et cumuls
    document.querySelector('.add-status').addEventListener('click', () => {
        addStatusEffect("Nouveau statut", 1);
    });
    
    document.querySelector('.add-stack').addEventListener('click', () => {
        addStackEffect("Nouveau cumul", 1);
    });
    
    // Gestion des marqueurs de stats
    document.querySelectorAll('.stat-marker').forEach(marker => {
        marker.addEventListener('click', function() {
            const statLabel = this.nextElementSibling.textContent;
            const isActive = this.classList.contains('active');
            
            // Désactiver tous les marqueurs d'abord
            document.querySelectorAll('.stat-marker').forEach(m => {
                m.classList.remove('active');
                m.classList.add('empty');
            });
            
            // Activer seulement si ce n'était pas déjà actif
            if (!isActive) {
                this.classList.remove('empty');
                this.classList.add('active');
                player.markedStat = statLabel;
            } else {
                player.markedStat = null;
            }
        });
    });
}

function updateAllDisplays() {
    updatePlayerInfo();
    updateStatsDisplay();
    updateResourcesDisplay();
    updatePPDisplay();
    updateXPDisplay();
    renderAbilities();
    renderStatusEffects();
    updateMarkedStatDisplay();
}

function updatePlayerInfo() {
    document.querySelector('.player-name').textContent = player.name;
    document.querySelector('.level-value').textContent = player.level;
}

function updateStatsDisplay() {
    document.querySelectorAll('.stat-value').forEach(input => {
        const statName = input.closest('.stat').querySelector('.stat-label').textContent;
        input.value = player.stats[statName];
    });
}

function updateMarkedStatDisplay() {
    document.querySelectorAll('.stat-marker').forEach(marker => {
        const statLabel = marker.nextElementSibling.textContent;
        marker.classList.remove('active', 'empty');
        
        if (player.markedStat === statLabel) {
            marker.classList.add('active');
        } else {
            marker.classList.add('empty');
        }
    });
}

function updateResourcesDisplay() {
    // PV
    const hpGauge = document.querySelector('.hp-gauge');
    const hpPercentage = (player.resources.currentHP / player.resources.maxHP) * 100;
    hpGauge.style.width = `${hpPercentage}%`;
    
    // Mana
    const mpGauge = document.querySelector('.mp-gauge');
    const mpPercentage = (player.resources.currentMP / player.resources.maxMP) * 100;
    mpGauge.style.width = `${mpPercentage}%`;
    
    // Vitalité
    const vitGauge = document.querySelector('.vit-gauge');
    const vitPercentage = (player.resources.currentVIT / player.resources.maxVIT) * 100;
    vitGauge.style.width = `${vitPercentage}%`;
    
    // Altération
    const altGauge = document.querySelector('.alt-gauge');
    altGauge.style.width = `${Math.min(100, player.resources.currentALT)}%`;
}

function updatePPDisplay() {
    const stars = document.querySelectorAll('.passion-stars .star');
    stars.forEach((star, index) => {
        if (index < player.passionPoints) {
            star.classList.remove('empty');
        } else {
            star.classList.add('empty');
        }
    });
    
    if (player.passionPoints === 5) {
        ensureUltimateInHand();
    }
}

function updateXPDisplay() {
    const circles = document.querySelectorAll('.xp-circle');
    const xpPerLevel = player.maxXP;
    const currentLevelXP = player.xp % xpPerLevel;
    const filledCircles = Math.floor((currentLevelXP / xpPerLevel) * circles.length);

    circles.forEach((circle, index) => {
        circle.classList.toggle('filled', index < filledCircles);
    });

    document.querySelector('.current-level').textContent = player.level;
}

function addSelectedAbility() {
    const selector = document.querySelector('.ability-selector');
    const abilityName = selector.value;
    
    if (!abilityName || !abilitiesDB[abilityName] || abilitiesDB[abilityName].type !== "active") {
        alert("Veuillez sélectionner une compétence active valide");
        return;
    }
    
    player.abilities.push(abilityName);
    renderAbilities();
    initCardSystem();
}

function addSelectedPassive() {
    const selector = document.querySelector('.passive-selector');
    const passiveName = selector.value;
    
    if (!passiveName || !abilitiesDB[passiveName] || abilitiesDB[passiveName].type !== "passive") {
        alert("Veuillez sélectionner un passif valide");
        return;
    }
    
    if (player.passives.length >= 3) {
        alert("Maximum 3 passifs autorisés!");
        return;
    }
    
    player.passives.push(passiveName);
    renderAbilities();
}

function addSelectedUltimate() {
    const selector = document.querySelector('.ultimate-selector');
    const ultimateName = selector.value;
    
    if (!ultimateName || !abilitiesDB[ultimateName] || abilitiesDB[ultimateName].type !== "ultimate") {
        alert("Veuillez sélectionner une ultime valide");
        return;
    }
    
    player.ultimate = ultimateName;
    renderAbilities();
    initCardSystem();
}

function removeAbility(abilityName) {
    player.abilities = player.abilities.filter(a => a !== abilityName);
    renderAbilities();
    initCardSystem();
}

function removePassive(passiveName) {
    player.passives = player.passives.filter(p => p !== passiveName);
    renderAbilities();
}

function removeUltimate() {
    player.ultimate = null;
    renderAbilities();
    initCardSystem();
}

function renderAbilities() {
    const abilityList = document.querySelector('.ability-list');
    const passiveList = document.querySelector('.passive-list');
    const ultimateList = document.querySelector('.ultimate-list');

    // Compétences actives
    abilityList.innerHTML = player.abilities.map(name => {
        const ability = abilitiesDB[name];
        return `
            <div class="ability-item">
                <div class="ability-header">
                    <span class="ability-name">${name}</span>
                    <span class="remove-ability" onclick="removeAbility('${name}')">×</span>
                </div>
                <div class="ability-cost">
                    Coût: ${ability.manaCost} Mana, ${ability.vitCost} Vitalité
                </div>
                <div class="ability-desc">${ability.description}</div>
                <div class="ability-effect">Effet: ${ability.effect}</div>
            </div>
        `;
    }).join('') || '<p>Aucune compétence active sélectionnée</p>';

    // Passifs
    passiveList.innerHTML = player.passives.map(name => {
        const passive = abilitiesDB[name];
        return `
            <div class="passive-item">
                <div class="passive-header">
                    <span class="passive-name">${name}</span>
                    <span class="remove-passive" onclick="removePassive('${name}')">×</span>
                </div>
                <div class="passive-desc">${passive.description}</div>
                <div class="passive-effect">Effet: ${passive.effect}</div>
            </div>
        `;
    }).join('') || '<p>Aucun passif sélectionné</p>';

    // Ultime
    ultimateList.innerHTML = player.ultimate ? `
        <div class="ultimate-item">
            <div class="ultimate-header">
                <span class="ultimate-name">${player.ultimate}</span>
                <span class="remove-ultimate" onclick="removeUltimate()">×</span>
            </div>
            <div class="ultimate-cost">
                Coût: ${abilitiesDB[player.ultimate].passionCost} Passion
            </div>
            <div class="ultimate-desc">${abilitiesDB[player.ultimate].description}</div>
            <div class="ultimate-effect">Effet: ${abilitiesDB[player.ultimate].effect}</div>
        </div>
    ` : '<p>Aucune ultime sélectionnée</p>';
}

function updateStats() {
    document.querySelectorAll('.stat-value').forEach(input => {
        const statName = input.closest('.stat').querySelector('.stat-label').textContent;
        player.stats[statName] = parseInt(input.value) || 0;
    });
}

function updateResources() {
    // PV
    player.resources.currentHP = parseInt(document.querySelector('.current-hp').value) || 0;
    player.resources.maxHP = parseInt(document.querySelector('.max-hp').value) || 1;
    
    // Mana
    player.resources.currentMP = parseInt(document.querySelector('.current-mp').value) || 0;
    player.resources.maxMP = parseInt(document.querySelector('.max-mp').value) || 1;
    
    // Vitalité
    player.resources.currentVIT = parseInt(document.querySelector('.current-vit').value) || 0;
    player.resources.currentALT = parseInt(document.querySelector('.current-alt').value) || 0;
    
    updateResourcesDisplay();
}

function updatePP(newPP) {
    player.passionPoints = (player.passionPoints === newPP) ? 0 : newPP;
    updatePPDisplay();
}

function updateXP(newXP) {
    player.xp = newXP;
    const newLevel = Math.floor(newXP / player.maxXP) + 1;
    
    if (newLevel > player.level) {
        player.level = newLevel;
        player.maxXP = Math.floor(player.maxXP * 1.2);
        alert(`Niveau ${player.level} atteint!`);
    }
    
    updateXPDisplay();
    updatePlayerInfo();
}

function addStatusEffect(name = "Nouveau statut", turns = 1) {
    player.status.push({ name, turns });
    renderStatusEffects();
}

function removeStatusEffect(index) {
    player.status.splice(index, 1);
    renderStatusEffects();
}

function addStackEffect(name = "Nouveau cumul", value = 1) {
    player.stacks.push({ name, value });
    renderStatusEffects();
}

function removeStackEffect(index) {
    player.stacks.splice(index, 1);
    renderStatusEffects();
}

// Fonctions pour gérer les tours des statuts
function incrementStatusTurns(index) {
    player.status[index].turns++;
    renderStatusEffects();
}

function decrementStatusTurns(index) {
    if (player.status[index].turns > 1) {
        player.status[index].turns--;
        renderStatusEffects();
    }
}

// Fonctions pour gérer les valeurs des cumuls
function incrementStackValue(index) {
    player.stacks[index].value++;
    renderStatusEffects();
}

function decrementStackValue(index) {
    if (player.stacks[index].value > 0) {
        player.stacks[index].value--;
        renderStatusEffects();
    }
}

function renderStatusEffects() {
    const statusList = document.querySelector('.status-list');
    const stacksList = document.querySelector('.stacks-list');

    statusList.innerHTML = player.status.map((status, index) => `
        <div class="status-item">
            <input type="text" class="status-name" value="${status.name}">
            <div class="status-controls">
                <button onclick="decrementStatusTurns(${index})">-</button>
                <span><span class="status-turns">${status.turns}</span></span>
                <button onclick="incrementStatusTurns(${index})">+</button>
                <span class="remove-status" onclick="removeStatusEffect(${index})">×</span>
            </div>
        </div>
    `).join('') || '<p>Aucun statut actif</p>';

    stacksList.innerHTML = player.stacks.map((stack, index) => `
        <div class="stack-item">
            <input type="text" class="stack-name" value="${stack.name}">
            <div class="stack-controls">
                <button onclick="decrementStackValue(${index})">-</button>
                <span><span class="stack-value">${stack.value}</span></span>
                <button onclick="incrementStackValue(${index})">+</button>
                <span class="remove-stack" onclick="removeStackEffect(${index})">×</span>
            </div>
        </div>
    `).join('') || '<p>Aucun cumul actif</p>';
}

function initCardSystem() {
    player.deck = [...player.abilities];
    player.hand = [];
    updateHandDisplay();
}

function drawInitialHand() {
    if (player.hand.length >= 20) return;
    
    player.hand = [];
    for (let i = 0; i < 6; i++) {
        drawCard();
    }
    updateHandDisplay();
}

function reshuffleHand() {
    player.deck = [...player.deck, ...player.hand];
    player.hand = [];
    drawInitialHand();
}

function drawOneCard() {
    if (player.hand.length >= 20) return;
    drawCard();
    updateHandDisplay();
}

function drawCard() {
    if (player.deck.length === 0) {
        player.deck = [...player.abilities];
        if (player.deck.length === 0) return;
    }
    
    const randomIndex = Math.floor(Math.random() * player.deck.length);
    const cardName = player.deck[randomIndex];
    player.deck.splice(randomIndex, 1);
    player.hand.push(cardName);
}

function ensureUltimateInHand() {
    if (!player.ultimate || player.hand.includes(player.ultimate)) return;
    
    if (player.hand.length > 0) {
        const replaceIndex = Math.floor(Math.random() * player.hand.length);
        player.hand[replaceIndex] = player.ultimate;
    } else {
        player.hand.push(player.ultimate);
    }
    updateHandDisplay();
}

function updateHandDisplay() {
    const cardsContainer = document.querySelector('.cards-container');
    cardsContainer.innerHTML = '';
    
    // Compter les cartes identiques
    const cardCounts = {};
    player.hand.forEach(cardName => {
        cardCounts[cardName] = (cardCounts[cardName] || 0) + 1;
    });
    
    // Afficher chaque carte unique avec son compteur
    Object.keys(cardCounts).forEach(cardName => {
        const ability = abilitiesDB[cardName];
        if (!ability) return;
        
        const count = cardCounts[cardName];
        const cardEl = document.createElement('div');
        cardEl.className = `card ${ability.type === "ultimate" ? "ultimate" : ""}`;
        cardEl.innerHTML = `
            <div class="card-name">${cardName}</div>
            <div class="card-desc">${ability.effect}</div>
            <div class="card-cost">${
                ability.type === "ultimate" ? 
                `${ability.passionCost} Passion` : 
                `${ability.manaCost} Mana, ${ability.vitCost} Vitalité`
            }</div>
            ${count > 1 ? `<div class="card-count">x${count}</div>` : ''}
        `;
        
        cardEl.addEventListener('click', () => useCard(cardName));
        cardsContainer.appendChild(cardEl);
    });
    
    document.querySelector('.cards-amount').textContent = player.hand.length;
}

function useCard(cardName) {
    const count = player.hand.filter(c => c === cardName).length;
    player.hand = player.hand.filter(card => card !== cardName);
    const ability = abilitiesDB[cardName];
    
    alert(`Utilisation de ${cardName} (x${count})!\n${ability.effect}`);
    updateHandDisplay();
}

function rollD20() {
    const result = Math.floor(Math.random() * 20) + 1;
    document.querySelector('.d20-result').textContent = result;
}

function saveGame() {
    localStorage.setItem('jdrPlayerData', JSON.stringify(player));
    alert('Partie sauvegardée !');
}

function loadGame() {
    const savedData = localStorage.getItem('jdrPlayerData');
    if (savedData) {
        Object.assign(player, JSON.parse(savedData));
        updateAllDisplays();
        initCardSystem();
        alert('Partie chargée !');
    } else {
        alert('Aucune sauvegarde trouvée');
    }
}

function getActiveStat() {
    return player.markedStat;
}

// Initialiser l'application
window.onload = init;