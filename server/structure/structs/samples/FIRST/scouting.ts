import { Struct } from '../../struct';
import { DB } from '../../../../utilities/database';

export namespace Scouting {
    export const MatchScouting = new Struct({
        sample: true,
        name: 'MatchScouting',
        database: DB,
        structure: {
            matchId: 'text',
            team: 'integer',
            scoutId: 'text',
            scoutGroup: 'integer',
            prescouting: 'boolean',
            trace: 'text',
            checks: 'text'
        },
        versionHistory: {
            type: 'versions',
            amount: 3
        }
    });

    export const TeamComments = new Struct({
        sample: true,
        name: 'TeamComments',
        database: DB,
        structure: {
            matchScoutingId: 'text',
            accountId: 'text',
            team: 'integer',
            comment: 'text',
            type: 'text',
            eventKey: 'text'
        }
    });

    export const PitScoutingSections = new Struct({
        sample: true,
        name: 'PitScoutingSections',
        database: DB,
        structure: {
            name: 'text',
            multiple: 'boolean',
            accountId: 'text'
        }
    });

    export const PitScoutingGroups = new Struct({
        sample: true,
        name: 'PitScoutingGroups',
        database: DB,
        structure: {
            eventKey: 'text',
            sectionId: 'text',
            name: 'text',
            accountId: 'text'
        }
    });

    export const PitScoutingQuestions = new Struct({
        sample: true,
        name: 'PitScoutingQuestions',
        database: DB,
        structure: {
            question: 'text',
            key: 'text',
            description: 'text',
            type: 'text',
            groupId: 'text',
            accountId: 'text'
        },
        validators: {
            type: val =>
                [
                    'boolean',
                    'number',
                    'textarea',
                    'text',
                    'radio',
                    'checkbox'
                ].includes(String(val))
        }
    });

    // for checkboxes/selections
    export const PitScoutingQuestionOptions = new Struct({
        sample: true,
        name: 'PitScoutingQuestionOptions',
        database: DB,
        structure: {
            questionId: 'text',
            option: 'text'
        }
    });

    export const PitScoutingAnswers = new Struct({
        sample: true,
        name: 'PitScoutingAnswers',
        database: DB,
        structure: {
            questionId: 'text',
            answer: 'text',
            teamNumber: 'integer',
            accountId: 'text'
        }
    });
}
