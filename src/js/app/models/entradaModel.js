import Backbone from 'backbone';
import $D from '../global';
import config from '../config';

export default Backbone.Model.extend({
  // url() {
  //   return `${config.path}cgi/json.cgi?indice=${this.attributes.indice}&entrada=${this.attributes.entrada}`;
  // },
  url() {
    if (this.get('INDICE') && this.get('ID')) {
      return config.path + 'cgi/index.cgi?indice=' + this.get('INDICE') + '&ID=' + this.get('ID');
    }
  },
  defaults: {
    'subject': '',
    'encabezamiento': '',
    'nombreindice': '',
    'titulo_original': '',
    'nacionalidad': '',
    'ano': '',
    'genero': '',
    'formato': '',
    'duracion': '',
    'director': '',
    'guion': '',
    'fotografia': '',
    'musica': '',
    'produccion': '',
    'distribuidora': '',
    'reparto': '',
    'sinopsis': '',
    'comments': '',
    'trucos': '',
  },
  initialize() {
    this.set('SQancho', 1);
    this.set('SQalto', 1);
    if (this.get('destacado')) {
      this.set('SQancho', 2);
      this.set('SQalto', 2);
    }
    this.listenTo(this, 'change', this.bindings.bind(this));
  },
  bindings() {
    this.set({
      'top': this.get('posY') * ($D.alto + $D.espaciado),
      'left': this.get('posX') * ($D.ancho + $D.espaciado),
      'ancho': this.get('SQancho') * $D.ancho + ((this.get('SQancho') - 1) * $D.espaciado),
      'alto': this.get('SQalto') * $D.alto + ((this.get('SQalto') - 1) * $D.espaciado),
    });
  },
});
