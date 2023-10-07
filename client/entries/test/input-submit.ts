import '../../utilities/imports';

import InputSubmit from '../../views/components/bootstrap/InputSubmit.svelte';


const app = new InputSubmit({
    target: document.body,
    props: {
        value: 'test',
        label: 'Test'
    }
});