import { Account } from '../../../shared/db-types';
import { SignInPage } from '../../pages/account/signInPage';

describe('Sign In Page', () => {
    const signInPage = new SignInPage();

    beforeEach(() => {
        signInPage.visit();
    });

    before(() => {
        it('should generate a verified account', () => {
            cy.task('generateVerifiedAccount', {
                username: 'testuser',
                password: 'T3stP4ssword!',
                email: 'testuser@example.com',
                firstName: 'Test',
                lastName: 'User'
            });
            console.log('Account created');
        });
    });

    after(() => {
        it('should remove the account', () => {
            cy.task('removeAccountFromUsername', { username: 'testuser' });
            console.log('Account removed');
        });
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

    it('should handle reset password click', () => {
        signInPage.clickResetPassword();
        // need to add the reset password prompt
    });

    it('should handle cancel reset password', () => {
        signInPage.clickResetPassword();
        signInPage.cancelResetPassword();
    });

    it('should successfully submit the form and redirect to home page', () => {
        signInPage.fillForm('testuser', 'T3stP4ssword!');
        signInPage.submitForm();
        cy.url().should('eq', 'http://localhost:3000/home');
        cy.task('removeAccountFromUsername', { username: 'testuser' });
    });
});
