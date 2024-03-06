import '../../utilities/imports';
import SignIn from '../../views/components/SignIn.svelte';

new SignIn({
    target: document.body,
    props: {
        title: document.title
    }
});
