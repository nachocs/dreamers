/*jslint browser: true*/
import $D from './app';
import Backbone from 'backbone';
import $ from 'jquery';
import _ from 'lodash';
import template from './entradaView.html';
import basicoTemplate from './basicoTemplate.html';
export default Backbone.View.extend({
  initialize() {
    //  this.loadPage();
    _.bindAll(this);
    this.listenTo(this.model, 'rearrange', this.rearrange.bind(this));
    //          this.model.bind('rearrange', this.rearrange);
    this.listenTo(this.model, 'change', this.render.bind(this));
    this.listenTo(this, 'quietoparao', this.ajustarAlto.bind(this));

  },
  template: _.template(template),
  events: {
    'click': 'onClick',
  },
  onClick(){
    if (!this.model.get('expandido')) {
      return this.expandir();
    }
  },
  className() {
    let className = 'container';
    if (this.model.get('destacado')) {
      // className = className + ' destacado';
    }
    className = `${className} ${this.model.get('nombreindice')}`;
    if (!this.model.get('expandido')) {
      className = `${className} expandido`;
    }
    return className;
  },
  attributes() {
    const obj = {};
    if (this.model.get('indice').match('productos') || this.model.get('indice').match('weblogs')) {
      _.extend(obj, {
        'data-enlace': this.model.get('enlace'),
      });
    }
    _.extend(obj, {
      'style': `top:${this.model.get('top')}px; left:${this.model.get('left')}px; width:${this.model.get('ancho')}px; height:${this.model.get('alto')}px;`,
      'data-entrada': this.model.get('entrada'),
      'data-indice': this.model.get('indice').replace(/\//ig, '::'),
      'data-link': `http://dreamers.com/${this.model.get('indice')}/${this.model.get('entrada')}/?ajax=1`,
    });
    return obj;
  },
  showExpand() {
    this.$('.expand').show();
  },
  hideExpand() {
    this.$('.expand').hide();
  },
  ajustarAlto() {
    let innerHeight = this.$el.children('.content').first().height();
    const totalHeight = this.$el.height();
    let nuevoAlto;
    this.$el.children('div.basico-container').first().children('div').each(function () {
      innerHeight += $(this).height();
    });
    nuevoAlto = Math.ceil((innerHeight / totalHeight) * 3);
    if (nuevoAlto > 6) {
      nuevoAlto = 6;
    }
    if (this.model.get('SQalto') !== nuevoAlto) {
      this.model.set({
        'SQalto': nuevoAlto,
      });
      this.collection.trigger('ordenar');
      this.rearrange(true);
    }

    // if (innerHeight < (1 / 3) * totalHeight) {
    //  self.model.set({
    //      'SQalto': 1
    //  });
    //  self.collection.trigger('ordenar');
    //  self.rearrange();
    // } else if (innerHeight < (2 / 3) * totalHeight) {
    //  self.model.set({
    //  'SQalto': 2
    //  });
    //  self.collection.trigger('ordenar');
    //  self.rearrange();
    // }
  },
  expandir() {
    const self = this;
    this.model.set('expandido', true);
    this.template = _.template(basicoTemplate);
    this.loadPage().always(() => {
      if (self.model.get('SQancho') < $D.SQanchoTotal) {
        self.model.set({
          'SQancho': 3, //this.model.get('SQancho') + 1,
          'SQalto': 3, //this.model.get('SQalto') + 1
        });
        self.collection.trigger('ordenar');
        self.rearrange();
      }
    });
    //          this.render();
    window.setTimeout(() => {
      $('body').animate({
        // scrollTop: self.$el.position().top
        scrollTop: self.model.get('top'),
      }, 'slow', () => {});
    }, 400);
    // window.setTimeout(function () {
    //     self.ajustarAlto();
    // }, 500);
  },
  rearrange(stop) {
    const self = this;
    if (!this.rendered) {
      this.render();
    } else {
      this.$el.animate({
        top: this.model.get('top'),
        left: this.model.get('left'),
        width: this.model.get('ancho'),
        height: this.model.get('alto'),
      }, 400, () => {
        if (!stop) {
          self.trigger('quietoparao');
        }
        // animation complete
      });
    }
  },
  render() {
    this.el.innerHTML = this.template(this.model.toJSON());

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    this.rendered = true;
    return this;
  },
  loadPage() {
    return this.model.fetch();
  },
  afterRender() {
    const self = this;
    this.$(() => {
      self.$el.slideDown(1000);
    });
  },
});
