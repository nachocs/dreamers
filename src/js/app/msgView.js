import Backbone from 'backbone';
import _ from 'lodash';
import template from './msgView.html';
import UserModel from './userModel';
import Util from './util/util';

export default Backbone.View.extend({
  template: _.template(template),
  className: 'msg',
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  serializer(){
    const images = [];
    Object.keys(this.model.toJSON()).forEach((key)=> {
      if ((/IMAGEN(\d+)_URL/).exec(key)){ const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        images.push(Util.displayImage(this.model.toJSON(), image));
      }
    });
    return Object.assign({},
      this.model.toJSON(),
      {
        images,
        userModel: UserModel.toJSON(),
      }
    );
  },
});
