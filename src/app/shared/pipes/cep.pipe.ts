import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'cep'
})

export class CepPipe implements PipeTransform {

  transform(value: string): string {

      if(value != null){
        var temp = value.split("");
        var tempMask = "";
        for (let i = 0; i < temp.length; i++) {
          if(i == 1){//ADD .
            tempMask += temp[i]+'.';
          } else if(i == 4){//ADD -
            tempMask += temp[i]+'-';
          } else{
            tempMask += temp[i];
          }

        }
        return tempMask;
      }

      return '';
  }
}


/*
@Pipe({
  name: 'cep' // Nome diferente
})

export class Cep implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const numericValue = value.replace(/\D/g, '');

    if (numericValue.length === 8) {
      // Formato XX.XXX-XXX
      return `${numericValue.substring(0, 2)}.${numericValue.substring(2, 5)}-${numericValue.substring(5, 8)}`;
    }
    return value; // Retorna o valor original se não se encaixar
  }
}
  */
