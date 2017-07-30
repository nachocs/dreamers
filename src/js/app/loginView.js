import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import menuLoginView from './menuLoginView';
import template from './loginView.html';

export default Backbone.View.extend({
  id: 'loginPlace',
  template: _.template(template),
  initialize({userModel}) {
    _.bindAll(this);
    this.menuLoginView = new menuLoginView();
    this.model = userModel;
    this.model.bind('change', this.render);
  },
  events: {
    'click #loginName': 'showMenu',
  },
  showMenu() {
    if (this.menuRendered){
      this.$('#menuLogin').slideToggle();
    } else {
      $(this.el).append(this.menuLoginView.render().el);
      this.$('#menuLogin').slideDown();
      this.menuRendered = true;
    }
  },
  render() {
    this.el.innerHTML = this.template(this.model.toJSON());
    //	$('#loginPlace').html(this.el);

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender.apply(this);
    }
    return this;
  },
  afterRender() {
  },
});
