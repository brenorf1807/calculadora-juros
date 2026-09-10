import { ConsentService } from './consent.service';

describe('ConsentService', () => {
  beforeEach(() => {
    localStorage.removeItem('cookie-consent');
  });

  afterEach(() => {
    localStorage.removeItem('cookie-consent');
  });

  it('começa como "unset" quando não há escolha salva', () => {
    const service = new ConsentService();
    expect(service.consent()).toBe('unset');
  });

  it('grant() muda o estado para "granted" e persiste', () => {
    const service = new ConsentService();
    service.grant();
    expect(service.consent()).toBe('granted');
    expect(localStorage.getItem('cookie-consent')).toBe('granted');
  });

  it('deny() muda o estado para "denied" e persiste', () => {
    const service = new ConsentService();
    service.deny();
    expect(service.consent()).toBe('denied');
    expect(localStorage.getItem('cookie-consent')).toBe('denied');
  });

  it('uma nova instância lê a escolha previamente salva', () => {
    const first = new ConsentService();
    first.grant();

    const second = new ConsentService();
    expect(second.consent()).toBe('granted');
  });
});
