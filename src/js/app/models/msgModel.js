import Backbone from 'backbone';
import $D from '../app';


export default Backbone.Model.extend({
  initialize(){
  },
  url() {
    return `${$D.path}cgi/json.cgi?indice=${this.attributes.indice}&entrada=${this.attributes.entrada}`;
  },
  parse(resp){
    if (resp.INDICE){
      resp.indice = resp.INDICE;
    }
    if (resp.INDICE && resp.ID){
      resp.wId = resp.INDICE + '/' + resp.ID;
    }
    return resp;
  },
});
