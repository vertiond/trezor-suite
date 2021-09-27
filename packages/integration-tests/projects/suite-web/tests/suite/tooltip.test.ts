// @group:suite
// @retry=2

describe('Test tooltip links', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, version: Cypress.env('emuVersionT2') });
        cy.task('setupEmu', { passphrase_protection: true });
        cy.task('startBridge');
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cy.task('applySettings', { passphrase_always_on_device: false });

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
    });

    it('Learn button should open guide panel', () => {
        cy.getTestElement('@tooltip/passphrase-tooltip')
            .children()
            .children()
            .trigger('mouseenter');
        cy.hoverTestElement('@tooltip/openGuide').click();
        cy.getTestElement('@guide/panel').should('exist');
    });
});

describe('Test tooltip conditional rendering', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true, version: Cypress.env('emuVersionT2') });
        cy.task('setupEmu', { mnemonic: 'all all all all all all all all all all all all' });
        cy.task('startBridge');
        // eslint-disable-next-line @typescript-eslint/naming-convention

        cy.viewport(1024, 768).resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();
        cy.discoveryShouldFinish();
    });

    it('Tooltip should not render if device is connected', () => {
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.getTestElement('@switch-device/add-hidden-wallet-button').trigger('mouseenter');
        cy.getTestElement('@tooltip').should('not.exist');
    });

    it('Tooltip should render if device is disconnected', () => {
        cy.getTestElement('@menu/switch-device').click();
        cy.getTestElement('@switch-device/wallet-on-index/0/toggle-remember-switch').click({
            force: true,
        });
        cy.task('stopEmu');
        cy.task('stopBridge');
        cy.getTestElement('@switch-device/add-hidden-wallet-button').trigger('mouseenter', {
            force: true,
        });
        cy.getTestElement('@tooltip').should('exist');
    });
});
