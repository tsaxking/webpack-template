describe('Create an account', () => {
  it('should be able to create an account', () => {
    cy.visit('http://localhost:3000/');
    cy.get('a[href=\'/account/sign-up\']').click();

    cy.get('input[name=\'username\']').type('testuser');
    cy.get('input[name=\'email\']').type('testmail@gmail.com'); // can use free service to generate emails
    cy.get('input[name=\'firstName\']').type('Test');
    cy.get('input[name=\'lastName\']').type('User');
    cy.get('input[placeholder=\'Password\']').type('t3stPassword!');
    cy.get('input[placeholder=\'Confirm Password\']').type('t3stPassword!');
    cy.get('input[type=\'submit\']').click();
  });
});