describe('RIDE navigation and page states', () => {
  it('shows the animated progress bar during internal page navigation', () => {
    cy.visit('/');
    cy.get('.ride-progress-bar').should('not.exist');

    let modalSnapshot: { text: string; hasIndicator: boolean; valueText: string | null; valueNow: string | null } | undefined;
    cy.document().then((document) => {
      const observer = new MutationObserver(() => {
        const card = document.querySelector('.loading-progress-card');
        if (!card) return;

        const progress = card.querySelector('[role="progressbar"]');
        modalSnapshot = {
          text: card.textContent ?? '',
          hasIndicator: Boolean(card.querySelector('.ride-progress-bar__indicator')),
          valueText: progress?.getAttribute('aria-valuetext') ?? null,
          valueNow: progress?.getAttribute('aria-valuenow') ?? null,
        };
        observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    cy.contains('a', 'Get Started').click();
    cy.then(() => {
      expect(modalSnapshot).to.exist;
      expect(modalSnapshot?.text).to.contain('RIDE');
      expect(modalSnapshot?.hasIndicator).to.equal(true);
      expect(modalSnapshot?.valueText).to.equal('Loading in progress');
      expect(modalSnapshot?.valueNow).to.equal(null);
    });
    cy.contains('h1', 'Create Your Account').should('be.visible');
  });

  it('opens Near Me from Explore and keeps the destination catalog visible', () => {
    cy.visit('/explore');
    cy.get('.exp-cat-btn').should('have.length.greaterThan', 5);
    cy.contains('button', 'Near Me').click();
    cy.location('pathname').should('eq', '/near-me');
    cy.contains('h1', 'Places around you').should('be.visible');
    cy.get('.near-place').should('have.length.greaterThan', 5);
  });

  it('shows curated food names without inventing unverified details', () => {
    cy.visit('/restaurants');
    cy.contains("Monkey's Resto Calapan (Roxas Dr.)").should('exist');
    cy.contains('does not confirm that a business is open').should('exist');
    cy.contains('No verified restaurant listings yet').should('not.exist');
  });

  it('shows a catch-all page for unknown routes', () => {
    cy.visit('/this-route-does-not-exist');
    cy.contains('h1', 'This trail ends here').should('be.visible');
    cy.contains('a', 'Go to Home').should('have.attr', 'href', '/home');
  });
});
