import { Account } from '../../models/account';
import { Role } from '../../models/roles';
import '../../utilities/imports';
import App from '../../views/components/accounts/RoleBadge.svelte';

const myApp = new App({
    target: document.body,
    props: {
        account: new Account({
            id: '1',
            username: 'test',
            email: '',
            firstName: '',
            lastName: '',
            verified: 1,
            created: Date.now(),
            phoneNumber: '',
            picture: '',
        }),
        role: new Role({
            id: '1',
            name: 'Test',
            description: 'Test',
            rank: 1,
        }),
        deletable: true,
    },
});
