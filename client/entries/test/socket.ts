import { sleep } from '../../../shared/sleep';
import { ServerRequest } from '../../utilities/requests';
import { socket } from '../../utilities/socket';

socket.on('connect', () => {
    console.log('Connected!');
});

socket.on('init', console.log);

sleep(1000).then(async () => {
    const res = await ServerRequest.post('/test/get-socket');
    console.log(res);
});
