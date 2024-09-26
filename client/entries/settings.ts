import './../utilities/imports';
import Settings from '../views/pages/Settings.svelte';

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
