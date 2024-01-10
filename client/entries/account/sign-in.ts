import '../../utilities/imports';
import SignIn from '../../views/components/SignIn.svelte';

const app = new SignIn({
    target: document.body,
    props: {
        title: 'Team Tators',
    },
});
