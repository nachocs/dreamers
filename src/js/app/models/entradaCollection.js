import Backbone from 'backbone';
import Model from './entradaModel';
import $D from '../app.js';
import _ from 'lodash';

export default Backbone.Collection.extend({
  model: Model,
  initialize() {
    this.firstEntry = '';
    this.indice = '';
  },
  url() {
    return $D.path + 'cgi/json.cgi?' + 'indice=' + this.indice + '&empieza=' + this.firstEntry;
  },
  parse(resp) {
    if (resp.length > 0){
      this.firstEntry = Math.min.apply(null, _.map(resp, 'num'));
    }
    return resp;
  },
  fetch(options){
    if (options.indice !== undefined && this.indice !== options.indice){
      this.firstEntry = '';
    }
    if (options.indice !== undefined){
      this.indice = options.indice || '';
    }
    return Backbone.Collection.prototype.fetch.apply(this, arguments);
  },
});
