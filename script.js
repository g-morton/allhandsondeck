document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start-button');
    const startPanel = document.getElementById('start-panel');
    const gamePanel = document.getElementById('game-panel');
    const canvas = document.getElementById('game-canvas');
    const episodeTitle = document.getElementById('episode-title');
    const narrationBox = document.getElementById('narration-box');
    const narrationSpeaker = document.getElementById('narration-speaker');
    const narrationText = document.getElementById('narration-text');
    const speechBubble = document.getElementById('speech-bubble');
    const speechSpeaker = document.getElementById('speech-speaker');
    const speechText = document.getElementById('speech-text');
    const interactionPanel = document.getElementById('interaction-panel');
    const interactionTitle = document.getElementById('interaction-title');
    const interactionText = document.getElementById('interaction-text');
    const interactionChoices = document.getElementById('interaction-choices');
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
        chevronOffsetY: 60,
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
    let officerScale = 1;
    let cachedShipStats = null;
    let shipStatsDirty = true;
    let activeEpisode = null;
    let episodeStepIndex = 0;
    let episodeTimeoutId = null;
    let episodeMode = 'free';
    let episodeWaitCondition = null;
    const voiceClipPaths = Array.from({ length: 9 }, (_, index) => `assets/sound/voice-${index + 1}.mp3`);
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
	    let uiTimeoutIds = [];
	    let promotionBursts = [];
	    let activeShipOverlay = null;

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
        // Side positions: two columns on each side, vertically centered in lower 2/3
        const nextSidePositions = [];
        const mgmtTop = canvas.height / 3;
        const mgmtHeight = canvas.height * 2 / 3;
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
        // Deck slots (center 50% of lower 2/3)
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
        narrationBox.classList.add('hidden');
        narrationBox.classList.remove('visible');
    }

    function showNarration(speaker, text) {
        narrationSpeaker.textContent = speaker;
        narrationText.textContent = text;
        narrationBox.classList.remove('hidden');
        narrationBox.classList.add('visible');
    }

    function hideInteractionPanel() {
        hoveredEncounterSlot = null;
        interactionPanel.classList.add('hidden');
        interactionPanel.classList.remove('visible');
        interactionChoices.innerHTML = '';
    }

    function showInteractionPanel(title, text) {
        interactionTitle.textContent = title || 'Bridge Response Needed';
        interactionText.textContent = text || '';
        interactionPanel.classList.remove('hidden');
        interactionPanel.classList.add('visible');
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

    function showOfficerDialogue(officer, text) {
        hideNarration();
        showSpeechBubble(officer, text);
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

    function resolveEncounterChoice(step, slot) {
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

    function startEncounter(step) {
        activeEncounterStep = step;
        hideEpisodeTitle();
        hideSpeechBubble();
        hideNarration();
        if (step.soundStart) {
            playEpisodeSound(`assets/sound/${step.soundStart}`);
        }
        setActiveDestination(step.object, step.duration || 9000);
        setEpisodeMode('interaction');
        hoveredEncounterSlot = null;
        hideInteractionPanel();
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
            showNarration(step.speaker || 'Narrator', step.text);
            scheduleNextEpisodeStep(step.duration);
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

        shipState.hull = clampShipStat(shipState.hull + deltaSeconds * (0.08 + engineeringSupport * 0.02));
        shipState.power = clampShipStat(shipState.power + deltaSeconds * (0.06 + engineeringSupport * 0.025 + scienceSupport * 0.01));
        shipState.personnel = clampShipStat(shipState.personnel + deltaSeconds * (0.03 + scienceSupport * 0.018 + engineeringSupport * 0.008));

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

    function clampShipStat(value) {
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
	        if (!activeDestination || !destinationImage.complete || episodeMode === 'outro') {
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
        const mgmtTop = canvas.height / 3;
        const mgmtHeight = canvas.height * 2 / 3;
        const deckX = canvas.width * 0.25;
        const deckWidth = canvas.width * 0.5;
        if (deckImage.complete) {
            ctx.drawImage(deckImage, deckX, mgmtTop, deckWidth, mgmtHeight);
        }
    }

    function drawSlots() {
        slots.forEach(slot => {
            ctx.save();
            const isEncounterSelectable = episodeMode === 'interaction' && activeEncounterStep && slot.occupied && slot.officer;
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

        const panelWidth = Math.min(540, canvas.width - 40);
        const panelHeight = 126;
        const panelX = canvas.width / 2 - panelWidth / 2;
        const panelY = 44;
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
        drawTextOutlined('Roll over a seated bridge officer and click to choose them.', canvas.width / 2, panelY + 106, 'bold 14px Arial');
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
        const textY = drawY - layoutConfig.nameOffsetY;
        const centerX = drawX + width / 2;
        drawChevron(centerX, drawY - layoutConfig.chevronOffsetY, officer.rank);
        drawOfficerHearts(officer, centerX, drawY);
        ctx.textAlign = 'center';
        drawTextOutlined(officer.name, centerX, textY);
        drawTextOutlined(formatRoleLabel(officer.specialty), centerX, textY + layoutConfig.roleLabelOffsetY, 'bold 12px Arial');
        ctx.textAlign = 'left';
        ctx.drawImage(officer.img, drawX, drawY, width, height);
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
                drawEncounterPrompt();
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
                ? (slots.find(slot => slot.occupied && slot.officer && isPointInOfficer(x, y, slot.officer)) || null)
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
