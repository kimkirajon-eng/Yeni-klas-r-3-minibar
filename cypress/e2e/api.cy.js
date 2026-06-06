describe('API Tests', () => {
  const API = 'http://localhost:3001/api';
  let token;

  it('health check returns OK', () => {
    cy.request(`${API}/health`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.status).to.eq('OK');
    });
  });

  it('login with valid credentials', () => {
    cy.request('POST', `${API}/auth/login`, {
      username: 'admin',
      password: 'admin123',
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('token');
      expect(res.body.user.role).to.eq('ADMIN');
      token = res.body.token;
    });
  });

  it('rejects invalid credentials', () => {
    cy.request({
      method: 'POST',
      url: `${API}/auth/login`,
      body: { username: 'admin', password: 'wrong' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('returns rooms list', () => {
    cy.request('POST', `${API}/auth/login`, {
      username: 'admin', password: 'admin123',
    }).then((loginRes) => {
      cy.request({
        url: `${API}/rooms`,
        headers: { Authorization: `Bearer ${loginRes.body.token}` },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
      });
    });
  });

  it('returns products with stock', () => {
    cy.request('POST', `${API}/auth/login`, {
      username: 'admin', password: 'admin123',
    }).then((loginRes) => {
      cy.request({
        url: `${API}/products`,
        headers: { Authorization: `Bearer ${loginRes.body.token}` },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body[0]).to.have.property('stock');
        expect(res.body[0]).to.have.property('minStockLevel');
      });
    });
  });

  it('returns stock summary', () => {
    cy.request('POST', `${API}/auth/login`, {
      username: 'admin', password: 'admin123',
    }).then((loginRes) => {
      cy.request({
        url: `${API}/products/stock-summary`,
        headers: { Authorization: `Bearer ${loginRes.body.token}` },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('lowStockProducts');
      });
    });
  });

  it('creates and deletes a shift', () => {
    cy.request('POST', `${API}/auth/login`, {
      username: 'admin', password: 'admin123',
    }).then((loginRes) => {
      const token = loginRes.body.token;
      cy.request({
        method: 'GET',
        url: `${API}/users`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((usersRes) => {
        const personnel = usersRes.body.find((u) => u.role === 'PERSONNEL');
        if (personnel) {
          cy.request({
            method: 'POST',
            url: `${API}/shifts`,
            headers: { Authorization: `Bearer ${token}` },
            body: {
              userId: personnel.id,
              date: '2026-06-01',
              startTime: '09:00',
              endTime: '17:00',
            },
          }).then((createRes) => {
            expect(createRes.status).to.eq(201);
            cy.request({
              method: 'DELETE',
              url: `${API}/shifts/${createRes.body.id}`,
              headers: { Authorization: `Bearer ${token}` },
            }).then((delRes) => {
              expect(delRes.status).to.eq(204);
            });
          });
        }
      });
    });
  });
});
