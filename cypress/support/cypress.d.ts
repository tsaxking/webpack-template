// es2015 apparently requires this file to exist. its weird.

export {};

declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>;
        }
    }
}
