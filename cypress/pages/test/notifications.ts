export class NotificationsPage {
    private readonly selectors = Object.freeze({
        alert: 'button#alert',
        prompt: 'button#prompt',
        confirm: 'button#confirm',
        select: 'button#select',
        choose: 'button#choose',
    });

    public visit() {
        cy.visit('/test/notifications');
    }

    public clickAlert() {
        cy.get(this.selectors.alert).click();
    }

    public clickPrompt() {
        cy.get(this.selectors.prompt).click();
    }

    public clickConfirm() {
        cy.get(this.selectors.confirm).click();
    }

    public clickSelect() {
        cy.get(this.selectors.select).click();
    }

    public clickChoose() {
        cy.get(this.selectors.choose).click();
    }
}