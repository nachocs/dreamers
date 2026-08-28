/*jslint browser: true*/
import $D from '../global';
import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import EntradaView from './entradaView';
import { pack } from './pack.mjs';
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
    // La comparacion va negada a proposito: 'SQanchoTotal < 2' NO atrapa
    // NaN (toda comparacion con NaN es falsa) y '!(SQanchoTotal >= 2)' si.
    // Sin esto la portada se quedaba EN BLANCO cuando window.innerWidth
    // valia 0 al arrancar -- pestana oculta o preinterpretada por el
    // navegador --: $D.ancho salia negativo, esta funcion devolvia el NaN
    // heredado de this.currentColumns (que a su vez viene de un .width()
    // sobre un elemento que aun no esta en el DOM), el bucle de columnas
    // de ordenar() no llegaba a ejecutarse ni una vez y matrix[0] quedaba
    // sin definir, con lo que 'matrix[0].length' reventaba y con el la
    // aplicacion entera.
    if (!(SQanchoTotal >= 2)) {
      SQanchoTotal = 2;
    } // minimo numero de columnas
    return SQanchoTotal;
  },
  ordenar() {
    // El empaquetado vive en pack.mjs, probado en test/. Aqui queda solo lo
    // que necesita Backbone: leer los modelos, aplicar el resultado y avisar.
    //
    // El original intercalaba los trigger('rearrange') con la colocacion, uno
    // por entrada. Aqui se empaqueta todo primero y luego se avisa, que da la
    // misma secuencia de eventos porque el handler de 'rearrange' (entradaView)
    // solo anima o renderiza SU propio elemento: no toca el SQancho/SQalto de
    // ningun otro modelo, o sea que no puede influir en donde caen las
    // siguientes entradas. El unico sitio que si los cambia es ajustarAlto(),
    // y va dentro de un setTimeout, asi que nunca corre a mitad de este bucle.
    const modelos = this.collection.models;
    const resultado = pack(
      modelos.map(modelo => ({
        id: modelo.get('id'),
        SQancho: modelo.get('SQancho'),
        SQalto: modelo.get('SQalto'),
      })),
      this.calculaAncho(),
      // El recorte va contra el global, no contra la medida de arriba. Son lo
      // mismo cuando ordenar() llega por detect_resize, pero NO cuando llega
      // por el evento 'ordenar' de la coleccion. Se conserva la diferencia.
      $D.SQanchoTotal,
    );

    for (let i = 0; i < resultado.posiciones.length; i++) {
      const posicion = resultado.posiciones[i];
      const modelo = modelos[i];

      if (posicion.recortado) {
        modelo.set({
          'SQancho': posicion.SQancho,
          'SQalto': posicion.SQalto,
        });
        modelo.trigger('rearrange');
      }

      if ((modelo.get('posX') !== posicion.posX) || (modelo.get('posY') !== posicion.posY)) {
        modelo.set({
          'posX': posicion.posX,
          'posY': posicion.posY,
        });
        modelo.trigger('rearrange');
      }
    }

    this.maxLines = resultado.filas;
    $D.matrix = resultado.matrix;
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
    this.abrirSiTocaba(model, col, view);
  },
  // Enlace permanente a un articulo: la ruta 'indices/:indice/:entrada' deja
  // dicho en la coleccion cual hay que abrir, y se abre aqui, en cuanto se
  // pinta, sin que haya que pinchar. Es lo que hace que una notificacion
  // pueda llevarte al articulo exacto.
  //
  // Se compara indice Y entrada porque el numero de entrada se repite entre
  // indices. Y la marca se borra en cuanto se usa: si no, al paginar hacia
  // atras se volveria a abrir sola en cada tanda que llegara.
  abrirSiTocaba(model, col, view) {
    const abrir = col && col.abrirEntrada;
    if (!abrir) {
      return;
    }
    if (String(model.get('indice')) !== abrir.indice ||
        String(model.get('entrada')) !== abrir.entrada) {
      return;
    }
    col.abrirEntrada = null;
    // expandir() ya se encarga del resto: trae la ficha entera, cambia a la
    // plantilla larga, carga los comentarios y hace scroll hasta ella.
    view.expandir();
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