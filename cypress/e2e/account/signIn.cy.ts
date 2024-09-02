import { SignInPage } from '../../pages/account/signInPage';

describe('Sign In Page', () => {
    const signInPage = new SignInPage();

    const user = {
        username: 'testuser',
        password: 'T3stP4ssword!',
        email: 'testmail@example.com',
        firstName: 'Test',
        lastName: 'User'
    };

    beforeEach(() => {
        signInPage.visit();
    });

    before(() => {
        cy.task('generateVerifiedAccount', {
            username: user.username,
            password: user.password,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        });
        cy.log('Account created');
    });

    after(() => {
        cy.task('removeAccountFromUsername', { username: user.username });
        cy.log('Account removed');
    });

    it('should display the correct title', () => {
        signInPage.verifyPageTitle('Test Server');
    });

    it('should show error for invalid email', () => {
        signInPage.enterUsername('invalid@domain');
        signInPage.verifyErrorMessage('Invalid email extension');
    });

    it('should disable submit button for invalid input', () => {
        signInPage.enterUsername('invalid@domain.com');
        signInPage.enterPassword('short');
        signInPage.verifySubmitButtonDisabled();
    });

    it('should enable submit button for valid input', () => {
        signInPage.enterUsername('valid@domain.com');
        signInPage.enterPassword('validpassword');
        signInPage.verifySubmitButtonEnabled();
    });

    it('should navigate to sign-up page', () => {
        signInPage.clickSignUpLink();
        cy.url().should('include', '/account/sign-up');
    });

    it('should login through API', () => {
        // cypress/support/commands.ts
        // can be used in any spec, logs in through API
        cy.login(user.username, user.password);
    });
    
    describe('Reset Password', () => {
        it('should handle reset password click', () => {
            signInPage.clickResetPassword();
            // need to add the reset password prompt
        });

        it('should handle cancel reset password', () => {
            signInPage.clickResetPassword();
            signInPage.cancelResetPassword();
        });
    });

    it('should successfully submit the form and redirect to home page', () => {
        signInPage.fillForm(user.username, user.password);
        signInPage.submitForm();
        cy.url().should('eq', 'http://localhost:3000/home');
        cy.task('removeAccountFromUsername', { username: user.username });
    });
});
