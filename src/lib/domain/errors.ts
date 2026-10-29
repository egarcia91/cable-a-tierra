// Error de regla de negocio: el mensaje se puede mostrar tal cual al usuario.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
