import Backbone from 'backbone';
import config from '../config';

export default Backbone.Model.extend({
  url() {
    return config.path + 'cgi/post.cgi';
  },
  defaults: {},
  initialize() { },
});
