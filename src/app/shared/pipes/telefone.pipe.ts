import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'telefone'
})

export class TelefonePipe implements PipeTransform {

  transform(value: any, type: number | string): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numero = String(value).replace(/\D/g, '');

    // tipo 3 = email, não aplica máscara
    if (Number(type) === 3) {
      return String(value);
    }

    // fixo = tipo 0 -> (34) 3315-9656
    if (Number(type) === 0) {
      const fixo = numero.padStart(10, '0').substring(0, 10);
      const ddd = fixo.substring(0, 2);
      const parte1 = fixo.substring(2, 6);
      const parte2 = fixo.substring(6, 10);

      return `(${ddd}) ${parte1}-${parte2}`;
    }

    // móvel = tipos 1, 2, 5 -> (34) 99942-0919
    if ([1, 2, 5].includes(Number(type))) {
      const movel = numero.padStart(11, '0').substring(0, 11);
      const ddd = movel.substring(0, 2);
      const parte1 = movel.substring(2, 7);
      const parte2 = movel.substring(7, 11);

      return `(${ddd}) ${parte1}-${parte2}`;
    }

    return String(value);
  }
}