import Account from "../server/structure/accounts.ts";

const [username] = Deno.args;

const a = Account.fromUsername(username);

if (!a) throw new Error('Account not found');

const status = a.verify();

console.log(username + '\'s', 'verification status:', status);