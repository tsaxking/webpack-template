/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// ***********************************************
// I am very confused by this file.
// The cypress recommendation as above is completely broken;
// instead I have ./cypress.d.ts to define the types
//
// Technically I can have the types of ./cypress.d.ts in here,
// if prefaced with export {}
// However, that makes eslint unhappy with error:
// ES2015 module syntax is preferred over namespaces @typescript-eslint/no-namespace
// ***********************************************

// this is kind of cool, the types inferred are actually defined in ./cypress.d.ts
Cypress.Commands.add('login', (email, password) => {
    cy.request({
        method: 'POST',
        url: '/account/sign-in',
        body: {
            username: email,
            password: password,
        },
    }).then((response) => {
        console.log(response);
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('$status').to.eq('logged-in');
    });
});