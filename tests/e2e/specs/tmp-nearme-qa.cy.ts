function scrollHomeTo(selector: string) {
  cy.get('ion-content').then(($el) => {
    const content = $el[0] as unknown as { getScrollElement: () => Promise<HTMLElement> };
    content.getScrollElement().then((scroller) => {
      cy.get(selector).then(($target) => {
        const rect = $target[0].getBoundingClientRect();
        scroller.scrollTop += rect.top - 120;
      });
    });
  });
  cy.wait(500);
}

describe('temporary near me QA', () => {
  beforeEach(() => {
    cy.viewport(390, 844);
    cy.visit('/near-me');
  });

  it('captures the horizontal destination strip and arrow paging', () => {
    cy.get('.near-place').should('have.length.greaterThan', 10);
    cy.get('.near-tile').first().should('exist').then(($tile) => {
      expect(Math.round($tile[0].getBoundingClientRect().width)).to.equal(144);
    });
    scrollHomeTo('.near-strip');
    cy.get('.near-strip').then(($strip) => {
      const el = $strip[0];
      throw new Error(JSON.stringify({
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        scrollLeft: el.scrollLeft,
        rectWidth: el.getBoundingClientRect().width,
        childCount: el.children.length,
        clientHeight: el.clientHeight,
      }));
    });
    cy.get('.near-nav-prev').should('be.disabled');
    cy.get('.near-nav-next').should('be.enabled');
    cy.screenshot('near-me-strip');
    cy.get('.near-nav-next').click();
    cy.wait(900);
    cy.get('.loading-progress-card').should('not.exist');
    cy.get('.near-nav-prev').should('be.enabled');
    cy.get('.near-strip').then(($strip) => {
      expect($strip[0].scrollLeft).to.be.greaterThan(0);
    });
    cy.screenshot('near-me-strip-paged');
  });
});
