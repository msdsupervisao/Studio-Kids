/**
 * Da um prazo maximo a uma Promise que pode nunca resolver nem rejeitar
 * sozinha (ex: fetch/XHR sem timeout nativo em conexao instavel). Nao
 * cancela a operacao original, so para de esperar por ela — util para
 * dar feedback claro ao usuario em vez de uma espera infinita e muda.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
