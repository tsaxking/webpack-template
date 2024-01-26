import '../../utilities/imports';
import SignUp from '../../views/components/SignUp.svelte';
new SignUp({
    target: document.body,
    props: {
        title: document.title,
    },
});
