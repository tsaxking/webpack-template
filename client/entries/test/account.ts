import '../../utilities/imports';
import { Account } from '../../models/account';

Account.getAccount()
    .then((a) => a?.getPermissions())
    .then(console.log);
