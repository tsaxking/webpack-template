import { SignUpPage } from '../../pages/account/signUpPage';

describe('Sign Up Page', () => {
    const signUpPage = new SignUpPage();

    const user = {
        username: 'validusername',
        email: 'testmail@example.com',
        password: 'ValidPassword1!',
        firstName: 'Test',
        lastName: 'User'
    };

    beforeEach(() => {
        signUpPage.visit();
    });

    after(() => {
        it('should remove the account', () => {
            cy.task('removeAccountFromUsername', { username: user.username });
            console.log('Account removed');
        });
    });

    it('should display the correct title', () => {
        signUpPage.verifyPageTitle('Test Server');
    });

    describe('Should show error messages for incorrect inputs', () => {
        it('should show an error for invalid username', () => {
            signUpPage.enterUsername('short');
            signUpPage.verifyErrorMessage('Invalid username');
        });

        it('should show an error for invalid email', () => {
            signUpPage.enterEmail('invalidemail');
            signUpPage.verifyErrorMessage('Invalid email');
        });

        it('should show an error for weak password', () => {
            signUpPage.enterPassword('weak');
            signUpPage.verifyErrorMessage(
                'Password must have the following properties:'
            );
        });

        it('should show an error for mismatched passwords', () => {
            signUpPage.enterPassword('StrongPassword1!');
            signUpPage.enterConfirmPassword('DifferentPassword1!');
            signUpPage.verifyErrorMessage('Passwords do not match');
        });

        it('should enable submit button for valid input', () => {
            signUpPage.enterUsername('validusername');
            signUpPage.enterEmail('valid@example.com');
            signUpPage.enterFirstName('John');
            signUpPage.enterLastName('Doe');
            signUpPage.enterPassword('ValidPassword1!');
            signUpPage.enterConfirmPassword('ValidPassword1!');
            signUpPage.verifySubmitButtonEnabled();
        });
    });

    it('should navigate to sign-in page', () => {
        signUpPage.clickSignInLink();
        cy.url().should('include', '/account/sign-in');
    });

    it('should successfully submit the form and redirect to sign-in page', () => {
        signUpPage.fillForm(
            user.username,
            user.password,
            user.email,
            user.firstName,
            user.lastName
        );
        signUpPage.submitForm();

        // Verify that the URL is redirected to the sign-in page
        cy.url().should('include', '/account/sign-in');
    });
});
