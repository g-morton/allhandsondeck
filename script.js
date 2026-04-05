document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-button');
    const startPanel = document.getElementById('start-panel');
    const gamePanel = document.getElementById('game-panel');
    const canvas = document.getElementById('game-canvas');
    const episodeTitle = document.getElementById('episode-title');
    const narrationBox = document.getElementById('narration-box');
    const narrationSpeaker = document.getElementById('narration-speaker');
    const narrationText = document.getElementById('narration-text');
    const narrationNextButton = document.getElementById('narration-next-button');
    const speechBubble = document.getElementById('speech-bubble');
    const speechSpeaker = document.getElementById('speech-speaker');
    const speechText = document.getElementById('speech-text');
    const interactionPanel = document.getElementById('interaction-panel');
    const interactionTitle = document.getElementById('interaction-title');
    const interactionText = document.getElementById('interaction-text');
    const interactionChoices = document.getElementById('interaction-choices');
    const interactionFooter = document.getElementById('interaction-footer');
    const episodeSummary = document.getElementById('episode-summary');
    const episodeSummaryTitle = document.getElementById('episode-summary-title');
    const episodeSummaryBody = document.getElementById('episode-summary-body');
    const nextEpisodeButton = document.getElementById('next-episode-button');
    const skipEpisodeButton = document.getElementById('skip-episode-button');
    const ctx = canvas.getContext('2d');

    // --- Game assets ---
	    let deckImage = new Image();
	    let shipImage = new Image();
	    let blankOfficerImage = new Image();
	    let destinationImage = new Image();
	    const effectImageCache = {};
	    let officerImages = [];
    let officers = [];
    let slots = [];
    let sidePositions = [];
    let stars = [];

    const maxShipStatValue = 100;
    const shipState = {
        hull: maxShipStatValue,
        power: maxShipStatValue,
        personnel: maxShipStatValue,
        technology: 0,
        experience: 0
    };
    const layoutConfig = {
        sideOfficerWidth: 66,
        sideOfficerHeight: 110,
        deckOfficerWidth: 92,
        deckOfficerHeight: 153,
        sideHoverScale: 1.14,
        sideRowSpacing: 164,
        sideColumnGap: 72,
        sideLeftX: 86,
        sideRightOffset: 236,
        slotOffsetX: 46,
        slotHitToleranceX: 50,
        slotHitToleranceY: 70,
        chairWidth: 45,
        heartSize: 7,
        heartGap: 6,
        nameOffsetY: 25,
        chevronOffsetY: 44,
        roleLabelOffsetY: 15,
        slotLabelOffsetY: 20,
        slotEffectOffsetY: 35,
        shipWidth: 300,
        shipHeight: 150,
        shipBobAmplitude: 20,
        starCount: 40
    };
    const cinematicTiming = {
        introStarfieldHoldMs: 2000,
        introTitleBeatMs: 5000,
        introPostTitleHoldMs: 2000,
        shipFadeMs: 2000,
        outroSummaryDelayMs: 3400
    };
    const chairCombatProfiles = {
        Science: { muscle: 0.7, smartz: 1.45, style: 'Out-think them' },
        Helm: { muscle: 1.1, smartz: 0.95, style: 'Out-fly them' },
        Captain: { muscle: 1.0, smartz: 1.0, style: 'Out-command them' },
        Tactical: { muscle: 1.45, smartz: 0.72, style: 'Out-punch them' },
        Engineering: { muscle: 0.95, smartz: 1.25, style: 'Out-build them' }
    };
    const viewAreaHeightRatio = 0.43;
    const managementAreaTopRatio = viewAreaHeightRatio;
    let officerScale = 1;
    let cachedShipStats = null;
    let shipStatsDirty = true;
    let activeEpisode = null;
    let episodeStepIndex = 0;
    let episodeTimeoutId = null;
    let episodeMode = 'free';
    let episodeWaitCondition = null;
    let isAwaitingNarrationAdvance = false;
    const voiceClipPaths = Array.from({ length: 25 }, (_, index) => `assets/sound/voice-${index + 1}.mp3`);
    const weaponsResponseClipPaths = Array.from({ length: 4 }, (_, index) => `assets/sound/weapons-${index + 1}.mp3`);
    const scienceResponseClipPaths = Array.from({ length: 4 }, (_, index) => `assets/sound/science-${index + 1}.mp3`);
    let activeVoiceAudio = null;
    let activeEpisodeAudio = null;
    let activeUiAudio = null;
    let activeSpeechOfficer = null;
    let hoveredSideOfficerIndex = -1;
    let hoveredEncounterSlot = null;
	    let currentEpisodeIndex = 0;
	    let shipOpacity = 1;
	    let targetShipOpacity = 1;
    let activeDestination = null;
    let activeDestinationImagePath = '';
    let activeTravelDurationMs = 0;
    let travelStepStartedAt = 0;
	    let activeEncounterStep = null;
	    let activeCombatEncounter = null;
	    let uiTimeoutIds = [];
	    let promotionBursts = [];
	    let activeShipOverlay = null;
        let activeInteractionPanelClass = '';

    let animationId = null;
    let lastFrameTime = null;

    startButton.addEventListener('click', function() {
        startPanel.classList.add('hidden');
        gamePanel.classList.remove('hidden');
        resizeCanvas();
        loadImages();
        initializeGameState();
        updateLayout();
        populateOfficers();
        hideEpisodeSummary();
        startAnimation();
        startEpisode(0);
    });

    if (nextEpisodeButton) {
        nextEpisodeButton.addEventListener('click', function() {
            const nextEpisodeIndex = currentEpisodeIndex + 1;
            if (nextEpisodeIndex >= episodes.length) {
                return;
            }

            hideEpisodeSummary();
            startEpisode(nextEpisodeIndex);
        });
    }

    if (skipEpisodeButton) {
        skipEpisodeButton.addEventListener('click', function() {
            const nextEpisodeIndex = currentEpisodeIndex + 1;
            if (nextEpisodeIndex >= episodes.length) {
                return;
            }

            resetEpisodePresentation();
            startEpisode(nextEpisodeIndex);
        });
    }

    if (narrationNextButton) {
        narrationNextButton.addEventListener('click', function() {
            if (!isAwaitingNarrationAdvance || !activeEpisode) {
                return;
            }

            clearEpisodeTimeout();
            isAwaitingNarrationAdvance = false;
            runNextEpisodeStep();
        });
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', () => {
        resizeCanvas();
        updateLayout();
        repositionOfficers();
        draw();
    });

	    function loadImages() {
	        // Load images
	        deckImage.src = 'assets/images/deck.png';
	        shipImage.src = 'assets/images/ship.png';
	        blankOfficerImage.src = 'assets/images/officer-blank.png';
	        destinationImage.src = 'assets/images/spacestation.png';
	    }

	    function initializeGameState() {
	        // Starfield
	        stars = [];
	        for (let i = 0; i < layoutConfig.starCount; i++) {
	            stars.push({
	                x: Math.random() * canvas.width,
	                y: Math.random() * canvas.height,
	                speed: 0.5 + Math.random() * 1.5,
	                size: 1 + Math.random() * 1.5
	            });
	        }
	    }

    function updateLayout() {
        officerScale = Math.min(canvas.width / 1200, canvas.height / 800);
        // Side positions: two columns on each side, vertically centered in the lower management area.
        const nextSidePositions = [];
        const mgmtTop = canvas.height * managementAreaTopRatio;
        const mgmtHeight = canvas.height - mgmtTop;
        const rowSpacing = layoutConfig.sideRowSpacing * officerScale;
        const columnGap = layoutConfig.sideColumnGap * officerScale;
        const marginY = Math.max(mgmtTop, mgmtTop + (mgmtHeight - rowSpacing) / 2);
        const leftX = layoutConfig.sideLeftX * officerScale;
        const rightX = canvas.width - layoutConfig.sideRightOffset * officerScale;
        for (let row = 0; row < 2; row++) {
            const y = marginY + row * rowSpacing;
            nextSidePositions.push({ x: leftX, y, occupied: true });
            nextSidePositions.push({ x: leftX + columnGap, y, occupied: true });
            nextSidePositions.push({ x: rightX, y, occupied: true });
            nextSidePositions.push({ x: rightX + columnGap, y, occupied: true });
        }
        sidePositions = nextSidePositions;
        // Deck slots (center 50% of the lower management area)
        const deckX = canvas.width * 0.25;
        const deckWidth = canvas.width * 0.5;
        const officerHeight = getDeckOfficerHeight();
        const slotY = mgmtTop + mgmtHeight / 2 - officerHeight / 2;
        const slotRoles = ['Science', 'Helm', 'Captain', 'Tactical', 'Engineering'];
        const nextSlots = [];
        for (let i = 0; i < 5; i++) {
            const existingSlot = slots[i];
            nextSlots.push({
                x: deckX + (i + 1) * deckWidth / 6 - layoutConfig.slotOffsetX,
                y: slotY,
                occupied: existingSlot ? existingSlot.occupied : false,
                officer: existingSlot ? existingSlot.officer : null,
                role: slotRoles[i]
            });
        }
        slots = nextSlots;
    }

    const rankValues = {
        'Cadet': 0.5,
        'Ensign': 1,
        'Lieutenant': 2,
        'Lt. Commander': 3,
        'Commander': 4,
        'Captain': 5
    };

    const chairEffectivenessByColor = {
        Science: { blue: 1, gold: 0.65, red: 0.35 },
        Helm: { gold: 1, blue: 0.65, red: 0.35 },
        Captain: { gold: 1, blue: 0.65, red: 0.35 },
        Tactical: { red: 1, gold: 0.65, blue: 0.35 },
        Engineering: { red: 1, blue: 0.65, gold: 0.35 }
    };
    const startingCrewBudget = 15;
    const rankByStartingPoints = {
        1: 'Ensign',
        2: 'Lieutenant',
        3: 'Lt. Commander',
        4: 'Commander',
        5: 'Captain'
    };
    const promotionRankOrder = ['Cadet', 'Ensign', 'Lieutenant', 'Lt. Commander', 'Commander', 'Captain'];

    function getSideOfficerWidth() {
        return layoutConfig.sideOfficerWidth * officerScale;
    }

    function getSideOfficerHeight() {
        return layoutConfig.sideOfficerHeight * officerScale;
    }

    function getDeckOfficerWidth() {
        return layoutConfig.deckOfficerWidth * officerScale;
    }

    function getDeckOfficerHeight() {
        return layoutConfig.deckOfficerHeight * officerScale;
    }

    function getSlotCenterX(slot) {
        return slot.x + getDeckOfficerWidth() / 2;
    }

    function getSlotCenterY(slot) {
        return slot.y + getDeckOfficerHeight() / 2;
    }

    function markShipStatsDirty() {
        shipStatsDirty = true;
    }

    function formatRoleLabel(role) {
        if (!role) {
            return '';
        }

        const roleLabels = {
            command: 'Command',
            navigation: 'Navigation',
            pilot: 'Pilot',
            operations: 'Operations',
            engineering: 'Engineering',
            security: 'Security',
            tactical: 'Tactical',
            communications: 'Communications',
            medical: 'Medical',
            science: 'Science'
        };

        return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1);
    }

    function clearEpisodeTimeout() {
        if (episodeTimeoutId !== null) {
            clearTimeout(episodeTimeoutId);
            episodeTimeoutId = null;
        }
    }

    function scheduleUiTimeout(callback, delayMs) {
        const timeoutId = setTimeout(() => {
            uiTimeoutIds = uiTimeoutIds.filter(id => id !== timeoutId);
            callback();
        }, delayMs);
        uiTimeoutIds.push(timeoutId);
        return timeoutId;
    }

    function clearUiTimeouts() {
        uiTimeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
        uiTimeoutIds = [];
    }

    function updateSkipEpisodeButton() {
        if (!skipEpisodeButton) {
            return;
        }

        const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;
        if (hasNextEpisode) {
            skipEpisodeButton.classList.remove('hidden');
        } else {
            skipEpisodeButton.classList.add('hidden');
        }
    }

    function setEpisodeMode(mode) {
        episodeMode = mode;
    }

    function getRandomVoicePath() {
        const voiceIndex = Math.floor(Math.random() * voiceClipPaths.length);
        return voiceClipPaths[voiceIndex];
    }

    function getRandomClipPath(paths) {
        if (!paths || paths.length === 0) {
            return '';
        }

        const clipIndex = Math.floor(Math.random() * paths.length);
        return paths[clipIndex];
    }

    function getEncounterResponseClipPath(role, options = {}) {
        if (options.responseSound === 'weapons') {
            return getRandomClipPath(weaponsResponseClipPaths);
        }
        if (options.responseSound === 'science') {
            return getRandomClipPath(scienceResponseClipPaths);
        }

        const aggressiveRoles = new Set(['Tactical']);
        return aggressiveRoles.has(role)
            ? getRandomClipPath(weaponsResponseClipPaths)
            : getRandomClipPath(scienceResponseClipPaths);
    }

    function assignOfficerVoice(officer) {
        if (!officer.voice) {
            officer.voice = getRandomVoicePath();
        }
    }

    function playOfficerVoice(officer) {
        if (!officer?.voice) {
            return;
        }

        if (activeVoiceAudio) {
            activeVoiceAudio.pause();
            activeVoiceAudio.currentTime = 0;
        }

        activeVoiceAudio = new Audio(officer.voice);
        activeVoiceAudio.play().catch(() => {
            activeVoiceAudio = null;
        });
    }

    function playOfficerResponseSound(path) {
        if (!path) {
            return;
        }

        if (activeVoiceAudio) {
            activeVoiceAudio.pause();
            activeVoiceAudio.currentTime = 0;
        }

        activeVoiceAudio = new Audio(path);
        activeVoiceAudio.play().catch(() => {
            activeVoiceAudio = null;
        });
    }

    function playEpisodeSound(path) {
        if (activeEpisodeAudio) {
            activeEpisodeAudio.pause();
            activeEpisodeAudio.currentTime = 0;
        }

        activeEpisodeAudio = new Audio(path);
        activeEpisodeAudio.play().catch(() => {
            activeEpisodeAudio = null;
        });
    }

    function playUiSound(path) {
        if (activeUiAudio) {
            activeUiAudio.pause();
            activeUiAudio.currentTime = 0;
        }

        activeUiAudio = new Audio(path);
        activeUiAudio.play().catch(() => {
            activeUiAudio = null;
        });
    }

    function getOfficerForRole(role) {
        return slots.find(slot => slot.role === role && slot.occupied && slot.officer)?.officer || null;
    }

    function areAllStationsFilled() {
        return slots.length > 0 && slots.every(slot => slot.occupied && slot.officer);
    }

	    function clearEpisodeWaitCondition() {
	        episodeWaitCondition = null;
	    }

	    function clearActiveDestination() {
	        activeDestination = null;
	        activeDestinationImagePath = '';
	        activeTravelDurationMs = 0;
	        travelStepStartedAt = 0;
	    }

	    function clearActiveShipOverlay() {
	        activeShipOverlay = null;
	    }

	    function resetEpisodePresentation() {
	        clearEpisodeTimeout();
	        clearUiTimeouts();
	        clearEpisodeWaitCondition();
	        clearActiveDestination();
	        clearActiveShipOverlay();
	        activeEncounterStep = null;
	        promotionBursts = [];
        hideEpisodeTitle();
        hideNarration();
        hideSpeechBubble();
        hideInteractionPanel();
        hideEpisodeSummary();
        setEpisodeMode('free');
        targetShipOpacity = 1;
    }

	    function setActiveDestination(destination, durationMs) {
	        if (!destination?.image) {
	            clearActiveDestination();
	            return;
	        }

	        const nextImagePath = `assets/images/${destination.image}`;
	        activeDestination = destination;
	        activeTravelDurationMs = Math.max(durationMs || 0, 1);
	        travelStepStartedAt = performance.now();
	        if (activeDestinationImagePath !== nextImagePath) {
	            activeDestinationImagePath = nextImagePath;
                destinationImage.onerror = function() {
                    if (activeDestinationImagePath === nextImagePath) {
                        clearActiveDestination();
                    }
                };
	            destinationImage.src = nextImagePath;
	        }
	    }

    function checkEpisodeProgress() {
        if (episodeWaitCondition === 'allStationsFilled' && areAllStationsFilled()) {
            clearEpisodeWaitCondition();
            setEpisodeMode('free');
            scheduleNextEpisodeStep(400);
        }
    }

    function hideEpisodeTitle() {
        episodeTitle.classList.add('hidden');
        episodeTitle.classList.remove('visible');
    }

    function showEpisodeTitle(text) {
        episodeTitle.textContent = text;
        episodeTitle.innerHTML = '';
        episodeTitle.textContent = text;
        episodeTitle.classList.remove('hidden');
        episodeTitle.classList.add('visible');
    }

    function showEpisodeTitleStack(episodeLabel, episodeTitleText, revealTitle = false) {
        episodeTitle.innerHTML = `
            <span class="title-eyebrow">${episodeLabel}</span>
            <span class="title-name${revealTitle ? ' visible' : ''}">${episodeTitleText}</span>
        `;
        episodeTitle.classList.remove('hidden');
        episodeTitle.classList.add('visible');
    }

    function getEpisodeNumberLabel(episodeIndex = currentEpisodeIndex) {
        return `Episode ${episodeIndex + 1}`;
    }

    function hideNarration() {
        isAwaitingNarrationAdvance = false;
        narrationBox.classList.add('hidden');
        narrationBox.classList.remove('visible');
    }

    function showNarration(speaker, text, options = {}) {
        const { showNextButton = false } = options;
        narrationSpeaker.textContent = speaker;
        narrationText.textContent = text;
        isAwaitingNarrationAdvance = showNextButton;
        if (narrationNextButton) {
            narrationNextButton.classList.toggle('hidden', !showNextButton);
        }
        narrationBox.classList.remove('hidden');
        narrationBox.classList.add('visible');
    }

	    function hideInteractionPanel() {
	        hoveredEncounterSlot = null;
	        activeCombatEncounter = null;
            if (activeInteractionPanelClass) {
                interactionPanel.classList.remove(activeInteractionPanelClass);
                activeInteractionPanelClass = '';
            }
	        interactionPanel.classList.add('hidden');
	        interactionPanel.classList.remove('visible');
	        interactionText.innerHTML = '';
        interactionChoices.innerHTML = '';
        if (interactionFooter) {
            interactionFooter.textContent = '';
        }
    }

	    function showInteractionPanel(title, text, options = {}) {
	        const { allowHtml = false, footer = '', className = '' } = options;
            if (activeInteractionPanelClass) {
                interactionPanel.classList.remove(activeInteractionPanelClass);
                activeInteractionPanelClass = '';
            }
            if (className) {
                interactionPanel.classList.add(className);
                activeInteractionPanelClass = className;
            }
	        interactionTitle.textContent = title || 'Bridge Response Needed';
	        if (allowHtml) {
	            interactionText.innerHTML = text || '';
        } else {
            interactionText.textContent = text || '';
        }
        if (interactionFooter) {
            interactionFooter.textContent = footer;
        }
        interactionPanel.classList.remove('hidden');
        interactionPanel.classList.add('visible');
    }

    function formatCombatStatLabel(statName) {
        return statName === 'smartz' ? 'Smartz' : 'Muscle';
    }

    function getEncounterCombatConfig(step) {
        if (!step?.combat) {
            return null;
        }

        return {
            roundsToWin: step.combat.roundsToWin || 3,
            maxRounds: step.combat.maxRounds || 5,
            enemyStats: step.combat.enemyStats || { muscle: 3, smartz: 3 },
            playerVariance: step.combat.playerVariance || 1.6,
            enemyVariance: step.combat.enemyVariance || 1.6,
            roundWinXp: step.combat.roundWinXp || 4,
            roundLossEffects: step.combat.roundLossEffects || [
                { type: 'hull', amount: -4, overlayImage: 'explosion-small.png', overlayDurationMs: 1400 },
                { type: 'personnel', amount: -5 }
            ],
            roundDelay: step.combat.roundDelay || 1600,
            introText: step.combat.introText || 'Best of five. Pick the chair you trust with your life and the paperwork.',
            selectionHint: step.combat.selectionHint || 'Click an occupied bridge chair to choose the round.',
            enemyLabel: step.combat.enemyLabel || step.object?.label || 'Enemy'
        };
    }

    function getChairCombatStats(officer, role, step) {
        const profile = chairCombatProfiles[role] || chairCombatProfiles.Captain;
        const baseScore = Math.max(0.5, getEncounterScore(officer, role, step));
        return {
            muscle: Number((baseScore * profile.muscle).toFixed(1)),
            smartz: Number((baseScore * profile.smartz).toFixed(1)),
            style: profile.style
        };
    }

    function awardOfficerEncounterExperience(officer, amount) {
        if (!officer || amount <= 0) {
            return [];
        }

        shipState.experience += amount;
        const promotions = addOfficerExperience(officer, amount) || [];
        if (promotions.length > 0) {
            triggerPromotionBursts(officer, promotions);
        }
        return promotions;
    }

    function getCombatSelectionSlots() {
        return slots.filter(slot => slot.occupied && slot.officer);
    }

    function isCombatRoleStunned(state, role) {
        return Boolean(state?.stunnedUntilRound?.[role] === state?.roundNumber);
    }

    function renderCombatChoiceButtons(state) {
        interactionChoices.innerHTML = '';
    }

	    function renderEncounterSelectionPanel(step) {
	        const combatConfig = getEncounterCombatConfig(step);
	        const enemyStats = combatConfig?.enemyStats || { muscle: 0, smartz: 0 };
	        const introMarkup = combatConfig
	            ? `
                    <div class="encounter-flow">
                        <section class="encounter-side-card">
                            <span class="encounter-side-label">Scrumble</span>
                            <span class="encounter-side-line">Choose your bridge member.</span>
                            <span class="encounter-side-line">${combatConfig.selectionHint}</span>
                            <span class="encounter-side-line">Switch chairs each round if you need to.</span>
                        </section>
                        <section class="encounter-center-card">
                            <span class="encounter-battle-label">${step.title || 'Bridge Response Needed'}</span>
                            <div class="encounter-round-label">Round 1 of ${combatConfig.maxRounds}</div>
                            <div class="encounter-scoreboard">
                                <div class="encounter-score-block">
                                    <span class="encounter-score-name">Scrumble</span>
                                    <strong>0</strong>
                                </div>
                                <div class="encounter-score-block">
                                    <span class="encounter-score-name">Incoming</span>
                                    <span class="encounter-score-meta">${combatConfig.introText}</span>
                                </div>
                                <div class="encounter-score-block enemy">
                                    <span class="encounter-score-name">${combatConfig.enemyLabel}</span>
                                    <strong>0</strong>
                                </div>
                            </div>
                        </section>
                        <section class="encounter-side-card enemy">
                            <span class="encounter-side-label">${combatConfig.enemyLabel}</span>
                            <span class="encounter-side-line">Muscle ${enemyStats.muscle.toFixed(1)}</span>
                            <span class="encounter-side-line">Smartz ${enemyStats.smartz.toFixed(1)}</span>
                            <span class="encounter-side-line">They are spoiling for trouble.</span>
                        </section>
                    </div>
	            `
	            : step.text;

	        showInteractionPanel(step.title || 'Bridge Response Needed', introMarkup, {
	            allowHtml: true,
	            footer: combatConfig?.selectionHint || 'Click an occupied bridge chair to respond.',
                className: combatConfig ? 'encounter-panel' : ''
	        });

        interactionChoices.innerHTML = '';
    }

	    function buildCombatLogMarkup(roundResults) {
        if (!roundResults || roundResults.length === 0) {
            return '<div class="combat-log-entry">No rounds played yet. Choose a chair and make this awkward.</div>';
        }

        return roundResults
            .slice()
            .reverse()
            .map(result => `
                <div class="combat-log-entry ${result.playerWon ? 'win' : 'loss'}">
                    <span class="combat-log-round">Round ${result.round} · Enemy played ${formatCombatStatLabel(result.enemyStat)}</span>
                    ${result.summary}<br>${result.comment}
                </div>
            `)
            .join('');
    }

    function renderCombatEncounterPanel(state) {
        const playerStats = state.playerStats;
        const enemyStats = state.combatConfig.enemyStats;
        const finalBanner = state.finished
            ? `<div class="combat-result-banner ${state.playerWonEncounter ? 'win' : 'loss'}">${state.playerWonEncounter ? 'Scrumble takes the set.' : `${state.combatConfig.enemyLabel} takes the set.`}</div>`
            : '';
        const currentRoundLabel = state.finished
            ? `Final Score`
            : `Round ${state.roundNumber} of ${state.combatConfig.maxRounds}`;

        const markup = `
            <div class="combat-layout">
                <div class="combat-scoreboard">
                    <div class="combat-score-card">
                        <span class="combat-score-label">${state.officer.name}</span>
                        <strong class="combat-score-value">${state.playerWins}</strong>
                    </div>
                    <div class="combat-round-pill">${currentRoundLabel}</div>
                    <div class="combat-score-card enemy">
                        <span class="combat-score-label">${state.combatConfig.enemyLabel}</span>
                        <strong class="combat-score-value">${state.enemyWins}</strong>
                    </div>
                </div>
                <div class="combat-stat-grid">
                    <div class="combat-stat-card">
                        <span>${state.role} Chair</span>
                        <strong>${playerStats.muscle.toFixed(1)} Muscle / ${playerStats.smartz.toFixed(1)} Smartz</strong>
                        <div class="combat-stat-meta">${state.officer.name} is here to ${playerStats.style.toLowerCase()}.</div>
                    </div>
                    <div class="combat-stat-card">
                        <span>${state.combatConfig.enemyLabel}</span>
                        <strong>${enemyStats.muscle.toFixed(1)} Muscle / ${enemyStats.smartz.toFixed(1)} Smartz</strong>
                        <div class="combat-stat-meta">${state.latestEnemyTell || 'Enemy engines snarl while someone mutters over a hot console.'}</div>
                    </div>
                </div>
                ${finalBanner}
                <div class="combat-log">
                    ${buildCombatLogMarkup(state.roundResults)}
                </div>
            </div>
        `;

        showInteractionPanel(state.step.title || 'Bridge Response Needed', markup, {
            allowHtml: true,
            footer: state.finished
                ? 'Encounter complete. Wrapping up the scene...'
                : 'The duel runs automatically after your chair choice. Enjoy the chaos.'
        });
        interactionChoices.innerHTML = '';
    }

    function hideSpeechBubble() {
        activeSpeechOfficer = null;
        speechBubble.classList.add('hidden');
        speechBubble.classList.remove('visible');
    }

    function updateSpeechBubblePosition(officer) {
        if (!officer) {
            return;
        }

        const bubbleX = officer.x + officer.width / 2;
        const bubbleY = officer.y - layoutConfig.chevronOffsetY - 24;
        speechBubble.style.left = `${bubbleX}px`;
        speechBubble.style.top = `${bubbleY}px`;
    }

    function showSpeechBubble(officer, text) {
        activeSpeechOfficer = officer;
        speechSpeaker.textContent = officer.assignedRole || officer.name;
        speechText.textContent = text;
        updateSpeechBubblePosition(officer);
        speechBubble.classList.remove('hidden');
        speechBubble.classList.add('visible');
    }

    function showOfficerDialogue(officer, text, options = {}) {
        hideNarration();
        showSpeechBubble(officer, text);
        if (options.responseSound) {
            playOfficerResponseSound(options.responseSound);
            return;
        }
        playOfficerVoice(officer);
    }

    function hideEpisodeSummary() {
        episodeSummary.classList.add('hidden');
        episodeSummary.classList.remove('visible');
        nextEpisodeButton.classList.add('hidden');
    }

    function showEpisodeSummary(summary) {
        episodeSummaryTitle.textContent = summary.title;
        episodeSummaryBody.innerHTML = summary.html;
        episodeSummary.classList.remove('hidden');
        episodeSummary.classList.add('visible');

        if (summary.hasNextEpisode) {
            nextEpisodeButton.classList.remove('hidden');
        } else {
            nextEpisodeButton.classList.add('hidden');
        }
    }

    function renderSummarySection(label, entries) {
        const content = entries.length > 0
            ? entries.map(entry => `<div class="summary-entry">${entry}</div>`).join('')
            : '<div class="summary-entry">None</div>';

        return `<div class="summary-section"><div class="summary-label">${label}</div>${content}</div>`;
    }

    function renderPromotionEntry(promotion) {
        const pipCount = Math.max(1, promotion.toIndex - promotion.fromIndex);
        const pips = Array.from({ length: pipCount }, (_, index) => `<span class="summary-pip" style="animation-delay:${index * 120}ms"></span>`).join('');
        return `<span class="summary-promo">${promotion.name}: ${promotion.fromRank} -> ${promotion.toRank}<span class="summary-pips">${pips}</span></span>`;
    }

    function clampShipStat(statKey) {
        shipState[statKey] = Math.max(0, Math.min(maxShipStatValue, shipState[statKey]));
    }

    function getChevronCount(rank) {
        const chevronCounts = [1, 1, 2, 3, 4, 4];
        return chevronCounts[ranks.indexOf(rank)] || 1;
    }

	    function triggerPromotionBursts(officer, promotions) {
        if (!officer || !promotions || promotions.length === 0) {
            return;
        }

        playUiSound('assets/sound/rankup.mp3');
        const now = performance.now();
        promotions.forEach((promotion, index) => {
            promotionBursts.push({
                officer,
                label: promotion.toRank,
                pipCount: getChevronCount(promotion.toRank),
                startedAt: now + index * 180,
                durationMs: 2200
            });
	        });
	    }

	    function getEffectImage(imageName) {
	        if (!imageName) {
	            return null;
	        }

	        if (!effectImageCache[imageName]) {
	            const img = new Image();
	            img.src = `assets/images/${imageName}`;
	            effectImageCache[imageName] = img;
	        }

	        return effectImageCache[imageName];
	    }

	    function triggerShipOverlay(imageName, durationMs = 2200) {
	        const img = getEffectImage(imageName);
	        if (!img) {
	            return;
	        }

	        activeShipOverlay = {
	            image: img,
	            startedAt: performance.now(),
	            durationMs
	        };
	    }

    function awardActiveCrewExperience(amount, showBursts = true) {
        if (amount <= 0) {
            return [];
        }

        shipState.experience += amount;
        const promotions = [];
        const awardedCrew = new Set();

        slots.forEach(slot => {
            if (!slot.occupied || !slot.officer || awardedCrew.has(slot.officer)) {
                return;
            }

            awardedCrew.add(slot.officer);
            const officerPromotions = addOfficerExperience(slot.officer, amount) || [];
            promotions.push(...officerPromotions);
            if (showBursts) {
                triggerPromotionBursts(slot.officer, officerPromotions);
            }
        });

        return promotions;
    }

	    function applyEncounterEffects(effects) {
	        if (!Array.isArray(effects)) {
	            return;
	        }

	        effects.forEach(effect => {
	            if (!effect?.type) {
	                return;
	            }

	            if (effect.overlayImage) {
	                triggerShipOverlay(effect.overlayImage, effect.overlayDurationMs || 2200);
	            }

	            if (effect.type === 'hull' || effect.type === 'power' || effect.type === 'personnel') {
	                shipState[effect.type] += effect.amount || 0;
	                clampShipStat(effect.type);
	                return;
            }

            if (effect.type === 'technology' || effect.type === 'experience') {
                if (effect.type === 'experience') {
                    awardActiveCrewExperience(effect.amount || 0, true);
                    return;
                }

                shipState[effect.type] += effect.amount || 0;
            }
        });
    }

    function getEncounterScore(officer, role, step) {
        const baseEffectiveness = getOfficerEffectiveness(officer, role);
        const roleLean = step?.leaning?.[role] || 0;
        return baseEffectiveness + roleLean;
    }

    function chooseEnemyCombatStat(combatConfig) {
        const muscle = Math.max(combatConfig.enemyStats.muscle || 0, 0.1);
        const smartz = Math.max(combatConfig.enemyStats.smartz || 0, 0.1);
        const total = muscle + smartz;
        return Math.random() * total < muscle ? 'muscle' : 'smartz';
    }

    function getCombatRoundComment(role, enemyStat, playerWon) {
        const resultText = playerWon ? 'We take that round.' : 'That round hurt more than it looked.';
        const roleCommentary = {
            Science: {
                muscle: playerWon ? 'Their big move was scientifically embarrassing.' : 'Brute force remains annoyingly peer-reviewed.',
                smartz: playerWon ? 'Outsmarted them. Delightful.' : 'They weaponised nonsense. Respectfully rude.'
            },
            Helm: {
                muscle: playerWon ? 'Too slow. We danced past that swing.' : 'They hit harder than they steer.',
                smartz: playerWon ? 'Read their feint and cut inside it.' : 'They baited the lane. Clever little pests.'
            },
            Captain: {
                muscle: playerWon ? 'Presence and timing. Classic bridge work.' : 'They forced the issue and won the tempo.',
                smartz: playerWon ? 'Command judgment remains undefeated.' : 'They anticipated us. I dislike being anticipated.'
            },
            Tactical: {
                muscle: playerWon ? 'Direct force. Beautiful, honest violence.' : 'They punched back. Rude, but noted.',
                smartz: playerWon ? 'Cleverness used responsibly for once.' : 'Trick shots. Cowardly, effective trick shots.'
            },
            Engineering: {
                muscle: playerWon ? 'Held together under pressure. As designed.' : 'That impact exceeded my emotional tolerances.',
                smartz: playerWon ? 'Their systems trick failed. Love that for us.' : 'They cheated with better wiring.'
            }
        };
        return `${roleCommentary[role]?.[enemyStat] || resultText} ${resultText}`;
    }

    function buildCombatRoundSummary(result) {
        const playerLabel = `${result.officerName} ${result.playerWon ? 'wins' : 'loses'} by ${Math.abs(result.margin).toFixed(1)}`;
        return `${playerLabel}. ${formatCombatStatLabel(result.enemyStat)}: ${result.playerTotal.toFixed(1)} vs ${result.enemyTotal.toFixed(1)}.`;
    }

    function finishCombatEncounter(state) {
        const responses = state.step.responses?.[state.role] || {};
        const endSound = state.playerWonEncounter ? state.step.soundEndSuccess : state.step.soundEndFailure;
        state.inProgress = false;

        activeEncounterStep = null;
        setEpisodeMode('scripted');

        if (endSound) {
            playEpisodeSound(`assets/sound/${endSound}`);
        }

        applyEncounterEffects(state.playerWonEncounter ? state.step.outcomes?.success : state.step.outcomes?.failure);
        renderCombatEncounterPanel(state);
        showOfficerDialogue(
            state.officer,
            state.playerWonEncounter
                ? (responses.success || 'Handled.')
                : (responses.failure || 'That could have gone better.')
        );

        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(() => {
            hideInteractionPanel();
            hideSpeechBubble();
            clearActiveDestination();
            runNextEpisodeStep();
        }, state.step.aftermathDelay || 3200);
    }

    function playCombatRound() {
        const state = activeCombatEncounter;
        if (!state || state.finished) {
            return;
        }

        const enemyStat = chooseEnemyCombatStat(state.combatConfig);
        const playerBase = state.playerStats[enemyStat];
        const enemyBase = state.combatConfig.enemyStats[enemyStat];
        const playerRoll = Math.random() * state.combatConfig.playerVariance;
        const enemyRoll = Math.random() * state.combatConfig.enemyVariance;
        const playerTotal = playerBase + playerRoll;
        const enemyTotal = enemyBase + enemyRoll;
        const playerWon = playerTotal >= enemyTotal;
        const margin = playerTotal - enemyTotal;

        if (playerWon) {
            state.playerWins += 1;
            awardOfficerEncounterExperience(state.officer, state.combatConfig.roundWinXp);
        } else {
            state.enemyWins += 1;
            applyEncounterEffects(state.combatConfig.roundLossEffects);
        }

        state.latestEnemyTell = `${state.combatConfig.enemyLabel} leans into ${formatCombatStatLabel(enemyStat)} this round.`;

        const roundResult = {
            round: state.roundNumber,
            enemyStat,
            playerWon,
            margin,
            playerTotal,
            enemyTotal,
            officerName: state.officer.name,
            summary: buildCombatRoundSummary({
                officerName: state.officer.name,
                playerWon,
                margin,
                enemyStat,
                playerTotal,
                enemyTotal
            }),
            comment: getCombatRoundComment(state.role, enemyStat, playerWon)
        };

        state.roundResults.push(roundResult);
        showSpeechBubble(state.officer, roundResult.comment);

        const wonEncounter = state.playerWins >= state.combatConfig.roundsToWin;
        const lostEncounter = state.enemyWins >= state.combatConfig.roundsToWin;
        const outOfRounds = state.roundNumber >= state.combatConfig.maxRounds;

        if (wonEncounter || lostEncounter || outOfRounds) {
            state.finished = true;
            state.playerWonEncounter = state.playerWins > state.enemyWins;
            renderCombatEncounterPanel(state);
            finishCombatEncounter(state);
            return;
        }

        state.roundNumber += 1;
        renderCombatEncounterPanel(state);
        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(playCombatRound, state.combatConfig.roundDelay);
    }

    function startCombatEncounter(step, slot) {
        const officer = slot.officer;
        const responses = step.responses?.[slot.role] || {};
        const combatConfig = getEncounterCombatConfig(step);
        activeCombatEncounter = {
            step,
            slot,
            officer,
            role: slot.role,
            combatConfig,
            playerStats: getChairCombatStats(officer, slot.role, step),
            playerWins: 0,
            enemyWins: 0,
            roundNumber: 1,
            roundResults: [],
            latestEnemyTell: `${combatConfig.enemyLabel} is scanning for weakness.`,
            finished: false,
            inProgress: true,
            playerWonEncounter: false
        };

        setEpisodeMode('interaction');
        showOfficerDialogue(officer, responses.attempt || `${slot.role} responding.`);
        renderCombatEncounterPanel(activeCombatEncounter);
        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(playCombatRound, step.resultDelay || 1300);
    }

    function resolveEncounterChoice(step, slot) {
        if (activeCombatEncounter?.inProgress) {
            return;
        }

        if (step.combat) {
            startCombatEncounter(step, slot);
            return;
        }

        const officer = slot.officer;
        const responses = step.responses?.[slot.role] || {};
        const success = getEncounterScore(officer, slot.role, step) >= (step.successTarget || 0);
        const endSound = success ? step.soundEndSuccess : step.soundEndFailure;

        activeEncounterStep = null;
        hideInteractionPanel();
        setEpisodeMode('scripted');
        showOfficerDialogue(officer, responses.attempt || `${slot.role} responding.`);

        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(() => {
            if (endSound) {
                playEpisodeSound(`assets/sound/${endSound}`);
            }
            applyEncounterEffects(success ? step.outcomes?.success : step.outcomes?.failure);
            showOfficerDialogue(
                officer,
                success
                    ? (responses.success || 'Handled.')
                    : (responses.failure || 'That could have gone better.')
            );

            clearEpisodeTimeout();
            episodeTimeoutId = setTimeout(() => {
                hideSpeechBubble();
                clearActiveDestination();
                runNextEpisodeStep();
            }, step.aftermathDelay || 2800);
        }, step.resultDelay || 2400);
    }

    function buildCombatLogMarkup(roundResults) {
        if (!roundResults || roundResults.length === 0) {
            return '<div class="combat-log-entry">No rounds played yet. Choose a chair and make this awkward.</div>';
        }

        return roundResults
            .slice()
            .reverse()
            .map(result => `
                <div class="combat-log-entry ${result.playerWon ? 'win' : 'loss'}">
                    <span class="combat-log-round">Round ${result.round} - Enemy played ${formatCombatStatLabel(result.enemyStat)}</span>
                    ${result.summary}<br>${result.comment}
                </div>
            `)
            .join('');
    }

	    function renderCombatEncounterPanel(state) {
	        const enemyStats = state.combatConfig.enemyStats;
	        const latestRound = state.roundResults[state.roundResults.length - 1] || null;
            const showLatestResult = state.awaitingRoundDismissal || state.finished;
            const latestPlayerLost = latestRound ? !latestRound.playerWon : false;
            const losingSide = state.finished
                ? (state.playerWonEncounter ? 'enemy' : 'player')
                : (showLatestResult && latestRound ? (latestPlayerLost ? 'player' : 'enemy') : '');
            const playerCardClasses = [
                'encounter-side-card',
                losingSide === 'player' ? 'is-loser' : '',
                state.selectedSlot && isCombatRoleStunned(state, state.selectedSlot.role) ? 'is-injured' : ''
            ].filter(Boolean).join(' ');
            const enemyCardClasses = [
                'encounter-side-card',
                'enemy',
                losingSide === 'enemy' ? 'is-loser' : ''
            ].filter(Boolean).join(' ');
            const currentRoundLabel = state.finished
                ? 'Final Score'
                : `Round ${state.roundNumber} of ${state.combatConfig.maxRounds}`;
            const playerRoleLabel = state.selectedSlot
                ? `${state.selectedSlot.role} Chair`
                : (latestRound ? `${latestRound.role} Chair` : 'Awaiting Orders');
            const playerLines = showLatestResult && latestRound
                ? [
                    `${latestRound.officerName} chose ${playerRoleLabel}`,
                    `Rolled ${latestRound.playerRoll.toFixed(1)}`,
                    `Total ${latestRound.playerTotal.toFixed(1)}`
                ]
                : [
                    playerRoleLabel,
                    state.selectedSlot && state.playerStats
                        ? `Muscle ${state.playerStats.muscle.toFixed(1)} / Smartz ${state.playerStats.smartz.toFixed(1)}`
                        : 'Choose an occupied bridge member',
                    state.inProgress ? 'Round resolving now.' : 'Crew dialogue stays front and centre.'
                ];
            const enemyLines = showLatestResult && latestRound
                ? [
                    `${state.combatConfig.enemyLabel} chose ${formatCombatStatLabel(latestRound.enemyStat)}`,
                    `Rolled ${latestRound.enemyRoll.toFixed(1)}`,
                    `Total ${latestRound.enemyTotal.toFixed(1)}`
                ]
                : [
                    `${state.combatConfig.enemyLabel} is waiting`,
                    `Muscle ${enemyStats.muscle.toFixed(1)}`,
                    `Smartz ${enemyStats.smartz.toFixed(1)}`
                ];
            const overlayMessage = state.finished
                ? (state.playerWonEncounter ? 'Scrumble wins the encounter!' : `${state.combatConfig.enemyLabel} wins the encounter!`)
                : (showLatestResult && latestRound
                    ? (latestRound.playerWon ? 'Scrumble wins this round!' : 'Enemy wins this round!')
                    : '');
            const overlayClasses = [
                'encounter-result-overlay',
                losingSide || 'enemy',
                state.finished && state.playerWonEncounter ? 'win' : ''
            ].filter(Boolean).join(' ');
            const swearMarkup = losingSide
                ? `<img class="encounter-swear ${losingSide}" src="assets/images/swear.png" alt="">`
                : '';
            const continueMarkup = state.awaitingRoundDismissal && !state.finished
                ? `
                    <div class="combat-actions">
                        <button id="combat-continue-button" class="overlay-next-button" type="button">Next Round</button>
                    </div>
                `
                : '';
	        const markup = `
                <div class="encounter-flow">
                    <section class="${playerCardClasses}">
                        <span class="encounter-side-label">Scrumble</span>
                        ${playerLines.map(line => `<span class="encounter-side-line">${line}</span>`).join('')}
                    </section>
                    <section class="encounter-center-card">
                        <span class="encounter-battle-label">${state.step.title || 'Bridge Response Needed'}</span>
                        <div class="encounter-round-label">${currentRoundLabel}</div>
                        <div class="encounter-scoreboard">
                            <div class="encounter-score-block">
                                <span class="encounter-score-name">Scrumble</span>
                                <strong>${state.playerWins}</strong>
                            </div>
                            <div class="encounter-score-block">
                                <span class="encounter-score-name">${latestRound ? `Round ${latestRound.round}` : 'Status'}</span>
                                <span class="encounter-score-meta">${state.latestEnemyTell || 'Enemy engines snarl while someone mutters over a hot console.'}</span>
                            </div>
                            <div class="encounter-score-block enemy">
                                <span class="encounter-score-name">${state.combatConfig.enemyLabel}</span>
                                <strong>${state.enemyWins}</strong>
                            </div>
                        </div>
                    </section>
                    <section class="${enemyCardClasses}">
                        <span class="encounter-side-label">${state.combatConfig.enemyLabel}</span>
                        ${enemyLines.map(line => `<span class="encounter-side-line">${line}</span>`).join('')}
                    </section>
                    ${overlayMessage ? `<div class="${overlayClasses}">${overlayMessage}</div>` : ''}
                    ${swearMarkup}
                </div>
                ${showLatestResult && latestRound ? `<div class="combat-log-entry ${latestRound.playerWon ? 'win' : 'loss'}"><span class="combat-log-round">Round ${latestRound.round} - Enemy played ${formatCombatStatLabel(latestRound.enemyStat)}</span>${latestRound.summary}<br>${latestRound.comment}</div>` : ''}
                ${continueMarkup}
	        `;

	        showInteractionPanel(state.step.title || 'Bridge Response Needed', markup, {
	            allowHtml: true,
	            footer: state.finished
	                ? 'Encounter complete. Wrapping up the scene...'
                : (state.inProgress
                    ? 'Round resolving...'
                    : (state.awaitingRoundDismissal
                        ? 'Review the round result, then continue.'
	                        : 'Click an occupied bridge chair to choose this round.')),
                className: 'encounter-panel'
	        });
	        renderCombatChoiceButtons(state);
        const continueButton = interactionPanel.querySelector('#combat-continue-button');
        if (continueButton) {
            continueButton.addEventListener('click', function() {
                if (!activeCombatEncounter || activeCombatEncounter.finished) {
                    return;
                }

                activeCombatEncounter.awaitingRoundDismissal = false;
                activeCombatEncounter.roundNumber += 1;
                activeCombatEncounter.selectedSlot = null;
                activeCombatEncounter.selectedOfficer = null;
                activeCombatEncounter.playerStats = null;
                renderCombatEncounterPanel(activeCombatEncounter);
            });
        }
    }

    function finishCombatEncounter(state) {
        const responses = state.step.responses?.[state.lastRole] || {};
        const endSound = state.playerWonEncounter ? state.step.soundEndSuccess : state.step.soundEndFailure;
        const responseSound = getEncounterResponseClipPath(state.lastRole, responses);
        state.inProgress = false;
        activeEncounterStep = null;
        setEpisodeMode('scripted');

        if (endSound) {
            playEpisodeSound(`assets/sound/${endSound}`);
        }

        applyEncounterEffects(state.playerWonEncounter ? state.step.outcomes?.success : state.step.outcomes?.failure);
        renderCombatEncounterPanel(state);
        if (state.selectedOfficer) {
            showOfficerDialogue(
                state.selectedOfficer,
                state.playerWonEncounter
                    ? (responses.success || 'Handled.')
                    : (responses.failure || 'That could have gone better.'),
                { responseSound }
            );
        }

        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(() => {
            hideInteractionPanel();
            hideSpeechBubble();
            clearActiveDestination();
            runNextEpisodeStep();
        }, state.step.aftermathDelay || 3200);
    }

    function playCombatRound() {
        const state = activeCombatEncounter;
        if (!state || state.finished || !state.selectedSlot || state.awaitingRoundDismissal) {
            return;
        }

        state.inProgress = true;
        const enemyStat = chooseEnemyCombatStat(state.combatConfig);
        const playerBase = state.playerStats[enemyStat];
        const enemyBase = state.combatConfig.enemyStats[enemyStat];
	        const playerRoll = Math.random() * state.combatConfig.playerVariance;
	        const enemyRoll = Math.random() * state.combatConfig.enemyVariance;
	        const playerTotal = playerBase + playerRoll;
        const enemyTotal = enemyBase + enemyRoll;
        const playerWon = playerTotal >= enemyTotal;
        const margin = playerTotal - enemyTotal;

        if (playerWon) {
            state.playerWins += 1;
            awardOfficerEncounterExperience(state.selectedOfficer, state.combatConfig.roundWinXp);
        } else {
            state.enemyWins += 1;
            applyEncounterEffects(state.combatConfig.roundLossEffects);
            if (state.combatConfig.stunOnLoss !== false) {
                state.stunnedUntilRound[state.lastRole] = state.roundNumber + 1;
            }
        }

        state.latestEnemyTell = `${state.combatConfig.enemyLabel} leans into ${formatCombatStatLabel(enemyStat)} this round.`;
	        const roundResult = {
	            round: state.roundNumber,
                role: state.lastRole,
	            enemyStat,
	            playerWon,
	            margin,
                playerBase,
                enemyBase,
                playerRoll,
                enemyRoll,
	            playerTotal,
	            enemyTotal,
	            officerName: state.selectedOfficer.name,
            summary: buildCombatRoundSummary({
                officerName: state.selectedOfficer.name,
                playerWon,
                margin,
                enemyStat,
                playerTotal,
                enemyTotal
            }),
            comment: getCombatRoundComment(state.lastRole, enemyStat, playerWon)
        };

        state.roundResults.push(roundResult);
        showOfficerDialogue(state.selectedOfficer, roundResult.comment, {
            responseSound: getEncounterResponseClipPath(state.lastRole)
        });

        const wonEncounter = state.playerWins >= state.combatConfig.roundsToWin;
        const lostEncounter = state.enemyWins >= state.combatConfig.roundsToWin;
        const outOfRounds = state.roundNumber >= state.combatConfig.maxRounds;

        if (wonEncounter || lostEncounter || outOfRounds) {
            state.finished = true;
            state.playerWonEncounter = state.playerWins > state.enemyWins;
            renderCombatEncounterPanel(state);
            finishCombatEncounter(state);
            return;
        }

        state.awaitingRoundDismissal = true;
        state.selectedSlot = null;
        state.selectedOfficer = null;
        state.playerStats = null;
        state.inProgress = false;
        renderCombatEncounterPanel(state);
    }

	    function startCombatEncounter(step, slot) {
        if (!activeCombatEncounter || activeCombatEncounter.step !== step) {
            const combatConfig = getEncounterCombatConfig(step);
            activeCombatEncounter = {
                step,
                combatConfig,
                playerWins: 0,
                enemyWins: 0,
                roundNumber: 1,
                roundResults: [],
                latestEnemyTell: `${combatConfig.enemyLabel} is scanning for weakness.`,
                finished: false,
                inProgress: false,
                awaitingRoundDismissal: false,
                playerWonEncounter: false,
                selectedSlot: null,
                selectedOfficer: null,
                playerStats: null,
                lastRole: null,
                stunnedUntilRound: {}
            };
        }

        const state = activeCombatEncounter;
        if (isCombatRoleStunned(state, slot.role)) {
            return;
        }

	        state.selectedSlot = slot;
	        state.selectedOfficer = slot.officer;
	        state.lastRole = slot.role;
	        state.playerStats = getChairCombatStats(slot.officer, slot.role, step);
        state.latestEnemyTell = `${state.combatConfig.enemyLabel} waits to reveal whether this round is Muscle or Smartz.`;

        setEpisodeMode('interaction');
        const responses = step.responses?.[slot.role] || {};
        showOfficerDialogue(slot.officer, responses.attempt || `${slot.role} responding.`, {
            responseSound: getEncounterResponseClipPath(slot.role, responses)
        });
	        renderCombatEncounterPanel(state);
	        clearEpisodeTimeout();
	        episodeTimeoutId = setTimeout(playCombatRound, step.resultDelay || 900);
	    }

    function resolveEncounterChoice(step, slot) {
        if (activeCombatEncounter?.inProgress || activeCombatEncounter?.awaitingRoundDismissal) {
            return;
        }

        if (step.combat) {
            startCombatEncounter(step, slot);
            return;
        }

        const officer = slot.officer;
        const responses = step.responses?.[slot.role] || {};
        const responseSound = getEncounterResponseClipPath(slot.role, responses);
        const success = getEncounterScore(officer, slot.role, step) >= (step.successTarget || 0);
        const endSound = success ? step.soundEndSuccess : step.soundEndFailure;

        activeEncounterStep = null;
        hideInteractionPanel();
        setEpisodeMode('scripted');
        showOfficerDialogue(officer, responses.attempt || `${slot.role} responding.`, {
            responseSound
        });

        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(() => {
            if (endSound) {
                playEpisodeSound(`assets/sound/${endSound}`);
            }
            applyEncounterEffects(success ? step.outcomes?.success : step.outcomes?.failure);
            showOfficerDialogue(
                officer,
                success
                    ? (responses.success || 'Handled.')
                    : (responses.failure || 'That could have gone better.'),
                { responseSound }
            );

            clearEpisodeTimeout();
            episodeTimeoutId = setTimeout(() => {
                hideSpeechBubble();
                clearActiveDestination();
                runNextEpisodeStep();
            }, step.aftermathDelay || 2800);
        }, step.resultDelay || 2400);
    }

    function startEncounter(step) {
        activeEncounterStep = step;
        activeCombatEncounter = null;
        hideEpisodeTitle();
        hideSpeechBubble();
        hideNarration();
        if (step.soundStart) {
            playEpisodeSound(`assets/sound/${step.soundStart}`);
        }
        setActiveDestination(step.object, step.duration || 9000);
        setEpisodeMode('interaction');
        hoveredEncounterSlot = null;
        renderEncounterSelectionPanel(step);
    }

    function addOfficerExperience(officer, amount) {
        if (!officer || amount <= 0) {
            return null;
        }

        const promotions = [];
        officer.experience += amount;
        let nextRank = getNextRank(officer.rank);
        while (nextRank) {
            const promotionThreshold = getPromotionThreshold(officer.rank);
            if (officer.experience < promotionThreshold) {
                break;
            }

            const previousRank = officer.rank;
            officer.experience -= promotionThreshold;
            officer.rank = nextRank;
            promotions.push({
                name: officer.name,
                fromRank: previousRank,
                toRank: nextRank,
                fromIndex: promotionRankOrder.indexOf(previousRank),
                toIndex: promotionRankOrder.indexOf(nextRank)
            });
            nextRank = getNextRank(officer.rank);
            markShipStatsDirty();
        }

        return promotions;
    }

    function refillEmptyRosterSlots(count) {
        const newRosterCrew = [];
        let remaining = Math.max(count || 0, 0);
        for (let i = 0; i < officers.length && remaining > 0; i++) {
            if (!officers[i]) {
                const officer = createOfficer(i);
                officers[i] = officer;
                officer.img.onload = draw;
                newRosterCrew.push(officer.name);
                remaining -= 1;
            }
        }

        return newRosterCrew;
    }

    function applyEpisodeRewards(episode) {
        const rewards = episode?.rewards;
        if (!rewards) {
            return {
                technology: 0,
                power: 0,
                shipExperience: 0,
                promotions: [],
                newRosterCrew: []
            };
        }

        shipState.technology += rewards.technology || 0;
        shipState.power += rewards.power || 0;
        clampShipStat('power');
        const experienceAward = rewards.experience ?? rewards.shipExperience ?? 0;
        const promotions = awardActiveCrewExperience(experienceAward, false);

        let newRosterCrew = [];
        if (rewards.fillRosterSlots) {
            newRosterCrew = refillEmptyRosterSlots(rewards.fillRosterSlots);
        }

        return {
            technology: rewards.technology || 0,
            power: rewards.power || 0,
            shipExperience: experienceAward,
            promotions,
            newRosterCrew
        };
    }

    function scheduleNextEpisodeStep(delayMs) {
        clearEpisodeTimeout();
        episodeTimeoutId = setTimeout(runNextEpisodeStep, delayMs);
    }

    function shouldNarrationWaitForNextButton() {
        const nextStep = activeEpisode?.steps?.[episodeStepIndex];
        return nextStep?.type !== 'waitForStations';
    }

    function finishEpisode() {
        const completedEpisode = activeEpisode;
        const rewardSummary = applyEpisodeRewards(completedEpisode);
        clearEpisodeTimeout();
        activeEpisode = null;
        episodeStepIndex = 0;
        clearEpisodeWaitCondition();
        clearActiveDestination();
        hideInteractionPanel();
        setEpisodeMode('outro');
        hideNarration();
        hideSpeechBubble();
        showEpisodeTitle('The End');
        targetShipOpacity = 0;
        playEpisodeSound('assets/sound/episode-end.mp3');
        scheduleUiTimeout(() => {
            hideEpisodeTitle();
            showEpisodeSummary({
                title: completedEpisode?.title || 'Episode Complete',
                hasNextEpisode: currentEpisodeIndex < episodes.length - 1,
                html: [
                    renderSummarySection('Episode Rewards', [
                        `Experience: +${rewardSummary.shipExperience}`,
                        `Technology: +${rewardSummary.technology}`,
                        `Power: +${rewardSummary.power}`,
                        `New roster crew: ${rewardSummary.newRosterCrew.length > 0 ? rewardSummary.newRosterCrew.join(', ') : 'None'}`
                    ]),
                    renderSummarySection('Crew Promotions', rewardSummary.promotions.map(renderPromotionEntry))
                ].join('')
            });
            setEpisodeMode('free');
        }, cinematicTiming.outroSummaryDelayMs);
    }

    function runNextEpisodeStep() {
        if (!activeEpisode) {
            return;
        }

        const step = activeEpisode.steps[episodeStepIndex];
        if (!step) {
            finishEpisode();
            return;
        }

        episodeStepIndex += 1;

        if (step.type === 'title') {
            setEpisodeMode('scripted');
            hideNarration();
            hideSpeechBubble();
            hideInteractionPanel();
            hideEpisodeSummary();
            targetShipOpacity = 0;
            hideEpisodeTitle();

            const titleBeatMs = step.duration || cinematicTiming.introTitleBeatMs;
            const episodeNumberLabel = getEpisodeNumberLabel(currentEpisodeIndex);
            const episodeTitleText = step.text || activeEpisode?.title || 'Untitled Episode';
            const subtitleRevealDelayMs = Math.round(titleBeatMs * 0.45);
            const totalIntroMs =
                cinematicTiming.introStarfieldHoldMs +
                titleBeatMs +
                cinematicTiming.introPostTitleHoldMs +
                cinematicTiming.shipFadeMs;

            scheduleUiTimeout(() => {
                showEpisodeTitleStack(episodeNumberLabel, episodeTitleText, false);
            }, cinematicTiming.introStarfieldHoldMs);

            scheduleUiTimeout(() => {
                showEpisodeTitleStack(episodeNumberLabel, episodeTitleText, true);
            }, cinematicTiming.introStarfieldHoldMs + subtitleRevealDelayMs);

            scheduleUiTimeout(() => {
                targetShipOpacity = 1;
            }, cinematicTiming.introStarfieldHoldMs + titleBeatMs + cinematicTiming.introPostTitleHoldMs);

            scheduleUiTimeout(() => {
                hideEpisodeTitle();
            }, cinematicTiming.introStarfieldHoldMs + titleBeatMs);

            scheduleNextEpisodeStep(totalIntroMs);
            return;
        }

        if (step.type === 'narration') {
            hideEpisodeTitle();
            hideSpeechBubble();
            hideInteractionPanel();
            clearEpisodeTimeout();
            showNarration(step.speaker || 'Narrator', step.text, {
                showNextButton: shouldNarrationWaitForNextButton()
            });
            if (isAwaitingNarrationAdvance) {
                return;
            }
            if (step.duration > 0) {
                scheduleNextEpisodeStep(step.duration);
            } else {
                runNextEpisodeStep();
            }
            return;
        }

        if (step.type === 'travel') {
            hideEpisodeTitle();
            hideNarration();
            hideSpeechBubble();
            hideInteractionPanel();
            setActiveDestination(step.destination, step.duration);
            targetShipOpacity = 1;
            setEpisodeMode('travel');
            scheduleNextEpisodeStep(step.duration);
            return;
        }

        if (step.type === 'encounter') {
            startEncounter(step);
            return;
        }

        if (step.type === 'waitForStations') {
            setEpisodeMode('waiting');
            episodeWaitCondition = 'allStationsFilled';
            if (areAllStationsFilled()) {
                checkEpisodeProgress();
            }
            return;
        }

        if (step.type === 'chairDialogue') {
            const officer = getOfficerForRole(step.role);
            hideEpisodeTitle();
            if (officer) {
                showOfficerDialogue(officer, step.text);
            } else {
                hideSpeechBubble();
                showNarration(step.role || 'Narrator', step.text);
            }
            setEpisodeMode('scripted');
            scheduleNextEpisodeStep(step.duration);
            return;
        }

        scheduleNextEpisodeStep(0);
    }

    function startEpisode(episodeIndex) {
        const episode = episodes[episodeIndex];
        if (!episode) {
            return;
        }

        resetEpisodePresentation();
        currentEpisodeIndex = episodeIndex;
        updateSkipEpisodeButton();
        activeEpisode = episode;
        episodeStepIndex = 0;
        setEpisodeMode('scripted');
        shipOpacity = 0;
        targetShipOpacity = 1;
        playEpisodeSound('assets/sound/episode-start.mp3');
        runNextEpisodeStep();
    }

    function isPointOverSlot(x, y, slot) {
        const slotCenterX = getSlotCenterX(slot);
        const slotCenterY = getSlotCenterY(slot);
        const dropToleranceX = layoutConfig.slotHitToleranceX * officerScale;
        const dropToleranceY = layoutConfig.slotHitToleranceY * officerScale;
        return Math.abs(x - slotCenterX) < dropToleranceX && Math.abs(y - slotCenterY) < dropToleranceY;
    }

    function getCanvasPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function isPointInOfficer(x, y, officer) {
        return x >= officer.x && x <= officer.x + officer.width && y >= officer.y && y <= officer.y + officer.height;
    }

    function repositionOfficers() {
        officers.forEach(officer => {
            if (!officer) {
                return;
            }

            const pos = sidePositions[officer.sideIndex];
            officer.x = pos.x;
            officer.y = pos.y;
            officer.width = getSideOfficerWidth();
            officer.height = getSideOfficerHeight();
        });
        slots.forEach(slot => {
            if (slot.occupied && slot.officer) {
                slot.officer.x = slot.x;
                slot.officer.y = slot.y;
                slot.officer.width = getDeckOfficerWidth();
                slot.officer.height = getDeckOfficerHeight();
            }
        });
    }

    function getOfficerEffectiveness(officer, role) {
        if (!officer) {
            return 0;
        }

        const rankValue = rankValues[officer.rank] || 0;
        const roleSuitability = chairEffectivenessByColor[role]?.[officer.color] || 0;
        return rankValue * roleSuitability;
    }

    function getShipStats() {
        if (shipStatsDirty || !cachedShipStats) {
            cachedShipStats = calculateShipStats();
            shipStatsDirty = false;
        }

        return cachedShipStats;
    }

    function calculateShipStats() {
        let science = 0, helm = 0, captain = 1, tactical = 0, engineering = 0;
        slots.forEach(slot => {
            if (slot.occupied && slot.officer) {
                const eff = getOfficerEffectiveness(slot.officer, slot.role);
                if (slot.role === 'Science') science = eff;
                else if (slot.role === 'Helm') helm = eff;
                else if (slot.role === 'Captain') captain = 1 + eff / 10;
                else if (slot.role === 'Tactical') tactical = eff;
                else if (slot.role === 'Engineering') engineering = eff;
            }
        });
        science *= captain;
        helm *= captain;
        tactical *= captain;
        engineering *= captain;

        return {
            science,
            helm,
            captain,
            tactical,
            engineering
        };
    }

    function updateShipProgression(deltaSeconds) {
        const shipStats = getShipStats();
        const scienceSupport = shipStats.science;
        const engineeringSupport = shipStats.engineering;

        shipState.hull = clampShipStatValue(shipState.hull + deltaSeconds * (0.08 + engineeringSupport * 0.02));
        shipState.power = clampShipStatValue(shipState.power + deltaSeconds * (0.06 + engineeringSupport * 0.025 + scienceSupport * 0.01));
        shipState.personnel = clampShipStatValue(shipState.personnel + deltaSeconds * (0.03 + scienceSupport * 0.018 + engineeringSupport * 0.008));

        officers.forEach(officer => {
            if (!officer) {
                return;
            }

            officer.healProgress += deltaSeconds * (0.15 + scienceSupport * 0.01);
            if (officer.health < officer.maxHealth && officer.healProgress >= 12) {
                officer.health += 1;
                officer.healProgress = 0;
            }
        });
    }

    function getOfficerTypeForSpecialty(specialty) {
        const matchingOfficerTypes = officerTypes.filter(officerType => officerType.specialties.includes(specialty));
        const availableTypes = matchingOfficerTypes.length > 0 ? matchingOfficerTypes : officerTypes;
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    function getRandomReplacementRank() {
        return rankByStartingPoints[Math.floor(Math.random() * 2) + 1];
    }

    function getPromotionThreshold(rank) {
        const rankIndex = promotionRankOrder.indexOf(rank);
        if (rankIndex <= 0) {
            return 10;
        }

        return 10 * Math.pow(2, rankIndex);
    }

    function getNextRank(rank) {
        const currentIndex = promotionRankOrder.indexOf(rank);
        if (currentIndex < 0 || currentIndex >= promotionRankOrder.length - 1) {
            return null;
        }

        return promotionRankOrder[currentIndex + 1];
    }

    function clampShipStatValue(value) {
        return Math.max(0, Math.min(maxShipStatValue, value));
    }

    function buildStartingCrewPlan(crewCount, totalPoints) {
        const plan = Array.from({ length: crewCount }, () => ({
            specialty: null,
            rankPoints: 1
        }));
        let remainingPoints = Math.max(totalPoints - crewCount, 0);

        const guaranteedCaptainIndex = Math.floor(Math.random() * crewCount);
        plan[guaranteedCaptainIndex].specialty = 'command';

        while (remainingPoints > 0) {
            const index = Math.floor(Math.random() * crewCount);
            if (plan[index].rankPoints < 5) {
                plan[index].rankPoints += 1;
                remainingPoints -= 1;
            }
        }

        plan.forEach(member => {
            if (!member.specialty) {
                const officerType = officerTypes[Math.floor(Math.random() * officerTypes.length)];
                member.specialty = getRandomSpecialty(officerType);
            }

            member.rank = rankByStartingPoints[member.rankPoints] || 'Ensign';
        });

        return plan;
    }

    function createOfficer(sideIndex, officerPlan = {}) {
        const specialty = officerPlan.specialty || getRandomSpecialty(officerTypes[Math.floor(Math.random() * officerTypes.length)]);
        const type = officerPlan.type || getOfficerTypeForSpecialty(specialty);
        const img = new Image();
        img.src = `assets/images/${type.image}`;
        officerImages.push(img);
        return {
            img,
            x: sidePositions[sideIndex].x,
            y: sidePositions[sideIndex].y,
            width: getSideOfficerWidth(),
            height: getSideOfficerHeight(),
            color: type.color,
            specialty,
            rank: officerPlan.rank || getRandomReplacementRank(),
            name: names[Math.floor(Math.random() * names.length)],
            experience: 0,
            health: 3,
            maxHealth: 3,
            healProgress: 0,
            voice: null,
            sideIndex
        };
    }

    function populateOfficers() {
        officers = Array(sidePositions.length).fill(null);
        officerImages = [];
        const startingCrewPlan = buildStartingCrewPlan(sidePositions.length, startingCrewBudget);
        sidePositions.forEach((_, index) => {
            const officer = createOfficer(index, startingCrewPlan[index]);
            officers[index] = officer;
            officer.img.onload = draw;
        });
        markShipStatsDirty();
    }

    // --- Drawing ---
    function drawChevron(x, y, rank) {
        // Draw a cartoon chevron badge above the officer
        // Cadet: 1 white, Ensign: 1 gold, Lieutenant: 2 gold, Lt. Commander: 3 gold, Commander: 4 gold, Captain: 4 gold
        const chevronColors = ['#FFF', '#FFD700', '#FFD700', '#FFD700', '#FFD700', '#FFD700'];
        const chevronCounts = [1, 1, 2, 3, 4, 4];
        const count = chevronCounts[ranks.indexOf(rank)];
        const color = chevronColors[ranks.indexOf(rank)];
        for (let i = 0; i < count; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x - 12 + i * 12, y);
            ctx.lineTo(x - 6 + i * 12, y - 10);
            ctx.lineTo(x + i * 12, y);
            ctx.lineTo(x - 6 + i * 12, y + 6);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawTextOutlined(text, x, y, font = 'bold 14px Arial') {
        ctx.save();
        ctx.font = font;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'black';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = 'white';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    function wrapCenteredText(text, maxWidth, font) {
        ctx.save();
        ctx.font = font;
        const words = String(text || '').split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const nextLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
                currentLine = nextLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        ctx.restore();
        return lines;
    }

    function drawWrappedCenteredText(lines, centerX, startY, lineHeight, font) {
        lines.forEach((line, index) => {
            drawTextOutlined(line, centerX, startY + index * lineHeight, font);
        });
    }

    function drawHeart(x, y, size, isFilled) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.35);
        ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.35);
        ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size * 0.95, x, y + size * 1.2);
        ctx.bezierCurveTo(x, y + size * 0.95, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.35);
        ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.35);
        ctx.closePath();
        ctx.fillStyle = isFilled ? '#ff5d7a' : 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function drawOfficerHearts(officer, centerX, drawY) {
        const heartCount = officer.maxHealth || 3;
        const heartSize = layoutConfig.heartSize;
        const totalWidth = heartCount * heartSize + (heartCount - 1) * layoutConfig.heartGap;
        const startX = centerX - totalWidth / 2 + heartSize / 2;
        const heartY = drawY - 18;

        for (let i = 0; i < heartCount; i++) {
            drawHeart(startX + i * (heartSize + layoutConfig.heartGap), heartY, heartSize, i < officer.health);
        }
    }

    function drawBlankRosterSlot(sideIndex) {
        const pos = sidePositions[sideIndex];
        if (!pos || !blankOfficerImage.complete) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.drawImage(blankOfficerImage, pos.x, pos.y, getSideOfficerWidth(), getSideOfficerHeight());
        ctx.restore();
    }

    function drawHud() {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `Hull: ${Math.round(shipState.hull)} | Power: ${Math.round(shipState.power)} | Personnel: ${Math.round(shipState.personnel)} | Technology: ${Math.round(shipState.technology)} | Experience: ${Math.floor(shipState.experience)}`,
            canvas.width / 2,
            30
        );
        ctx.textAlign = 'left';
    }

    function drawStarfield() {
        ctx.save();
        for (const star of stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.7;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

	    function getShipDrawRect() {
	        const shipW = layoutConfig.shipWidth;
	        const shipH = layoutConfig.shipHeight;
	        const travelOffset = episodeMode === 'travel' ? Math.sin(Date.now() / 220) * 70 : 0;
	        return {
	            shipW,
	            shipH,
	            shipX: canvas.width / 2 - shipW / 2 + travelOffset,
	            shipY: canvas.height / 6 - shipH / 2 + layoutConfig.shipBobAmplitude * Math.sin(Date.now() / 1000)
	        };
	    }

	    function drawShip() {
	        const { shipW, shipH, shipX, shipY } = getShipDrawRect();
	        if (shipImage.complete) {
	            ctx.save();
	            ctx.globalAlpha = shipOpacity;
	            ctx.drawImage(shipImage, shipX, shipY, shipW, shipH);
	            ctx.restore();
	        }
	    }

	    function drawShipOverlay() {
	        if (!activeShipOverlay?.image) {
	            return;
	        }

	        const now = performance.now();
	        const elapsed = now - activeShipOverlay.startedAt;
	        if (elapsed >= activeShipOverlay.durationMs) {
	            activeShipOverlay = null;
	            return;
	        }

	        const progress = elapsed / activeShipOverlay.durationMs;
	        const alpha = progress < 0.15
	            ? progress / 0.15
	            : 1 - ((progress - 0.15) / 0.85);
	        const { shipW, shipH, shipX, shipY } = getShipDrawRect();
	        const overlayScale = 1.18;
	        const overlayW = shipW * overlayScale;
	        const overlayH = shipH * overlayScale;
	        const overlayX = shipX - (overlayW - shipW) / 2;
	        const overlayY = shipY - (overlayH - shipH) / 2;

	        ctx.save();
	        ctx.globalAlpha = Math.max(0, Math.min(alpha, 1)) * Math.max(shipOpacity, 0.6);
	        ctx.drawImage(activeShipOverlay.image, overlayX, overlayY, overlayW, overlayH);
	        ctx.restore();
	    }

	    function drawDestination() {
	        if (!activeDestination || !destinationImage.complete || !destinationImage.naturalWidth || episodeMode === 'outro') {
	            return;
	        }

	        const elapsedMs = Math.max(performance.now() - travelStepStartedAt, 0);
	        const rawProgress = activeTravelDurationMs > 0 ? Math.min(elapsedMs / activeTravelDurationMs, 1) : 1;
	        const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
	        const stationWidth = 220;
	        const stationHeight = 220;
	        const startX = canvas.width + stationWidth;
	        const endX = canvas.width / 2 + layoutConfig.shipWidth * 0.72;
	        const stationX = startX + (endX - startX) * easedProgress;
	        const stationY = canvas.height / 6 - stationHeight / 2 - 12;
	        const stationAlpha = Math.min(1, 0.25 + easedProgress * 0.9) * Math.max(shipOpacity, 0.35);

	        ctx.save();
	        ctx.globalAlpha = stationAlpha;
	        ctx.drawImage(destinationImage, stationX, stationY, stationWidth, stationHeight);
	        ctx.restore();
	    }

    function drawDeckBackground() {
        const mgmtTop = canvas.height * managementAreaTopRatio;
        const mgmtHeight = canvas.height - mgmtTop;
        const deckX = canvas.width * 0.25;
        const deckWidth = canvas.width * 0.5;
        if (deckImage.complete) {
            ctx.drawImage(deckImage, deckX, mgmtTop, deckWidth, mgmtHeight);
        }
    }

    function drawSlots() {
        slots.forEach(slot => {
            ctx.save();
	            const isEncounterSelectable = episodeMode === 'interaction'
                    && activeEncounterStep
                    && slot.occupied
                    && slot.officer
                    && (!activeCombatEncounter || (!activeCombatEncounter.inProgress && !activeCombatEncounter.awaitingRoundDismissal && !activeCombatEncounter.finished && !isCombatRoleStunned(activeCombatEncounter, slot.role)));
            const isEncounterHovered = hoveredEncounterSlot === slot;
            ctx.strokeStyle = isEncounterSelectable ? (isEncounterHovered ? '#ffe27a' : '#8ad7ff') : (slot.occupied ? '#0f0' : '#fff');
            ctx.lineWidth = isEncounterSelectable ? (isEncounterHovered ? 5 : 4) : 3;
            const chairWidth = layoutConfig.chairWidth * officerScale;
            const chairHeight = getDeckOfficerHeight() / 2;
            ctx.beginPath();
            ctx.ellipse(getSlotCenterX(slot), getSlotCenterY(slot), chairWidth, chairHeight, 0, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
            ctx.textAlign = 'center';
            drawTextOutlined(slot.role, getSlotCenterX(slot), slot.y + getDeckOfficerHeight() + layoutConfig.slotLabelOffsetY, 'bold 14px Arial');
            if (slot.occupied && slot.officer) {
                const eff = getOfficerEffectiveness(slot.officer, slot.role);
                drawTextOutlined(eff.toFixed(1), getSlotCenterX(slot), slot.y + getDeckOfficerHeight() + layoutConfig.slotEffectOffsetY, 'bold 16px Arial');
            }
            ctx.textAlign = 'left';
        });
    }

	    function drawEncounterPrompt() {
	        if (episodeMode !== 'interaction' || !activeEncounterStep) {
	            return;
	        }

            const instructionText = activeCombatEncounter
                ? (activeCombatEncounter.inProgress
                    ? 'Round resolving now. Watch the panel for the blow-by-blow.'
                    : (activeCombatEncounter.awaitingRoundDismissal
                        ? 'Dismiss the round result, then choose the next chair.'
                        : 'Choose a chair for this round by clicking an occupied bridge seat.'))
                : (activeEncounterStep.combat
                    ? 'Pick a chair by clicking an occupied bridge seat to start the best-of-five.'
                    : 'Choose a bridge officer by clicking an occupied bridge seat to respond.');
	        const panelWidth = Math.min(canvas.width * 0.9, canvas.width - 32);
        const panelHeight = 126;
        const panelX = canvas.width / 2 - panelWidth / 2;
        const panelY = Math.max(24, canvas.height * 0.24);
        const promptLines = wrapCenteredText(
            activeEncounterStep.text || 'Choose a bridge officer to respond.',
            panelWidth - 40,
            'bold 15px Arial'
        );

        ctx.save();
        ctx.fillStyle = 'rgba(6, 14, 26, 0.88)';
        ctx.strokeStyle = 'rgba(194, 227, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 18);
        ctx.fill();
        ctx.stroke();

	        ctx.textAlign = 'center';
	        drawTextOutlined(activeEncounterStep.title || 'Bridge Response Needed', canvas.width / 2, panelY + 28, 'bold 18px Arial');
	        drawWrappedCenteredText(promptLines, canvas.width / 2, panelY + 54, 20, 'bold 15px Arial');
	        drawTextOutlined(instructionText, canvas.width / 2, panelY + 106, 'bold 14px Arial');
	        ctx.restore();
	    }

    function drawPromotionBursts() {
        const now = performance.now();
        promotionBursts = promotionBursts.filter(burst => now <= burst.startedAt + burst.durationMs);

        promotionBursts.forEach(burst => {
            if (now < burst.startedAt || !burst.officer) {
                return;
            }

            const progress = Math.min((now - burst.startedAt) / burst.durationMs, 1);
            const rise = 28 * progress;
            const alpha = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
            const centerX = burst.officer.x + burst.officer.width / 2;
            const baseY = burst.officer.y - layoutConfig.chevronOffsetY - 42 - rise;

            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillStyle = 'rgba(6, 14, 26, 0.9)';
            ctx.strokeStyle = 'rgba(255, 216, 111, 0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(centerX - 82, baseY - 24, 164, 52, 16);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'center';
            drawTextOutlined(`Promoted: ${burst.label}`, centerX, baseY - 2, 'bold 15px Arial');
            drawChevron(centerX - ((burst.pipCount - 1) * 6), baseY + 16, burst.label);
            ctx.restore();
        });
    }

	    function drawOfficer(officer, drawX, drawY, width = officer.width, height = officer.height) {
            const slottedRole = slots.find(slot => slot.officer === officer)?.role || null;
            const injuredForEncounter = Boolean(
                slottedRole
                && activeCombatEncounter
                && !activeCombatEncounter.finished
                && isCombatRoleStunned(activeCombatEncounter, slottedRole)
            );
	        const textY = drawY - layoutConfig.nameOffsetY;
	        const centerX = drawX + width / 2;
            ctx.save();
            if (injuredForEncounter) {
                ctx.globalAlpha = 0.42;
            }
	        drawChevron(centerX, drawY - layoutConfig.chevronOffsetY, officer.rank);
	        drawOfficerHearts(officer, centerX, drawY);
	        ctx.textAlign = 'center';
	        drawTextOutlined(officer.name, centerX, textY);
	        drawTextOutlined(formatRoleLabel(officer.specialty), centerX, textY + layoutConfig.roleLabelOffsetY, 'bold 12px Arial');
	        ctx.textAlign = 'left';
	        ctx.drawImage(officer.img, drawX, drawY, width, height);
            if (injuredForEncounter) {
                const injuryImage = getEffectImage('injury.png');
                if (injuryImage?.complete) {
                    ctx.globalAlpha = 0.96;
                    ctx.drawImage(injuryImage, drawX + width * 0.62, drawY + height * 0.08, width * 0.34, width * 0.34);
                }
            }
            ctx.restore();
	    }

    function drawSideOfficers() {
        officers.forEach((officer, index) => {
            if (!officer) {
                drawBlankRosterSlot(index);
                return;
            }

            if (officer.img.complete) {
                if (index === hoveredSideOfficerIndex && !dragging) {
                    const hoverWidth = officer.width * layoutConfig.sideHoverScale;
                    const hoverHeight = officer.height * layoutConfig.sideHoverScale;
                    const hoverX = officer.x - (hoverWidth - officer.width) / 2;
                    const hoverY = officer.y - (hoverHeight - officer.height) / 2;
                    drawOfficer(officer, hoverX, hoverY, hoverWidth, hoverHeight);
                } else {
                    drawOfficer(officer, officer.x, officer.y);
                }
            }
        });
    }

    function drawSlotOfficers() {
        slots.forEach(slot => {
            if (slot.occupied && slot.officer) {
                const officer = slot.officer;
                const drawX = (dragging && dragSlot === slot) ? officer.x : slot.x;
                const drawY = (dragging && dragSlot === slot) ? officer.y : slot.y;
                drawOfficer(officer, drawX, drawY);
            }
        });
    }

	    function draw() {
	        ctx.clearRect(0, 0, canvas.width, canvas.height);
	        drawStarfield();
	        const titleVisible = !episodeTitle.classList.contains('hidden');
	        const bridgeVisible = !titleVisible && shipOpacity >= 0.98;

	        drawDestination();

	        if (shipOpacity > 0.02) {
	            drawShip();
	            drawShipOverlay();
	        }

	        if (bridgeVisible) {
	            drawHud();
	            drawDeckBackground();
	            drawSlots();
	            drawSideOfficers();
	            drawSlotOfficers();
                drawPromotionBursts();
	        }

        if (activeSpeechOfficer) {
            updateSpeechBubblePosition(activeSpeechOfficer);
        }
    }

    // --- Animation/game loop ---
    function startAnimation() {
        if (animationId === null) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }

    function stopAnimation() {
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function gameLoop() {
        const now = performance.now();
        const deltaSeconds = lastFrameTime === null ? 0 : (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        const fadeStep = deltaSeconds / (cinematicTiming.shipFadeMs / 1000);
        if (shipOpacity < targetShipOpacity) {
            shipOpacity = Math.min(targetShipOpacity, shipOpacity + fadeStep);
        } else if (shipOpacity > targetShipOpacity) {
            shipOpacity = Math.max(targetShipOpacity, shipOpacity - fadeStep);
        }

        // Animate stars (move left)
	        for (const star of stars) {
	            star.x -= star.speed;
	            if (star.x < 0) {
	                star.x = canvas.width;
	                star.y = Math.random() * canvas.height;
	                star.speed = 0.5 + Math.random() * 1.5;
	                star.size = 1 + Math.random() * 1.5;
	            }
	        }
        updateShipProgression(deltaSeconds);
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }

    // --- Drag and drop ---
    let dragging = false;
    let dragIndex = -1;
    let dragSlot = null;
    let offsetX, offsetY;

    function beginSideDrag(index, x, y) {
        const officer = officers[index];
        dragging = true;
        dragIndex = index;
        offsetX = x - officer.x;
        offsetY = y - officer.y;
        stopAnimation();
    }

    function beginSlotDrag(slot, x, y) {
        const officer = slot.officer;
        dragging = true;
        dragIndex = -1;
        dragSlot = slot;
        offsetX = x - officer.x;
        offsetY = y - officer.y;
        stopAnimation();
    }

    function getDraggedOfficer() {
        if (dragIndex >= 0) {
            return officers[dragIndex];
        }

        return dragSlot ? dragSlot.officer : null;
    }

    function updateDraggedOfficerPosition(x, y) {
        const officer = getDraggedOfficer();
        if (!officer) {
            return;
        }

        officer.x = x - offsetX;
        officer.y = y - offsetY;
    }

    function snapOfficerToSlot(officer, slot) {
        assignOfficerVoice(officer);
        slot.occupied = true;
        slot.officer = officer;
        officer.x = slot.x;
        officer.y = slot.y;
        officer.width = getDeckOfficerWidth();
        officer.height = getDeckOfficerHeight();
        markShipStatsDirty();
        checkEpisodeProgress();
    }

    function resetSideOfficerPosition() {
        const officer = officers[dragIndex];
        const pos = sidePositions[officer.sideIndex];
        officer.x = pos.x;
        officer.y = pos.y;
        officer.width = getSideOfficerWidth();
        officer.height = getSideOfficerHeight();
    }

    function resetSlotOfficerPosition() {
        if (dragSlot?.officer) {
            dragSlot.officer.x = dragSlot.x;
            dragSlot.officer.y = dragSlot.y;
        }
    }

    function findDropSlot(x, y, excludedSlot = null) {
        return slots.find(slot => slot !== excludedSlot && isPointOverSlot(x, y, slot)) || null;
    }

    function findDropSideOfficerIndex(x, y) {
        return sidePositions.findIndex((pos, index) => {
            const officer = officers[index];
            const slotX = officer ? officer.x : pos.x;
            const slotY = officer ? officer.y : pos.y;
            const slotWidth = officer ? officer.width : getSideOfficerWidth();
            const slotHeight = officer ? officer.height : getSideOfficerHeight();
            return x >= slotX && x <= slotX + slotWidth && y >= slotY && y <= slotY + slotHeight;
        });
    }

    function placeOfficerFromSideInSlot(targetSlot) {
        if (dragIndex < 0 || targetSlot.occupied) {
            return false;
        }

        const officer = officers[dragIndex];
        const sideIndex = dragIndex;
        snapOfficerToSlot(officer, targetSlot);
        officers[sideIndex] = null;
        return true;
    }

    function moveDraggedSlotOfficer(targetSlot) {
        if (!dragSlot?.officer || !targetSlot) {
            return false;
        }

        if (!targetSlot.occupied) {
            snapOfficerToSlot(dragSlot.officer, targetSlot);
            dragSlot.occupied = false;
            dragSlot.officer = null;
            markShipStatsDirty();
            return true;
        }

        const draggedOfficer = dragSlot.officer;
        const targetOfficer = targetSlot.officer;
        snapOfficerToSlot(draggedOfficer, targetSlot);
        snapOfficerToSlot(targetOfficer, dragSlot);
        return true;
    }

    function relieveDraggedSlotOfficerToSide(sideOfficerIndex) {
        if (!dragSlot?.officer || sideOfficerIndex < 0 || sideOfficerIndex >= officers.length) {
            return false;
        }

        const relievedOfficer = dragSlot.officer;
        const replacedOfficer = officers[sideOfficerIndex];
        const destinationSideIndex = sideOfficerIndex;

        relievedOfficer.sideIndex = destinationSideIndex;
        relievedOfficer.x = sidePositions[destinationSideIndex].x;
        relievedOfficer.y = sidePositions[destinationSideIndex].y;
        relievedOfficer.width = getSideOfficerWidth();
        relievedOfficer.height = getSideOfficerHeight();
        relievedOfficer.healProgress = 0;

        officers[sideOfficerIndex] = relievedOfficer;
        dragSlot.occupied = false;
        dragSlot.officer = null;

        if (activeSpeechOfficer === replacedOfficer) {
            hideSpeechBubble();
        }

        markShipStatsDirty();
        return true;
    }

    function endDrag() {
        dragging = false;
        dragIndex = -1;
        dragSlot = null;
        startAnimation();
    }

    canvas.addEventListener('mousedown', function(e) {
        const { x, y } = getCanvasPoint(e);

        if (episodeMode === 'interaction' && activeEncounterStep) {
            const selectedSlot = slots.find(slot => slot.occupied && slot.officer && isPointInOfficer(x, y, slot.officer));
            if (selectedSlot) {
                resolveEncounterChoice(activeEncounterStep, selectedSlot);
            }
            return;
        }

        officers.forEach((officer, index) => {
            if (!dragging && officer && isPointInOfficer(x, y, officer)) {
                beginSideDrag(index, x, y);
            }
        });

        if (!dragging) {
            slots.forEach(slot => {
                if (slot.occupied && slot.officer && isPointInOfficer(x, y, slot.officer)) {
                    beginSlotDrag(slot, x, y);
                }
            });
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        const { x, y } = getCanvasPoint(e);

        if (!dragging) {
            hoveredSideOfficerIndex = officers.findIndex(officer => officer && isPointInOfficer(x, y, officer));
	            hoveredEncounterSlot = episodeMode === 'interaction' && activeEncounterStep
	                ? (slots.find(slot =>
                        slot.occupied
                        && slot.officer
                        && (!activeCombatEncounter || (!activeCombatEncounter.inProgress && !activeCombatEncounter.awaitingRoundDismissal && !activeCombatEncounter.finished && !isCombatRoleStunned(activeCombatEncounter, slot.role)))
                        && isPointInOfficer(x, y, slot.officer)
                    ) || null)
	                : null;
        }

        if (dragging) {
            updateDraggedOfficerPosition(x, y);
            draw();
        } else {
            draw();
        }
    });

    canvas.addEventListener('mouseup', function(e) {
        if (dragging) {
            const { x, y } = getCanvasPoint(e);

            if (dragIndex >= 0) {
                const targetSlot = findDropSlot(x, y);
                if (!targetSlot || !placeOfficerFromSideInSlot(targetSlot)) {
                    resetSideOfficerPosition();
                }
            } else if (dragSlot) {
                const targetSlot = findDropSlot(x, y, dragSlot);
                if (targetSlot) {
                    if (!moveDraggedSlotOfficer(targetSlot)) {
                        resetSlotOfficerPosition();
                    }
                } else {
                    const sideOfficerIndex = findDropSideOfficerIndex(x, y);
                    if (!relieveDraggedSlotOfficerToSide(sideOfficerIndex)) {
                        resetSlotOfficerPosition();
                    }
                }
            }

            draw();
        }

        endDrag();
    });

});
