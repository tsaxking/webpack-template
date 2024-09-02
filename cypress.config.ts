import { defineConfig } from "cypress";
import Account from "./server/structure/accounts";

export default defineConfig({
  projectId: '1xne6k',
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      on('task', {
        async getAccountFromUsername({ username }: { username: string }) {
          const account = (await Account.fromUsername(username)).unwrap();
          if (!account) {
            return null;
          } else {
            return account;
          }
        },
        async generateVerifiedAccount({ username, password, email, firstName, lastName }: 
          { 
            username: string, 
            password: string, 
            email: string, 
            firstName: string, 
            lastName: string 
          }) {
          const a = (await Account.create(username, password, email, firstName, lastName)).unwrap();
          if (a.status === 'created') {
            const acc = (await Account.fromUsername(username)).unwrap();
            if (!acc) {
              return null;
            }
            return acc.verify();
          } else {
            return null;
          }
        },
        async removeAccountFromUsername({ username }: { username: string }) {
          const account = (await Account.fromUsername(username)).unwrap();
          if (!account) {
            return null;
          } else {
            const status = await Account.delete(account.id);
            if (status.unwrap() === 'removed') {
              return true;
            }
          }
        },
      });
    },
  },
});
