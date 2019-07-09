/*jslint browser: true*/
import $D from '../global';
import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import EntradaView from './entradaView';
import template from './libraryView.html';

const LibraryEntradaView = EntradaView.extend({});

export default Backbone.View.extend({
  id: 'contenidodinamico',
  template: _.template(template),
  initialize(options) {
    this.router = options.router;
    const self = this;
    _.bindAll(this, 'render');
    this.listenTo(this.collection, 'reset', this.render.bind(this));
    this.listenTo(this.collection, 'add', this.addOne.bind(this));
    this.listenTo(this.collection, 'add', this.extenderLineas.bind(this));
    this.listenTo(this.collection, 'add', this.detect_scroll.bind(this));
    this.listenTo(this.collection, 'ordenar', this.ordenar.bind(this));
    this.currentColumns = Math.floor($('#contenidodinamico').width() / ($D.ancho + $D.espaciado));

    $(window).resize(() => {
      self.detect_resize();
    });
    self.detect_resize();
    $D.Loading = false;
  },
  events: {
    // 'mouseenter .container': 'mostrarComentariosEv',
    // 'mouseleave .container': 'ocultarComentariosEv',
    'click .titular': 'muestraIndice',
    'click #mostrarmas': 'mostrarMas',
  },

  detect_resize() {
    $D.SQanchoTotal = this.calculaAncho();
    // if ($D.SQanchoTotal !== this.currentColumns){
    this.currentColumns = $D.SQanchoTotal;
    $(this.el).width(this.currentColumns * ($D.ancho + $D.espaciado));
    this.ordenar();
    // }
    this.extenderLineas();
  },
  extenderLineas() {
    const self = this,
      SQaltoTotal = Math.floor((window.innerHeight + $(document).scrollTop() - $D.espaciado) / ($D.alto + $D.espaciado));

    if ((this.maxLines !== 'undefined') && (this.maxLines <= SQaltoTotal)) {
      if ($D.Loading) {
        setTimeout(() => {
          self.extenderLineas();
        }, 100);
      } else {
        this.anadir();
      }
    }
    return this;
  },
  calculaAncho() {
    let SQanchoTotal = Math.floor(window.innerWidth / ($D.ancho + $D.espaciado));
    if ((SQanchoTotal === 0) && (this.currentColumns !== 'undefined')) {
      SQanchoTotal = this.currentColumns;
    }
    if (SQanchoTotal < 2) {
      SQanchoTotal = 2;
    } // minimo numero de columnas
    return SQanchoTotal;
  },
  ordenar() {
    let j;
    let i;
    let k = 0;
    const SQanchoTotal = this.calculaAncho();
    const matrix = $D.matrix;
    let posArr = [];

    for (j = 0; j < SQanchoTotal; j++) {
      matrix[j] = [];
    }

    function checkMatrix(j, k, ancho, alto) {
      let ix, iy;
      for (ix = 0; ix < ancho; ix++) {
        for (iy = 0; iy < alto; iy++) {
          if ((j + ix) >= SQanchoTotal) {
            return false;
          }
          if (matrix[j + ix][k + iy]) {
            return false;
          }
        }
      }
      return true;

    }

    function populateMatrix(modelo, ancho, alto) {
      let j, ix, iy;
      for (j = 0; j < SQanchoTotal; j++) {
        if (checkMatrix(j, k, ancho, alto)) {
          for (ix = 0; ix < ancho; ix++) {
            for (iy = 0; iy < alto; iy++) {
              matrix[j + ix][k + iy] = modelo;
            }
          }
          return [j, k];
        }
      }
      k++;
      return populateMatrix(modelo, ancho, alto);
    }

    function getMatrixPopulated(modelo, ancho, alto) {
      k = 0;
      return populateMatrix(modelo, ancho, alto);
    }

    for (i = 0; i < this.collection.length; i++) {
      if (this.collection.models[i].get('SQancho') > $D.SQanchoTotal) {
        this.collection.models[i].set({
          'SQancho': $D.SQanchoTotal,
          'SQalto': $D.SQanchoTotal,
        });
        this.collection.models[i].trigger('rearrange');
      }
      posArr = getMatrixPopulated(this.collection.models[i].get('id'), this.collection.models[i].get('SQancho'), this.collection.models[i].get('SQalto'));
      if ((this.collection.models[i].get('posX') !== posArr[0]) || (this.collection.models[i].get('posY') !== posArr[1])) {
        this.collection.models[i].set({
          'posX': posArr[0],
          'posY': posArr[1],
        });
        this.collection.models[i].trigger('rearrange');
      }
    }
    this.maxLines = matrix[0].length;
    $D.matrix = matrix;
  },

  render() {
    if (this.isRendering) {
      return this;
    }
    this.isRendering = true;
    this.ordenar();
    const collection = this.collection,
      self = this;
    this.el.innerHTML = this.template({
      'currentColumns': this.currentColumns,
      Dancho: $D.ancho,
      Despaciado: $D.espaciado,
    });

    collection.each(item => {
      self.renderOne(item, collection);
    });

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    return this;
  },
  afterRender() {
    if (this.collection.length) { // si no hace un fetch extra de la collection al principio que se carga el bicho.
      this.extenderLineas();
    }
    this.isRendering = false;
    $('.mdl-layout__content').scroll(this.detect_scroll.bind(this));

  },
  detect_scroll() {
    const e = document.getElementsByClassName('mdl-layout__content')[0];
    // console.log('scroll', e.scrollHeight - e.scrollTop, e.clientHeight);
    if (!$D.Loading && e.scrollHeight - e.scrollTop <= e.clientHeight + $D.alto) {
      this.anadir();
    }
    // if (!$D.Loading && (($(e.currentTarget).scrollTop() + window.innerHeight) > ($(document).height() - ($D.alto * 2)))) {
    //   this.anadir();
    // }
  },
  mostrarMas(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    this.anadir();
  },
  renderOne(model, col) {
    const view = new LibraryEntradaView({
      model,
      collection: col,
    });
    this.$el.append(view.render().el);

  },
  addOne(model, col) {
    this.ordenar();
    this.renderOne(model, col);
  },
  anadir() {
    if ($D.Loading) {
      return;
    }
    $D.Loading = true;
    this.collection.fetch({
      remove: false,
      beforeSend() {
        $D.Loading = true;
        $D.Uroboro.open();
      },
      complete() {
        $D.Loading = false;
        $D.Uroboro.close();
      },
      // success: function () {
      //    $D.Loading = false;
      //    if ($('#container').width() < 600) {
      //        $('#container').find('.destacado').removeClass('destacado');
      //    }
      // }
    }).always(() => {
      $D.Loading = false;
      if ($('#container').width() < 600) {
        $('#container').find('.destacado').removeClass('destacado');
      }
    });
    return this;
  },
  muestraIndice(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    const indice = $(ev.currentTarget).data('indice');

    if (indice) {
      this.router.navigate(`indices/${indice}`, {
        trigger: true,
      });
    } else {
      this.router.navigate('home', {
        trigger: true,
      });
    }

    //            this.collection.fetch();

  },
  saltar({ currentTarget }) {
    const enlace = $(currentTarget).data('enlace');
    if (enlace) {
      window.open(enlace, '_blank');
      //                window.location = enlace;
    } else {
      this.router.navigate(`indices/${$(currentTarget).data('indice')}/${$(currentTarget).data('entrada')}`, {
        trigger: true,
      });
    }
  },
  saltointerior(indice, entrada) {
    const enlace = `https://dreamers.es/${indice}/${entrada}/?ajax=1`,
      // alto = $('#container').height(),
      ancho = $('#contenido').width();
    $('#container').css({
      'overflow-y': 'scroll',
      'overflow-x': 'hidden',
    });
    $('#container').width('215px');
    $('#container').find('.destacado').removeClass('destacado');
    $('#resultado').show().width(ancho - 215 - 20).css({
      'float': 'right',
      'padding': '10px',
    });

    $.ajax({
      url: enlace,
      beforeSend() {
        $D.Uroboro.open();
      },
      complete() {
        $D.Uroboro.close();
      },
      success(data) {
        $('#resultado').html(data);
        setTimeout(() => {
          $('#container').height($('#resultado').height());
          $D.RepasoMola();
        }, 1000);
      },
    });
  },
  mostrarComentariosEv({ currentTarget }) {
    const $objeto = $(currentTarget),
      ancho = $objeto.width();
    if ($objeto.hasClass('lockedcomments')) {
      return;
    }
    $objeto.find('.comentarios').show().css({
      left: ancho,
    });
    $objeto.find('.comentarios').animate({
      left: '0px',
    }, 300);
  },
  ocultarComentariosEv({ currentTarget }) {
    const $objeto = $(currentTarget),
      ancho = $objeto.width();
    if ($objeto.hasClass('lockedcomments')) {
      return;
    }
    $objeto.find('.comentarios').animate({
      left: ancho,
    }, 300, () => {
      $objeto.find('.comentarios').hide();
    });
  },
});