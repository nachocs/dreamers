import Backbone from 'backbone';
import config from '../config';

export default Backbone.Model.extend({
  initialize(){
  },
  url() {
    if (this.get('INDICE') && this.get('ID')) {
      return config.path + 'cgi/index.cgi?indice=' + this.get('INDICE') + '&ID=' + this.get('ID');
    }
  },
  idAttribute: 'ID',
  parse(resp){
    if (resp.INDICE){
      resp.indice = resp.INDICE;
    }
    // if (resp.INDICE && resp.ID){
    //   resp.wId = resp.INDICE + '/' + resp.ID;
    // }
    return resp;
  },
});
