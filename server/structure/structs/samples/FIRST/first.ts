import { Struct } from '../../struct';
import { DB } from '../../../../utilities/database';
// import { EventEmitter } from '../../../../../shared/event-emitter';

export namespace FIRST {
    export const Events = new Struct({
        database: DB,
        name: 'Events',
        structure: {
            eventKey: 'text',
            flipX: 'boolean',
            flipY: 'boolean'
        },
        sample: true
    });

    Events.all(true).pipe(event => {
        event.data.flipX;
    });

    export const Teams = new Struct({
        database: DB,
        name: 'Teams',
        structure: {
            number: 'integer',
            eventKey: 'text',
            watchPriority: 'integer',
            picture: 'text'
        },
        sample: true
    });

    export const Matches = new Struct({
        database: DB,
        name: 'Matches',
        structure: {
            eventKey: 'text',
            matchNumber: 'text',
            compLevel: 'text'
        },
        sample: true
    });

    export const CustomMatches = new Struct({
        database: DB,
        name: 'CustomMatches',
        structure: {
            eventKey: 'text',
            matchNumber: 'text',
            compLevel: 'text',
            red1: 'integer',
            red2: 'integer',
            red3: 'integer',
            red4: 'integer',
            blue1: 'integer',
            blue2: 'integer',
            blue3: 'integer',
            blue4: 'integer',
            name: 'text'
        },
        sample: true
    });

    export const Alliances = new Struct({
        database: DB,
        name: 'Alliances',
        structure: {
            eventKey: 'text',
            name: 'text',
            team1: 'integer',
            team2: 'integer',
            team3: 'integer'
        },
        sample: true
    });

    export const TBARequests = new Struct({
        database: DB,
        name: 'TBARequests',
        structure: {
            url: 'text',
            response: 'text',
            update: 'integer' // loop (minutes)
        },
        sample: true
        // loop: {
        //     fn: (s) => {
        //         const now = Date.now();
        //         s.all(true).pipe(r => {
        //             if (r.updated.getTime() + r.data.update * 1000 * 60 < now) {
        //                 TBARequest(r.data.url);
        //             }
        //         });
        //     },
        //     time: 10, // every 10 minutes
        // }
    });

    // class TBAResult<T> {
    //     public readonly em = new EventEmitter<{
    //         update: T;
    //     }>();
    // }

    // export const TBARequest = (url: string) => {};
}
