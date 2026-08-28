import Backbone from 'backbone';
import Model from './entradaModel';
import config from '../config';

import _ from 'lodash';

export default Backbone.Collection.extend({
  model: Model,
  initialize() {
    this.firstEntry = '';
    this.indice = '';
  },
  resetFirstEntry(){
    this.firstEntry = '';
  },
  url() {
    return config.path + 'cgi/json.cgi?' + 'indice=' + this.indice + '&empieza=' + this.firstEntry;
  },
  parse(resp) {
    if (resp.length > 0){
      this.firstEntry = Math.min.apply(null, _.map(resp, 'num'));
    }
    return resp;
  },
  fetch(options){
    if (options && options.indice !== undefined && this.indice !== options.indice){
      this.firstEntry = '';
    }
    if (options && options.indice !== undefined){
      this.indice = options.indice || '';
    }
    // 'empieza' coloca el cursor de golpe, para poder entrar directo a un
    // articulo concreto en vez de por lo ultimo publicado (ver la ruta
    // 'indices/:indice/:entrada' en router.js). Va DESPUES del bloque del
    // indice a proposito, porque ese lo deja en blanco al cambiar de indice.
    // A partir de aqui la paginacion sigue sola: parse() vuelve a mover
    // firstEntry con cada respuesta.
    if (options && options.empieza !== undefined){
      this.firstEntry = options.empieza;
    }
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },
});
