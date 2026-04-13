export class EnvHelper {
  /**
   * Detecta se está rodando dentro do Docker/Nginx (produção)
   * ou localmente (localhost).
   */
  static isDockerEnvironment(): boolean {
    const host = window.location.hostname;
    // Quando roda via Nginx no container, o host será 'localhost' (proxy),
    // mas a aplicação Angular estará buildada em modo production.
    return host === 'localhost' && window.location.port === '4200';
  }
}