
export function formatarTelefoneUtil(value: string, tipoContato: string): string {
  if (!value) return '';

  if (tipoContato == "4" || tipoContato == "3") return value;
  
  let apenasNumeros = value.replace(/\D/g, '');

  // Os valores '1', '2', '5' correspondem a CELULAR, WHATSAPP, RECADO do seu TIPO_CONTATO
  const isCelularLike = tipoContato == "1" || // CELULAR
                        tipoContato == "2" || // WHATSAPP
                        tipoContato == "5";   // RECADO

  const maxLength = isCelularLike ? 11 : 10; // Fixo (tipo '0') terá maxLength 10

  if (apenasNumeros.length > maxLength) {
    apenasNumeros = apenasNumeros.substring(0, maxLength);
  }

  let formatado = '';
  const len = apenasNumeros.length;

  if (len === 0) return '';

  // Formata (XX)
  formatado = `(${apenasNumeros.substring(0, Math.min(2, len))}`;

  // Formata ) XXXXX ou ) XXXX
  if (len > 2) {
    // Se for celular-like E tiver o 9º dígito (total de 11 dígitos, parte central com 5)
    // Ou se for fixo (total de 10 dígitos, parte central com 4)
    const tamanhoParteCentral = isCelularLike ? Math.min(5, len - 2) : Math.min(4, len - 2);
    // O segundo parâmetro do substring é o índice final (exclusivo),
    // então precisa ser 2 + tamanhoParteCentral
    formatado += `) ${apenasNumeros.substring(2, 2 + tamanhoParteCentral)}`;
  }

  // Lógica de hífen
  // Para celular-like: após o 7º dígito total (2 do DDD + 5 da primeira parte)
  // Para fixo: após o 6º dígito total (2 do DDD + 4 da primeira parte)
  const indiceInicioHifen = isCelularLike ? 7 : 6;

  if (len > indiceInicioHifen) {
    formatado += `-${apenasNumeros.substring(indiceInicioHifen, Math.min(maxLength, len))}`;
  }

  return formatado; // Não precisa de .trim() se a lógica de substring for correta
}