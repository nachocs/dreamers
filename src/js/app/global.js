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

    // Esto se calcula UNA sola vez, al importar el modulo, y ya no se
    // vuelve a recalcular nunca (detect_resize solo recuenta columnas,
    // no rehace this.ancho). Por eso el ancho medido tiene que ser
    // utilizable: si el navegador da 0 -- pestana oculta o preinterpretada,
    // que es cuando el documento aun no tiene caja -- la rama estrecha
    // dejaba this.ancho en -40 y this.alto en negativo PARA SIEMPRE, y el
    // mosaico se pintaba con medidas negativas hasta que alguien recargaba.
    // Con ancho 0 nos quedamos con las medidas por defecto: en cuanto
    // llega el primer resize de verdad, detect_resize recoloca bien.
    const anchoDocumento = $(document).width();

    if (anchoDocumento > 0 && anchoDocumento < ((this.ancho + 20) * 2)) {
      this.ancho = anchoDocumento / 2 - this.espaciado * 2;
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
