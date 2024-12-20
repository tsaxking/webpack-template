import { Account } from '../server/structure/structs/account';
import { DB } from '../server/utilities/database';

DB.connect().then(async () => {
    (await Account.Account.build()).unwrap();

    const [, , ...args] = process.argv;
    const accounts = +args[0];
    if (accounts < 1) throw new Error('Invalid number of accounts');

    const data = (
        await Account.Account.fromProperty('username', 'user0', false)
    ).unwrap();

    if (data.length) {
        throw new Error('Fake Accounts already exist');
    }

    await Promise.all(
        new Array(accounts).fill(0).map(async (_, i) => {
            const password = `password${i}`;
            const { hash, salt } = Account.newHash(password).unwrap();
            (
                await Account.Account.new({
                    firstName: `First${i}`,
                    lastName: `Last${i}`,
                    key: hash,
                    salt,
                    email: `${i}@fake.com`,
                    username: `user${i}`,
                    picture: '',
                    verified: false,
                    verification: ''
                })
            ).unwrap();
        })
    );

    process.exit(0);
});
