/*jslint browser: true*/
import $D from '../global';
import Backbone from 'backbone';
import $ from 'jquery';
import _ from 'lodash';
import template from './entradaView.html';
import basicoTemplate from './basicoTemplate.html';
import MsgCollectionView from '../msgs/msgCollectionView';
import MsgCollection from '../models/msgCollection';
import userModel from '../models/userModel';
import MsgFormView from '../msgs/msgFormView';
import PreviousMsgView from './previousMsgView';
import ModalView from '../msgs/modalView';
import { resumen } from '../util/resumen.mjs';
import { agruparParrafos, quitarPortadaRepetida } from '../util/parrafos.mjs';

// Tiene que coincidir con la transicion de '.container' en css/main.less.
// Es la unica constante duplicada entre el CSS y el JS, y esta aqui a mano y no
// leida con getComputedStyle a proposito: leerla obligaria a un recalculo de
// estilo por viñeta y por reordenacion, justo el coste que esta seccion quita.
const DURACION_REORDENADO = 500;

export default Backbone.View.extend({
  initialize() {
    _.bindAll(this);
    this.listenTo(this.model, 'rearrange', this.rearrange.bind(this));
    this.listenTo(this.model, 'change', this.render.bind(this));
    this.listenTo(this, 'quietoparao', this.ajustarAlto.bind(this));
    this.listenTo(this.model, 'destroy', this.remove.bind(this));
    const self = this;
    this.listenTo(this.model, 'destroy', _.bind(function () {
      setTimeout(function (){
        self.collection.trigger('ordenar');
      });
    }, this));
    this.msgCollectionLoaded = false;
    this.msgCollection = new MsgCollection([], {
      indice: this.model.get('INDICE') + '/' + this.model.get('entrada'),
    });
    this.msgCollectionView = new MsgCollectionView({
      collection: this.msgCollection,
      parentModel: this.model,
    });
    this.previousMsgView = new PreviousMsgView({
      collection: this.msgCollection,
    });

    this.listenTo(userModel, 'change', this.renderIfExpanded.bind(this));
    // La condicion de antes preguntaba por undefined/null, pero entradaModel
    // declara `encabezamiento: ''` en sus defaults, asi que Backbone SIEMPRE
    // devuelve una cadena y la rama del resumen no llegaba a ejecutarse nunca.
    // El registro sin encabezamiento acababa con cabeza vacia, y la plantilla
    // (`obj.cabeza || obj.comments`) pintaba el articulo entero en crudo.
    const encabezamiento = this.model.get('encabezamiento');
    if (encabezamiento) {
      this.model.set('cabeza', encabezamiento);
    } else if (this.model.get('comments')) {
      this.model.set('cabeza', resumen(this.model.get('comments')));
    }
  },
  template: _.template(template),
  events: {
    'click .expandir': 'onExpandir',
    'click .contraer': 'contraer',
    'click .expandirmas': 'expandeMas',
    'click .borrargordo': 'showDeleteModal',
  },
  onExpandir() {
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
    if (this.model.get('expandido')) {
      className = `${className} expandido`;
    }
    if (!this.model.get('IMAGEN1_URL')) {
      className = `${className} lockedcomments`;
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
      // --tx/--ty en vez de left/top: los consume el 'transform' de .container
      // en main.less. Backbone solo aplica attributes() al crear el elemento,
      // asi que a partir de aqui quien las mueve es rearrange().
      'style': `--tx:${this.model.get('left')}px; --ty:${this.model.get('top')}px; width:${this.model.get('ancho')}px; height:${this.model.get('alto')}px;`,
      'data-entrada': this.model.get('entrada'),
      'data-indice': this.model.get('indice').replace(/\//ig, '::'),
      'data-link': `https://dreamers.es/${this.model.get('indice')}/${this.model.get('entrada')}`,
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
    setTimeout(() => {

      if (this.ajustado) {
        return;
      }
      if (!this.model.get('expandido')) {
        return;
      }
      let innerHeight = 100;
      const headerHeight = this.$('.container-inner').children('.content').first().height();
      if (!_.isNaN(headerHeight) && headerHeight > 0) {
        innerHeight += headerHeight;
      }
      // const totalHeight = this.$el.height();
      let nuevoAlto;
      this.$('.container-inner div.basico-container').children('div').each(function () {
        innerHeight += $(this).outerHeight();
      });
      // innerHeight += this.$('div.basico-container').outerHeight();

      nuevoAlto = Math.ceil(((innerHeight) / $D.alto) + (this.expandidoMas ? 0 : 0));
      // nuevoAlto = Math.ceil((innerHeight / totalHeight) * 3);
      if (nuevoAlto > 3 && !this.expandidoMas) {
        nuevoAlto = 3;
      } else if (nuevoAlto > 11) {
        nuevoAlto = 10;
      }
      if (this.model.get('SQalto') !== nuevoAlto) {
        this.model.set({
          'SQalto': nuevoAlto,
        });
        this.collection.trigger('ordenar');
        this.rearrange();
        this.ajustado = true;
      }
    }, 1000);
  },
  scrollMe() {
    const self = this;
    window.setTimeout(() => {
      $('.mdl-layout__content').animate({
        // scrollTop: self.$el.position().top
        scrollTop: self.model.get('top'),
      }, 'slow', () => { });
    }, 500);
  },
  expandir() {
    const self = this;
    this.model.set({
      'expandido': true,
      loading: true,
    });
    this.mostrarComentarios();
    this.template = _.template(basicoTemplate);
    if (!this.basicLoaded) {
      this.fetch().always(() => {
        this.basicLoaded = true;
        self.expande();
      });
    } else {
      this.expande();
    }
  },
  expande(size) {
    if (!size) {
      size = 3;
    }
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
  expandeMas() {
    this.expandidoMas = true;
    this.ajustado = false;
    this.expande($D.SQanchoTotal);
  },
  contraer() {
    this.ajustado = false;
    this.template = _.template(template);
    this.model.set({
      expandido: false,
      SQancho: 1, //this.model.get('SQancho') + 1,
      SQalto: 1, //this.model.get('SQalto') + 1
    });
    this.collection.trigger('ordenar');
    this.rearrange();
  },
  // Coloca la viñeta donde diga el modelo. Solo escribe el destino: de
  // interpolar se encarga la transicion CSS de '.container'.
  //
  // El parametro 'stop' que llevaba antes ("esta vez no avises al terminar")
  // ya no hace falta. Sus dos llamadas, rearrange(true), estaban guardadas por
  // otro lado: contraer() pone expandido:false y ajustarAlto() pone
  // this.ajustado = true justo despues, y ajustarAlto() se corta con las dos
  // cosas nada mas entrar. O sea que 'quietoparao' ya no hacia nada en ninguno
  // de los dos casos.
  rearrange() {
    if (!this.rendered) {
      this.render();
      return;
    }
    const estilo = this.el.style;
    estilo.setProperty('--tx', `${this.model.get('left')}px`);
    estilo.setProperty('--ty', `${this.model.get('top')}px`);
    estilo.width = `${this.model.get('ancho')}px`;
    estilo.height = `${this.model.get('alto')}px`;

    // 'quietoparao' dispara ajustarAlto(), que MIDE alturas del contenido. Hay
    // que avisar cuando la viñeta ya esta quieta: midiendo a mitad de la
    // transicion el ancho aun no es el final y las alturas salen mal.
    //
    // Va con reloj y no con 'transitionend' aposta. transitionend NO se emite
    // cuando el valor no llega a cambiar -- reordenar sin mover esta viñeta es
    // el caso normal, no el raro --, y ahi el aviso se perderia para siempre.
    // jQuery.animate() llamaba a su callback pasara lo que pasara, y eso es lo
    // que se conserva. El clearTimeout hace que varias reordenaciones seguidas
    // avisen una sola vez, al pararse; antes se encolaban en la cola de efectos
    // de jQuery y avisaban una por una.
    clearTimeout(this.relojReordenado);
    this.relojReordenado = setTimeout(() => {
      this.trigger('quietoparao');
    }, DURACION_REORDENADO);
  },
  // El reloj de rearrange() mantiene viva la vista si esta se va justo despues
  // de una reordenacion. jQuery.animate() no daba este problema porque .remove()
  // vaciaba tambien la cola de efectos del elemento.
  remove() {
    clearTimeout(this.relojReordenado);
    return Backbone.View.prototype.remove.call(this);
  },
  render() {
    // console.log('render' + this.cid);
    this.el.innerHTML = this.template(this.serializer());
    if (this.model.get('expandido')) {
      this.$el.addClass('expandido');
      if (this.expandidoMas) {
        this.$el.addClass('expandidomas');
      } else {
        this.$el.removeClass('expandidomas');
      }
      this.$('.msg-collection-view').replaceWith(this.msgCollectionView.render().el);
      this.$('.previous-msgs-view').html(this.previousMsgView.render().el);

      if (userModel.get('ID')) {
        this.msgFormView = new MsgFormView({
          parentModel: this.model,
          collection: this.msgCollection,
        });
        this.$('.msg-form-view').replaceWith(this.msgFormView.render().el);
      }
    } else {
      this.$el.removeClass('expandido');
    }
    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    this.rendered = true;
    return this;
  },
  renderIfExpanded() {
    if (this.model.get('expandido')) {
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
      if (!this.model.get('IMAGEN1_URL')) {
        this.mostrarComentarios();
      }
    });
    // El cuerpo llega del motor Perl como una sopa plana de <br><br> sin un
    // solo <p>. Se agrupa aqui para poder limitar el ancho del texto sin
    // encoger las fotos, y para distinguir los titulillos de las negritas
    // sueltas. Ver util/parrafos.mjs.
    if (this.model.get('expandido')) {
      const cuerpo = this.el.querySelector('.comments');
      if (cuerpo) {
        agruparParrafos(cuerpo);
        // Los blogs traen la portada tambien dentro del texto, asi que al
        // desplegar se veia dos veces. Se quita la del cuerpo y, si iba
        // enlazada a la version grande, ese enlace se pasa a la de arriba.
        const portada = this.el.querySelector('.main-image img');
        if (portada) {
          const href = quitarPortadaRepetida(cuerpo, portada.getAttribute('src'));
          if (href && !portada.closest('a')) {
            const a = document.createElement('a');
            a.href = href;
            a.target = '_blank';
            a.rel = 'noopener';
            portada.parentNode.insertBefore(a, portada);
            a.appendChild(portada);
          }
        }
      }
    }
  },
  serializer() {
    const model = this.model.toJSON();
    const usermodelId = userModel.get('ID');
    return Object.assign(model, {
      userModel: {
        ID: usermodelId,
      },
    });
  },
  showDeleteModal() {
    ModalView.update({
      model:
      {
        show: true,
        header: '&iquest;BORRAR ENTRADA?',
        body: '&iquest;Seguro que quieres borrar esta entrada?',
      },
      action: this.deleteThis.bind(this),
    },
    );
  },
  deleteThis() {
    console.log('delete run');
    this.model.destroy();
  },

});