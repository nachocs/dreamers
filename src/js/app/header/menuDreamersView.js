import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import template from './menuDreamersView.html';

export default Backbone.View.extend({
  id: 'menudreamers',
  className: 'menudreamers',
  template: _.template(template),
  initialize(options) {
    this.router = options.router;
  },
  events: {
    'click .mdl-navigation__link': 'indicesLink',
    // 'mouseleave': 'hide',
  },
  hide() {
    $(`#${this.id}`).slideUp();
  },
  indicesLink(ev) {
    // this.$('.indiceslink').removeClass('on');
    // this.$(ev.currentTarget).addClass('on');
    const layout = document.querySelector('.mdl-layout');
    layout.MaterialLayout.toggleDrawer();
    const indice = $(ev.currentTarget).data('indice');
    this.router.navigate('/indices/' + indice, {trigger: true});
  },
  render() {
    this.el.innerHTML = this.template();

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender.apply(this);
    }
    return this;
  },
  afterRender() {},
});
