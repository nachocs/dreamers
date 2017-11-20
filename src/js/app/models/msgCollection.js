import Backbone from 'backbone';
import config from '../config';
import _ from 'lodash';
import MsgModel from './msgModel';

export default Backbone.Collection.extend({
  model: MsgModel,
  initialize(models, options){
    this.indice = options.indice;
    this.listenTo(this, 'sync', () => {
      this.loading = false;
    });
    this.listenTo(this, 'error', () => {
      this.loading = false;
    });
    this.listenTo(this, 'request', () => {
      this.loading = true;
    });
  },
  url() {
    const url = config.path + 'cgi/json.cgi?' + 'indice=' + this.indice;
    return url;
  },
  nextPage() {
    if (!this.loading) {
      this.fetch({
        data: {
          empieza: this.firstEntry,
        },
        remove: false,
      });
    }
  },
  comparator: 'ID',
  parse(resp) {
    if (resp.length > 0){
      this.firstEntry = Math.min.apply(null, _.map(resp, 'ID'));
    }
    return resp;
  },
});
