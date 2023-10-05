import { Account } from '../../models/account';
import '../../utilities/imports';

import ManageAccount from '../../views/components/account/ManageAccount.svelte';


Account.all().then(a => {
    new ManageAccount({
        target: document.body,
        props: {
            account: a[0],
            username: a[0].username,
            firstName: a[0].firstName,
            lastName: a[0].lastName,
            email: a[0].email,
            roles: a[0].roles,
            // verified: a[0].verified,
        }
    });
});