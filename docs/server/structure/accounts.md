# Account

The account class is where you can store user data. It is stored in the database
under Accounts.

## Creating an Account

```typescript runnable
import { Account } from './structure/account.ts';
const a = Account.create(
    'username',
    'password',
    'email',
    'firstName',
    'lastName'
);
if (a === 'created') {
    // account was created
} else {
    // account was not created, there was some error. The return value is the error message
}
```
