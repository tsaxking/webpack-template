// import io from '../../node_modules/socket.io/client-dist/socket.io.js';


// export const socket = io('http://localhost:9001', {
//     "force new connection": true,
//     "reconnectionAttempts": "Infinity",
//     "timeout": 10000,
//     "transports": ["websocket"]
// });

import App from '../views/App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});