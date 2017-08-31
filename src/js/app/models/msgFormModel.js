import Backbone from 'backbone';
import config from '../config';

export default  Backbone.Model.extend({
  url: config.path + 'cgi/post.cgi',
  defaults: {
    comments: '',
  },
  initialize(){
  },
  save(){
    return Backbone.Model.prototype.save.apply(this, arguments);
  },
});
