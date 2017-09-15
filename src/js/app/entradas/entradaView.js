/*jslint browser: true*/
import $D from '../app';
import Backbone from 'backbone';
import $ from 'jquery';
import _ from 'lodash';
import template from './entradaView.html';
import basicoTemplate from './basicoTemplate.html';
// import moment from 'moment';
import MsgCollectionView from '../msgs/msgCollectionView';
import MsgCollection from '../models/msgCollection';
import userModel from '../models/userModel';
import MsgFormView from '../msgs/msgFormView';
import PreviousMsgView from './previousMsgView';

export default Backbone.View.extend({
  initialize() {
    _.bindAll(this);
    this.listenTo(this.model, 'rearrange', this.rearrange.bind(this));
    this.listenTo(this.model, 'change', this.render.bind(this));
    this.listenTo(this, 'quietoparao', this.ajustarAlto.bind(this));
    this.msgCollectionLoaded = false;
    this.msgCollection = new MsgCollection([],
      {
        indice: this.model.get('INDICE') + '/' + this.model.get('entrada'),
      }
    );
    this.msgCollectionView = new MsgCollectionView({
      collection: this.msgCollection,
      parentModel: this.model,
    });
    this.previousMsgView = new PreviousMsgView({collection:this.msgCollection});

    this.listenTo(userModel, 'change', this.renderIfExpanded.bind(this));
  },
  template: _.template(template),
  events: {
    'click .expandir': 'onExpandir',
    'click .contraer': 'contraer',
    'click .expandirmas': 'expandeMas',
  },
  onExpandir(){
    if (!this.model.get('expandido')) {
      this.expandidoMas = false;
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
  mostrarComentarios() {
    const $objeto = this.$el;
    $objeto.find('.comentarios').show().css({
      left: '0px',
    });
    // $objeto.find('.comentarios').animate({
    //   left: '0px',
    // }, 300);
  },
  ajustarAlto() {
    if (this.ajustado){return;}
    if (!this.model.get('expandido')){return;}
    let innerHeight = this.$el.children('.content').first().height();
    // const totalHeight = this.$el.height();
    let nuevoAlto;
    this.$('div.basico-container').children('div').each(function() {
      innerHeight += $(this).outerHeight();
    });
    // innerHeight += this.$('div.basico-container').outerHeight();

    nuevoAlto = Math.ceil(((innerHeight)/$D.alto) + (this.expandidoMas ? 0 : 0));
    // nuevoAlto = Math.ceil((innerHeight / totalHeight) * 3);
    if (nuevoAlto > 3 && !this.expandidoMas) {
      nuevoAlto = 3;
    }
    if (this.model.get('SQalto') !== nuevoAlto) {
      this.model.set({
        'SQalto': nuevoAlto,
      });
      this.collection.trigger('ordenar');
      this.rearrange(true);
      this.ajustado = true;
    }
  },
  scrollMe(){
    const self = this;
    window.setTimeout(() => {
      $('body').animate({
        // scrollTop: self.$el.position().top
        scrollTop: self.model.get('top'),
      }, 'slow', () => {});
    }, 500);
  },
  expandir() {
    const self = this;
    this.model.set({'expandido': true, loading: true});
    this.mostrarComentarios();
    this.template = _.template(basicoTemplate);
    if (!this.basicLoaded){
      this.fetch().always(() => {
        this.basicLoaded = true;
        self.expande();
      });
    } else {
      this.expande();
    }
  },
  expande(size){
    if (!size) {size = 3;}
    if (this.model.get('SQancho') <= $D.SQanchoTotal) {
      this.model.set({
        'SQancho': size,
        'SQalto': 3,
        loading: false,
      });
      this.rearrange();
      this.collection.trigger('ordenar');
      // this.ajustarAlto();

      this.scrollMe();
    }
    // this.$el.find('.msg-collection-view').first().replaceWith(this.msgCollectionView.render().el);
    if (!this.msgCollectionLoaded) {
      this.msgCollection.fetch().then(() => {
        this.msgCollectionLoaded = true;
      });
    }
    this.delegateEvents();
  },
  expandeMas(){
    this.expandidoMas = true;
    this.ajustado = false;
    this.expande($D.SQanchoTotal);
  },
  contraer(){
    this.ajustado = false;
    this.template = _.template(template);
    this.model.set({
      expandido: false,
      SQancho: 1, //this.model.get('SQancho') + 1,
      SQalto: 1, //this.model.get('SQalto') + 1
    });
    this.collection.trigger('ordenar');
    this.rearrange(true);
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
    // console.log('render' + this.cid);
    this.el.innerHTML = this.template(this.serializer(this.model.toJSON()));
    if (this.model.get('expandido')){
      this.$('.msg-collection-view').replaceWith(this.msgCollectionView.render().el);
      this.$('.previous-msgs-view').html(this.previousMsgView.render().el);

      if (userModel.get('ID')){
        this.msgFormView = new MsgFormView({
          parentModel: this.model,
          collection: this.msgCollection,
        });
        this.$('.msg-form-view').replaceWith(this.msgFormView.render().el);
      }
    }
    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    this.rendered = true;
    return this;
  },
  renderIfExpanded(){
    if (this.model.get('expandido')){
      const scrollNow = this.$('.basico-container').scrollTop();
      this.render();
      this.$('.basico-container').scrollTop(scrollNow);
    }
  },
  fetch() {
    return this.model.fetch();
  },
  afterRender() {
    const self = this;
    this.$(() => {
      self.$el.slideDown(1000);
    });
  },
  serializer(){
    const model = this.model.toJSON();
    // model.date = moment.unix(this.model.get('FECHA')).fromNow();
    return model;
  },
});