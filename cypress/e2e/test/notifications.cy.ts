import { NotificationsPage } from '../../pages/test/notifications';

describe('Notifications Page', () => {
    const notificationsPage = new NotificationsPage();

    beforeEach(() => {
        notificationsPage.visit();
    });

    it('should display alert', () => {
        notificationsPage.clickAlert();
        cy.get('#modal-alert').should('be.visible');
    });

    it('should display prompt', () => {
        notificationsPage.clickPrompt();
        cy.get('#modal-prompt').should('be.visible');
    });

    it('should display confirm', () => {
        notificationsPage.clickConfirm();
        cy.get('#modal-confirm').should('be.visible');
    });

    it('should display select', () => {
        notificationsPage.clickSelect();
        cy.get('#modal-select').should('be.visible');
    });

    it('should display choose', () => {
        notificationsPage.clickChoose();
        cy.get('#modal-choose').should('be.visible');
    });
});