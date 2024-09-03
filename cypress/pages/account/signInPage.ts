export class SignInPage {
    // Selectors
    private readonly titleSelector = 'h1';
    private readonly usernameInputSelector = 'input[name=\'username\']';
    private readonly passwordInputSelector = 'input[placeholder=\'Password\']';
    private readonly resetPasswordLinkSelector = 'Reset Password';
    private readonly submitButtonSelector = 'input[type="submit"]';
    private readonly signUpLinkSelector = 'a[href="/account/sign-up"]';
    private readonly errorSelector = 'small.text-danger';
	private readonly passwordVisibilityToggle = 'visibility';

	// Page Methods

	visit() {
		cy.visit('/account/sign-in');
	}

    verifyPageTitle(expectedTitle: string) {
        cy.get(this.titleSelector).should(
            'contain.text',
            `${expectedTitle}: Sign in`
        );
    }

    enterUsername(username: string) {
        cy.get(this.usernameInputSelector).clear().type(username);
    }

    enterPassword(password: string) {
        cy.get(this.passwordInputSelector).clear().type(password);
    }

	togglePasswordVisibility() {
		cy.contains(this.passwordVisibilityToggle).click();
	}

    clickResetPassword() {
        cy.contains('a', this.resetPasswordLinkSelector).click();
    }

    cancelResetPassword() {
        cy.contains('button', 'Cancel').click();
    }

    submitForm() {
        cy.get(this.submitButtonSelector).click();
    }

    verifySubmitButtonDisabled() {
        cy.get(this.submitButtonSelector).should('be.disabled');
    }

    verifySubmitButtonEnabled() {
        cy.get(this.submitButtonSelector).should('not.be.disabled');
    }

    verifyErrorMessage(expectedMessage: string) {
        cy.get(this.errorSelector).should('contain.text', expectedMessage);
    }

    clickSignUpLink() {
        cy.get(this.signUpLinkSelector).click();
    }

    generateVerifiedAccount(username: string, password: string, email: string, firstName: string, lastName: string) {
        cy.task('generateVerifiedAccount', {
            username,
            password,
            email,
            firstName,
            lastName
        });
    }

    fillForm(username: string, password: string) {
        this.enterUsername(username);
        this.enterPassword(password);
    }
}