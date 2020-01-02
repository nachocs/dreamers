import $ from 'jquery';
let UroboroCounter = 0;

class Global {
  constructor() {
    this.UroboroCounter = 0;
    this.Loading = true;
    this.ancho = 178*1.2;
    this.alto = 272*1.2;
    this.init = {
      ancho: this.ancho,
      alto: this.alto,
    };
    this.espaciado = 20;
    this.matrix = [];
    this.SQanchoTotal = 2;

    if ($(document).width() < ((this.ancho + 20) * 2)) {
      this.ancho = $(document).width() / 2 - this.espaciado * 2;
      this.alto = this.alto * (this.ancho / this.init.ancho);
    } else {
      this.ancho = this.init.ancho;
      this.alto = this.init.alto;
    }
  }
  get Uroboro() {
    return {
      open() {
        UroboroCounter++;
        $('.uroboro').show();
      },
      close() {
        UroboroCounter--;
        // console.log('UroboroCounter', UroboroCounter);
        if (UroboroCounter < 1) {
          $('.uroboro').hide();
        }
      },
    };
  }
}

export default new Global();
