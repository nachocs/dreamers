import Backbone from 'backbone';
import $D from '../app.js';
import _ from 'lodash';

export default Backbone.Collection.extend({
  initialize(models, options){
    this.indice = options.indice;
  },
  url() {
    let url = $D.path + 'cgi/json.cgi?' + 'indice=' + this.indice;
    if (this.firstEntry){
      url += '&empieza=' + this.firstEntry;
    }
    return url;
  },
  parse(resp) {
    if (resp.length > 0){
      this.firstEntry = Math.min.apply(null, _.map(resp, 'num'));
    }
    return resp;
  },
});
