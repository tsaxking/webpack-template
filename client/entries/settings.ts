import './../utilities/imports';
import Settings from '../views/pages/Settings.svelte';
import { buildSocket } from '../utilities/socket';

buildSocket({
    interval: 1000,
    type: 'adaptive',
    timeLimit: 1000 * 60 * 5 // 5 minutes
});

new Settings({
    target: document.body,
    props: {
        settings: [
            {
                name: 'Theme',
                type: 'select',
                options: ['Light', 'Dark'],
                bindTo: 'theme',
                value: 'Dark'
            }
        ]
    }
});
