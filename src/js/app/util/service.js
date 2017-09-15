import config from '../config';
import $ from 'jquery';

class Service {
  getIndice(indice) {
    const url = config.path + 'cgi/json.cgi?indice=' + indice + '&encontrar=ID';
    return $.get(url);
  }
}
export default new Service();
