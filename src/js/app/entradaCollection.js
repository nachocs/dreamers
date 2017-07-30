import Backbone from 'backbone';
import Model from './entradaModel';
import $D from './app.js';

export default Backbone.Collection.extend({
  model: Model,
  /*		initialize: function(models, options) {
  if (options.indice){
  this.indice = options.indice;
}
}, */
  url() {
    return $D.path + 'cgi/json.cgi?' + 'indice=' + $D.indice + '&empieza=' + $D.empieza;
  },
});
