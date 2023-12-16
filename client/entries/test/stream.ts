import '../../utilities/imports';

import { ServerRequest } from '../../utilities/requests';

const start = Date.now();
const s = ServerRequest.retrieveStream('/test-stream');

let i = 0;
s.on('chunk', (d) => {
    // console.log('Chunk', d, i);
    i ++;
});
s.on('complete', (data) => {
    const end = Date.now();
    console.log('Complete', data);
    console.log('Time', end - start);

    console.log(data.map((d, i) => [d, i]).filter(([d, i]) => d !== i.toString()));
});