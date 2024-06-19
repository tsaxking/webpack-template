import '../utilities/imports';
import { buildSocket } from '../utilities/socket';

buildSocket({
    interval: 1000,
    type: 'adaptive',
    timeLimit: 1000 * 60 * 5 // 5 minutes
});
