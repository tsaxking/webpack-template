import { GlobalCols } from '../../../shared/struct';
import { Data, Struct, StructData } from '../../models/struct';
import { globalize } from '../../utilities/global';
import { socket } from '../../utilities/socket';
import Test from '../../views/pages/test/Test.svelte';

export const testStruct = new Struct({
    socket,
    name: 'TestStruct',
    structure: {
        name: 'text',
        age: 'integer'
    }
});

export type SType = StructData<(typeof testStruct)['data']['structure']>;

new Test({
    target: document.body
});

globalize(testStruct, 'Test');
