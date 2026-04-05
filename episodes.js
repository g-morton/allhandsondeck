const episodes = [

    {
        id: 'episode-01',
        title: 'To boldly start a new game',
        rewards: {
            fillRosterSlots: 2,
            experience: 10
        },
        steps: [
            {
                type: 'title',
                text: 'To boldly start a new game',
                duration: 3200
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'The USS Scrumble prepares for her maiden voyage. A routine patrol through the famously uneventful Fatoosh sector.',
                duration: 4200
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'The empty bridge awaits its new crew. That\'s your cue, player, to assign the officers to their stations...',
                duration: 4200
            },
            {
                type: 'waitForStations'
            },
            {
                type: 'chairDialogue',
                role: 'Captain',
                text: 'Full crew assembled. They look promising, if not a bit confused.',
                duration: 3200
            },
            {
                type: 'chairDialogue',
                role: 'Engineering',
                text: 'All systems nominal. Though the coffee machine is out of beans.',
                duration: 3200
            },
            {
                type: 'chairDialogue',
                role: 'Captain',
                text: 'Helm, take us out.',
                duration: 2600
            },
            {
                type: 'chairDialogue',
                role: 'Helm',
                text: 'Aye, Captain. One-quarter wiggle power.',
                duration: 3000
            },
            {
                type: 'chairDialogue',
                role: 'Science',
                text: 'Wait, is that a real unit? I must have missed that lecture.',
                duration: 2200
            },
            {
                type: 'travel',
                duration: 10000,
                destination: {
                    image: 'spacestation.png',
                    label: 'Galileo Restock Station'
                }
            },
                        {
                type: 'narration',
                speaker: 'Narrator',
                text: 'The USS Scrumble docks safely. Supplies replenished. Laundry washed. Everything is quiet. For now.',
                duration: 3200
            },
            {
                type: 'chairDialogue',
                role: 'Science',
                text: 'Well that was less than fascinating.',
                duration: 2800
            },
            {
                type: 'chairDialogue',
                role: 'Tactical',
                text: 'I\'ll say. I didn\'t even get to shoot at anything.',
                duration: 2800
            }

        ]
    },

    {
        id: 'episode-02',
        title: 'A mystery in a tea cup',
        rewards: {
            experience: 6,
            technology: 2,
            fillRosterSlots: 1
        },
        steps: [
            {
                type: 'title',
                text: 'A mystery in a tea cup',
                duration: 3400
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'Restocked and moderately overconfident, the USS Scrumble returns to the Fatoosh sector... which immediately produces something it absolutely did not have five minutes ago.',
                duration: 4200
            },
            {
                type: 'chairDialogue',
                role: 'Helm',
                text: 'Contact ahead. It\'s... wobbling. I don\'t trust anything that wobbles with intent.',
                duration: 3600
            },
            {
                type: 'chairDialogue',
                role: 'Science',
                text: 'That is not a natural phenomenon. Nor is it a polite one.',
                duration: 3200
            },
            {
                type: 'chairDialogue',
                role: 'Tactical',
                text: 'It has a handle. I consider that a design flaw.',
                duration: 3000
            },
            {
                type: 'encounter',
                title: 'Anomaly Response',
                text: 'A tea-cup-shaped anomaly drifts across the bow, radiating structured nonsense. Who takes responsibility for this poor decision?',
                soundStart: 'suspense-1.mp3',
                soundEndSuccess: 'success.mp3',
                soundEndFailure: 'failure.mp3',
                object: {
                    image: 'anomaly.png'
                },
                successTarget: 2.8,
                leaning: {
                    Science: 0.95,
                    Engineering: 0.8,
                    Captain: 0.2,
                    Tactical: -0.95,
                    Helm: -0.7
                },
                responses: {
                    Science: {
                        attempt: 'Initiating full scan. If this turns out to be made of actual tea, I will resign.',
                        success: 'Scan complete. It is not tea. It is a violation of several agreements reality made with itself. Compensating now...',
                        failure: 'The anomaly resisted analysis. I believe it took my unsolicited scans personally.'
                    },
                    Engineering: {
                        attempt: 'Re-tuning the shields to match the nonsense frequency. This is either genius or a story.',
                        success: 'Shield alignment achieved. The anomaly is stable... and quietly judging us.',
                        failure: 'The shields have joined the anomaly. I would like them back.'
                    },
                    Captain: {
                        attempt: 'Remain calm. Apply protocol. If no protocol exists, invent one with confidence.',
                        success: 'Situation stabilised. We now have a protocol for this filed under hot space beverages.',
                        failure: 'We have all learned something important today. Space is strange.'
                    },
                    Tactical: {
                        attempt: 'Request permission to solve this with weapons?',
                        success: 'A warning shot was sufficient. I am both surprised and relieved.',
                        failure: 'The anomaly responded poorly to our violence. I guess that was to be expected from an intergalactic fathomless energy source of unknown origin.'
                    },
                    Helm: {
                        attempt: 'Plotting a course through the cup handle. I regret everything about this plan.',
                        success: 'We slipped through cleanly. That was deliberately accidental.',
                        failure: 'We chipped the saucer. And it chipped us back.'
                    }
                },
                outcomes: {
                    success: [
                        { type: 'technology', amount: 4 },
                        { type: 'experience', amount: 20 }
                    ],
                    failure: [
                        { type: 'power', amount: -12, overlayImage: 'mystery-medium.png', overlayDurationMs: 2400 },
                        { type: 'hull', amount: -8 }
                    ]
                },
                resultDelay: 2600,
                aftermathDelay: 3000
            },
            {
                type: 'chairDialogue',
                role: 'Science',
                text: 'I am adding this to my list of fun things that should not exist. It\'s a fast growing list.',
                duration: 3200
            },
            {
                type: 'chairDialogue',
                role: 'Captain',
                text: 'Excellent teamwork from myself. The rest of you performed adequately.',
                duration: 3600
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'The anomaly collapses into harmless sparkles. The log is filed under: Beverage-Adjacent Incidents, Highly Regrettable.',
                duration: 3800
            }
        ]
    },


    {
    id: 'episode-03',
    title: 'Rock and a harder place',
    rewards: {
        experience: 8,
        fillRosterSlots: 1,
        power: 2
    },
    steps: [
        {
            type: 'title',
            text: 'Rock and a harder place',
            duration: 3400
        },
        {
            type: 'narration',
            speaker: 'Narrator',
            text: 'Confidence restored, the USS Scrumble continues its patrol... directly into a statistically unlikely number of rocks.',
            duration: 4200
        },
        {
            type: 'chairDialogue',
            role: 'Helm',
            text: 'Asteroids ahead. Small ones. Manageable ones.',
            duration: 3000
        },
        {
            type: 'chairDialogue',
            role: 'Tactical',
            text: 'Finally.',
            duration: 2000
        },

        // --- ENCOUNTER 1: SMALL FIELD ---
        {
            type: 'encounter',
            title: 'Asteroid Field (Light)',
            text: 'A loose cluster of drifting asteroids blocks your path. Annoying, but survivable. Who handles it?',
            soundStart: 'suspense-1.mp3',
            soundEndSuccess: 'success.mp3',
            soundEndFailure: 'failure.mp3',
            object: {
                image: 'asteriod-small.png'
            },
            successTarget: 2.2,
            leaning: {
                Helm: 0.95,
                Science: 0.6,
                Engineering: 0.5,
                Captain: 0.2,
                Tactical: -0.4
            },
            responses: {
                Helm: {
                    attempt: 'Easy work. Gliding through.',
                    success: 'Clean path. Barely worth mentioning.',
                    failure: 'Minor contact. I meant to do that.'
                },
                Science: {
                    attempt: 'Calculating trajectories. Rocks are predictable. Usually.',
                    success: 'Path identified. Proceed with caution.',
                    failure: 'One rock was… less predictable.'
                },
                Engineering: {
                    attempt: 'Reinforcing structural integrity. Just in case.',
                    success: 'Hull stable. Ship approves.',
                    failure: 'Hull disagrees.'
                },
                Captain: {
                    attempt: 'Take it slow. We are not in a hurry to collide.',
                    success: 'Well navigated.',
                    failure: 'A learning experience.'
                },
                Tactical: {
                    attempt: 'Request permission to clear a path.',
                    success: 'Path cleared. Efficient.',
                    failure: 'Debris has… increased.'
                }
            },
            outcomes: {
                success: [
                    { type: 'experience', amount: 15 }
                ],
                failure: [
                    { type: 'hull', amount: -6, overlayImage: 'explosion-small.png', overlayDurationMs: 1800 }
                ]
            },
            resultDelay: 2200,
            aftermathDelay: 2600
        },

        {
            type: 'chairDialogue',
            role: 'Engineering',
            text: 'Hull integrity holding. Comfortably… ish.',
            duration: 3000
        },
        {
            type: 'chairDialogue',
            role: 'Science',
            text: 'That was the small cluster.',
            duration: 2600
        },
        {
            type: 'chairDialogue',
            role: 'Helm',
            text: 'There\'s a bigger one, isn\'t there.',
            duration: 2600
        },

        // --- ESCALATION ---
        {
            type: 'narration',
            speaker: 'Narrator',
            text: 'There is a bigger one.',
            duration: 2000
        },
        {
            type: 'chairDialogue',
            role: 'Tactical',
            text: 'Oh good.',
            duration: 1800
        },

        // --- ENCOUNTER 2: HEAVY FIELD ---
        {
            type: 'encounter',
            title: 'Asteroid Field (Dense)',
            text: 'A massive wall of tumbling rock fills the void ahead. This is no longer a suggestion. Who handles it?',
            soundStart: 'suspense-1.mp3',
            soundEndSuccess: 'success.mp3',
            soundEndFailure: 'failure.mp3',
            object: {
                image: 'asteriod-large.png'
            },
            successTarget: 3.2,
            leaning: {
                Helm: 0.9,
                Engineering: 0.85,
                Science: 0.5,
                Captain: 0.3,
                Tactical: -0.7
            },
            responses: {
                Helm: {
                    attempt: 'Alright. This one\'s... less easy.',
                    success: 'Threaded the gap. That was intentional.',
                    failure: 'We are now part of the field.'
                },
                Engineering: {
                    attempt: 'Diverting power to shields. All of it.',
                    success: 'Shields holding. Magnificently.',
                    failure: 'Shields are holding... opinions.'
                },
                Science: {
                    attempt: 'Plotting optimal path. There is one. I hope.',
                    success: 'Trajectory confirmed. Follow precisely.',
                    failure: 'The math was correct. Reality disagreed.'
                },
                Captain: {
                    attempt: 'Steady. Commit to the path.',
                    success: 'Well done. That looked deliberate.',
                    failure: 'We will describe that differently in the log.'
                },
                Tactical: {
                    attempt: 'Permission to make this field smaller.',
                    success: 'Selective clearing successful.',
                    failure: 'It is now… more field.'
                }
            },
            outcomes: {
                success: [
                    { type: 'experience', amount: 25 },
                    { type: 'power', amount: 4 }
                ],
                failure: [
                    { type: 'hull', amount: -12, overlayImage: 'explosion-large.png', overlayDurationMs: 2200 },
                    { type: 'power', amount: -8 }
                ]
            },
            resultDelay: 2600,
            aftermathDelay: 3000
        },

        // --- RESOLUTION ---
        {
            type: 'chairDialogue',
            role: 'Engineering',
            text: 'We survived. The ship would like a moment.',
            duration: 3200
        },
        {
            type: 'chairDialogue',
            role: 'Captain',
            text: 'Log it as controlled navigation.',
            duration: 2600
        },
        {
            type: 'chairDialogue',
            role: 'Science',
            text: 'It was not controlled.',
            duration: 2200
        },
        {
            type: 'chairDialogue',
            role: 'Helm',
            text: 'It was stylish.',
            duration: 2200
        },
        {
            type: 'narration',
            speaker: 'Narrator',
            text: 'The USS Scrumble emerges from the asteroid field battered, triumphant, and slightly more confident than is medically advisable.',
            duration: 3800
        }
    ]
},




{
    id: 'episode-04',
    title: 'An inconvenient welcome',
    rewards: {
        experience: 10,
        technology: 2,
        fillRosterSlots: 1
    },
    steps: [
        {
            type: 'title',
            text: 'An inconvenient welcome',
            duration: 3400
        },
        {
            type: 'narration',
            speaker: 'Narrator',
            text: 'Fresh from their unlikely survival, the USS Scrumble stumbles upon something rare… a previously uncharted planet.',
            duration: 4200
        },
        {
            type: 'chairDialogue',
            role: 'Science',
            text: 'New planetary body detected. Atmosphere stable. Composition intriguing.',
            duration: 3200
        },
        {
            type: 'chairDialogue',
            role: 'Helm',
            text: 'It looks… peaceful.',
            duration: 2600
        },
        {
            type: 'chairDialogue',
            role: 'Captain',
            text: 'Stay cautious. Peaceful rarely stays that way.',
            duration: 3000
        },

        // --- ENCOUNTER 1: PLANET ANALYSIS ---
        {
            type: 'encounter',
            title: 'Planetary Survey',
            text: 'A pristine, uncharted planet lies ahead. Valuable data awaits. Who leads the survey?',
            soundStart: 'suspense-1.mp3',
            soundEndSuccess: 'success.mp3',
            soundEndFailure: 'failure.mp3',
            object: {
                image: 'planet.png',
                label: 'Uncharted Planet'
            },
            successTarget: 2.6,
            leaning: {
                Science: 0.95,
                Captain: 0.4,
                Engineering: 0.5,
                Helm: 0.2,
                Tactical: -0.6
            },
            responses: {
                Science: {
                    attempt: 'Initiating full-spectrum scan. Let us learn something useful.',
                    success: 'Fascinating. Rich resources and no immediate hostility detected.',
                    failure: 'Scan incomplete. Something is interfering.'
                },
                Engineering: {
                    attempt: 'Boosting sensor resolution. Let’s see what this thing is made of.',
                    success: 'Readings enhanced. That is… a very valuable rock.',
                    failure: 'Sensors overloaded. It may have objected.'
                },
                Captain: {
                    attempt: 'Proceed carefully. Gather what we can.',
                    success: 'Survey complete. A promising find.',
                    failure: 'We have… partial information.'
                },
                Helm: {
                    attempt: 'Bringing us in closer. Nice and easy.',
                    success: 'Optimal position achieved.',
                    failure: 'That was slightly closer than planned.'
                },
                Tactical: {
                    attempt: 'Scanning for threats. There is always a threat.',
                    success: 'No immediate hostiles. Suspicious.',
                    failure: 'I may have… escalated the situation.'
                }
            },
            outcomes: {
                success: [
                    { type: 'technology', amount: 6 },
                    { type: 'experience', amount: 20 }
                ],
                failure: [
                    { type: 'power', amount: -6 }
                ]
            },
            resultDelay: 2400,
            aftermathDelay: 2800
        },

        {
            type: 'chairDialogue',
            role: 'Science',
            text: 'This could be a significant discovery.',
            duration: 2800
        },
        {
            type: 'chairDialogue',
            role: 'Tactical',
            text: 'Then something will try to take it.',
            duration: 2600
        },

        // --- PIRATE ARRIVAL ---
        {
            type: 'narration',
            speaker: 'Narrator',
            text: 'On cue, several ships emerge from behind the planet. Their design philosophy is… aggressive.',
            duration: 3600
        },
        {
            type: 'chairDialogue',
            role: 'Helm',
            text: 'Multiple contacts. Fast. Definitely not peaceful.',
            duration: 3000
        },
        {
            type: 'chairDialogue',
            role: 'Engineering',
            text: 'I knew the calm was suspicious.',
            duration: 2600
        },

        // --- ENCOUNTER 2: PIRATE STANDOFF ---
        {
            type: 'encounter',
            title: 'Pirate Intercept',
            text: 'A squadron of pirates blocks your path. Their message is simple: leave or be removed. Who responds?',
            soundStart: 'battle-1.mp3',
            soundEndSuccess: 'success.mp3',
            soundEndFailure: 'failure.mp3',
            object: {
                image: 'enemy-warship.png',
                label: 'Pirate Squadron'
            },
            combat: {
                enemyLabel: 'Pirate Squadron',
                introText: 'Combat exchange: best of five. Pick one bridge chair and let them talk, bluff, dodge, or hit their way through it.',
                selectionHint: 'Choose your chair carefully. Each round the pirates play Muscle or Smartz.',
                enemyStats: {
                    muscle: 4.6,
                    smartz: 3.7
                },
                playerVariance: 1.9,
                enemyVariance: 1.7,
                roundWinXp: 5,
                roundLossEffects: [
                    { type: 'hull', amount: -3, overlayImage: 'explosion-small.png', overlayDurationMs: 1500 },
                    { type: 'personnel', amount: -4 }
                ],
                roundDelay: 1700
            },
            successTarget: 3.0,
            leaning: {
                Tactical: 0.95,
                Captain: 0.7,
                Engineering: 0.6,
                Helm: 0.4,
                Science: -0.5
            },
            responses: {
                Tactical: {
                    attempt: 'Finally. A proper problem.',
                    success: 'Pirates disengaging. They understand strength.',
                    failure: 'They have chosen violence. I respect that.'
                },
                Captain: {
                    attempt: 'Open a channel. Let us attempt diplomacy.',
                    success: 'They have reconsidered. Reluctantly.',
                    failure: 'Diplomacy has failed. Predictably.'
                },
                Engineering: {
                    attempt: 'Diverting power to shields and… other surprises.',
                    success: 'Systems holding. They seem unsure.',
                    failure: 'Systems strained. They seem encouraged.'
                },
                Helm: {
                    attempt: 'Evasive pattern. Fast and confusing.',
                    success: 'We slipped past them cleanly.',
                    failure: 'They anticipated that. Rude.'
                },
                Science: {
                    attempt: 'Attempting to understand their intent.',
                    success: 'Their behaviour is predictable. Avoidable.',
                    failure: 'Their intent is… hostile. Confirmed.'
                }
            },
            outcomes: {
                success: [
                    { type: 'experience', amount: 30 },
                    { type: 'technology', amount: 4 }
                ],
                failure: [
                    { type: 'hull', amount: -10 },
                    { type: 'power', amount: -10 }
                ]
            },
            resultDelay: 2600,
            aftermathDelay: 3000
        },

        // --- RESOLUTION ---
        {
            type: 'chairDialogue',
            role: 'Captain',
            text: 'We will log this planet as… contested.',
            duration: 2800
        },
        {
            type: 'chairDialogue',
            role: 'Tactical',
            text: 'We should come back.',
            duration: 2200
        },
        {
            type: 'chairDialogue',
            role: 'Science',
            text: 'With more preparation.',
            duration: 2200
        },
        {
            type: 'chairDialogue',
            role: 'Engineering',
            text: 'And more ship.',
            duration: 2200
        },
        {
            type: 'narration',
            speaker: 'Narrator',
            text: 'The USS Scrumble departs, leaving behind a valuable discovery… and a note to return better equipped.',
            duration: 3800
        }
    ]
}
    



];
