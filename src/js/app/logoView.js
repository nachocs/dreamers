import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import menuDreamers from './menuDreamersView';
import template from './logoView.html';

export default Backbone.View.extend({
  id: 'headlogo',
  className: 'headlogo',
  template: _.template(template),
  initialize() {
    _.bindAll(this);
    this.menuDreamers = new menuDreamers();
  },
  events: {
    'click #logodreamers': 'showMenu',
  },
  showMenu() {
    if (this.menuRendered){
      this.$('#menudreamers').slideToggle();
    } else {
      $(this.el).append(this.menuDreamers.render().el);
      this.$('#menudreamers').slideDown();
      this.menuRendered = true;
    }
  },
  render() {
    this.el.innerHTML = this.template();

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender.apply(this);
    }
    return this;
  },
  afterRender() {
  },
});
