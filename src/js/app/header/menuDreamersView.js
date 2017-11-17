import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import $D from '../global';
import template from './menuDreamersView.html';

export default Backbone.View.extend({
  id: 'menudreamers',
  class: 'menudreamers',
  template: _.template(template),
  initialize() {
    _.bindAll(this);
  },
  events: {
    'click .indiceslink': 'indicesLink',
    'mouseleave': 'hide',
  },
  hide() {
    $(`#${this.id}`).slideUp();
  },
  indicesLink(ev) {
    this.$('.indiceslink').removeClass('on');
    this.$(ev.currentTarget).addClass('on');
    $D.App.libraryView.muestraIndice(ev);
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
