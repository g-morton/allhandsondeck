const episodes = [
    {
        id: 'episode-01',
        title: 'Episode 1: To boldly start a new game',
        rewards: {
            fillRosterSlots: 2,
            shipExperience: 5,
            crewExperience: 4
        },
        steps: [
            {
                type: 'title',
                text: 'Episode 1: To boldly start a new game',
                duration: 3200
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'The USS Scrumble awaits its maiden voyage. A routine patrol in the always quiet and safe Fatoosh sector.',
                duration: 4200
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'To get underway, highly skilled officers hopefully each take a seat on the bridge that reflects their experience and training...',
                duration: 4600
            },
            {
                type: 'waitForStations'
            },
            {
                type: 'chairDialogue',
                role: 'Captain',
                speakerLabel: 'Captain',
                text: 'Excellent. I trust we have assembled a qualified bridge crew instead of an interpretive dance troupe.',
                duration: 3600
            },
            {
                type: 'chairDialogue',
                role: 'Captain',
                speakerLabel: 'Captain',
                text: 'Helm - take us out.',
                duration: 3600
            },
            {
                type: 'travel',
                duration: 10000
            },
            {
                type: 'narration',
                speaker: 'Narrator',
                text: 'The ship clears the sector without incident. Episode complete.',
                duration: 3600
            }
        ]
    }
];
