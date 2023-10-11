import '../../utilities/imports';

import { ServerRequest } from '../../utilities/requests';

const s = ServerRequest.retrieveStream('/test-stream');

s.on('chunk', console.log);
s.on('complete', console.log);