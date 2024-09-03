export class SignUpPage {
    // Selectors
    private readonly titleSelector = 'h1';
    private readonly usernameInputSelector = 'input[name=\'username\']';
    private readonly emailInputSelector = 'input[name=\'email\']';
    private readonly firstNameInputSelector = 'input[name=\'firstName\']';
    private readonly lastNameInputSelector = 'input[name=\'lastName\']';
    private readonly passwordInputSelector = 'input[placeholder=\'Password\']';
    private readonly confirmPasswordInputSelector = 'input[placeholder=\'Confirm Password\']';
    private readonly submitButtonSelector = 'input[type=\'submit\']';
    private readonly signInLinkSelector = 'a[href="/account/sign-in"]';
    private readonly errorSelector = 'small.text-danger';
    private readonly successSelector = 'small.text-success';

    // Page Methods

    visit() {
        cy.visit('/account/sign-up');
    }

    verifyPageTitle(expectedTitle: string) {
        cy.get(this.titleSelector).should(
            'contain.text',
            `${expectedTitle}: Sign up`
        );
    }

    enterUsername(username: string) {
        cy.get(this.usernameInputSelector).clear().type(username);
    }

    enterEmail(email: string) {
        cy.get(this.emailInputSelector).clear().type(email);
    }

    enterFirstName(firstName: string) {
        cy.get(this.firstNameInputSelector).clear().type(firstName);
    }

    enterLastName(lastName: string) {
        cy.get(this.lastNameInputSelector).clear().type(lastName);
    }

    enterPassword(password: string) {
        cy.get(this.passwordInputSelector).clear().type(password);
    }

    enterConfirmPassword(confirmPassword: string) {
        cy.get(this.confirmPasswordInputSelector).clear().type(confirmPassword);
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

    verifySuccessMessage(expectedMessage: string) {
        cy.get(this.successSelector).should('contain.text', expectedMessage);
    }

    clickSignInLink() {
        cy.get(this.signInLinkSelector).click();
    }

    fillForm(username: string, password: string, email: string, firstName: string, lastName: string) {
        this.enterUsername(username);
        this.enterPassword(password);
        this.enterConfirmPassword(password);
        this.enterEmail(email);
        this.enterFirstName(firstName);
        this.enterLastName(lastName);
    }
}
