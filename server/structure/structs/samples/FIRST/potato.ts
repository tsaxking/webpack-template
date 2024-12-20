import { DB } from '../../../../utilities/database';
import { Struct } from '../../struct';
import Filter from 'bad-words';

export namespace Potato {
    export const Friend = new Struct({
        name: 'PotatoFriend',
        structure: {
            accountId: 'text',
            level: 'integer',
            name: 'text'
        },
        sample: true,
        database: DB,
        validators: {
            name: name => {
                const f = new Filter();
                return f.isProfane(String(name));
            }
        }
    });
}
