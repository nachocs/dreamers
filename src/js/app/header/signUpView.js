import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import Cookies from 'js-cookie';
import template from './signUpView.html';
import config from '../config';
import userModel from '../models/userModel';

// Alta rapida en 3 campos, la que faltaba en la portada: hasta ahora el
// unico registro era el formulario largo del motor clasico y ni siquiera se
// enlazaba desde aqui.
//
// Los minimos (alias 4, clave 8) son los mismos que valida registro.cgi. Se
// comprueban aqui para avisar mientras se escribe, no como barrera: la de
// verdad esta en el servidor.
const MIN_ALIAS = 4;
const MIN_PASSWORD = 8;
// Deliberadamente permisiva: solo descarta lo que no es un email de ninguna
// manera. Quien decide de verdad es el servidor, y por debajo de eso, que
// llegue o no el correo.
const RE_EMAIL = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

export default Backbone.View.extend({
  className: 'sign-up-view',
  template: _.template(template),

  initialize() {
    _.bindAll(this);
    this.estado = {
      alias: '', email: '', password: '',
      aliasEstado: '', aliasMensaje: '',
      emailEstado: '', emailMensaje: '',
      passwordEstado: '', passwordMensaje: '',
      enviando: false,
      errorEnvio: '',
    };
    // Una peticion viva por campo, para poder cancelarla: sin esto la
    // respuesta de una tecla anterior puede llegar despues que la de la
    // ultima y pisar el aviso con algo que ya no es cierto.
    this.consultas = {};
  },

  events: {
    'input #signupAlias': 'cambiaAlias',
    'input #signupEmail': 'cambiaEmail',
    'input #signupPassword': 'cambiaPassword',
    'submit .sign-up-form': 'enviar',
  },

  // El formulario se pinta UNA vez. Mientras se escribe solo se tocan los
  // avisos y el boton, nunca los <input>.
  //
  // La primera version repintaba la vista entera en cada tecla y restauraba
  // el foco y el cursor a mano. Parecia funcionar en las pruebas por
  // programa, pero al escribir de verdad el foco acababa saltando a otro
  // campo: reemplazar el nodo bajo el cursor pelea con el navegador y no
  // hay forma de ganar esa pelea. Actualizar solo lo que cambia no tiene
  // ese problema, y ademas es menos codigo.
  actualizar() {
    ['alias', 'email', 'password'].forEach(campo => {
      const $aviso = this.$('#signup' + campo.charAt(0).toUpperCase() + campo.slice(1))
        .closest('.sign-up-campo').find('.sign-up-aviso');
      $aviso
        .attr('class', 'sign-up-aviso ' + this.estado[campo + 'Estado'])
        .text(this.estado[campo + 'Mensaje']);
    });

    this.$('#signupSubmit')
      .prop('disabled', !this.puedeEnviar())
      .text(this.estado.enviando ? 'un momento...' : 'registrarse');

    this.$('.sign-up-error-envio')
      .toggleClass('activo', !!this.estado.errorEnvio)
      .text(this.estado.errorEnvio);
  },

  fijar(campo, estado, mensaje) {
    this.estado[campo + 'Estado'] = estado;
    this.estado[campo + 'Mensaje'] = mensaje;
  },

  // Pregunta al servidor si el alias o el email estan cogidos.
  comprobar(campo, valor) {
    const self = this;
    if (this.consultas[campo]) {
      this.consultas[campo].abort();
    }
    this.fijar(campo, 'cargando', 'comprobando...');
    this.actualizar();
    this.consultas[campo] = $.ajax({
      url: config.checkCgi,
      data: { indice: campo, value: valor },
      dataType: 'json',
    }).done(data => {
      if (data && data.status === 'disponible') {
        self.fijar(campo, 'ok', campo === 'alias' ? 'libre!' : 'no registrado, bien');
      } else {
        self.fijar(campo, 'error', campo === 'alias' ? 'ese alias ya esta pillao' : 'ese email ya esta registrado');
      }
      self.actualizar();
    }).fail((xhr, textStatus) => {
      if (textStatus === 'abort') {
        return;
      }
      // Sin respuesta no se puede afirmar que este libre, pero tampoco
      // conviene bloquear el alta: lo dira el servidor al enviar.
      self.fijar(campo, '', '');
      self.actualizar();
    });
  },

  cambiaAlias(ev) {
    const valor = $(ev.currentTarget).val();
    this.estado.alias = valor;
    if (!valor) {
      this.fijar('alias', '', '');
      this.actualizar();
    } else if (valor.length < MIN_ALIAS) {
      this.fijar('alias', 'error', 'mu corto, ' + MIN_ALIAS + ' letras por lo menos');
      this.actualizar();
    } else {
      this.comprobar('alias', valor);
    }
  },

  cambiaEmail(ev) {
    const valor = $(ev.currentTarget).val();
    this.estado.email = valor;
    if (!valor) {
      this.fijar('email', '', '');
      this.actualizar();
    } else if (!RE_EMAIL.test(valor)) {
      this.fijar('email', 'error', 'eso no parece un email');
      this.actualizar();
    } else {
      this.comprobar('email', valor);
    }
  },

  cambiaPassword(ev) {
    const valor = $(ev.currentTarget).val();
    this.estado.password = valor;
    if (!valor) {
      this.fijar('password', '', '');
    } else if (valor.length < MIN_PASSWORD) {
      this.fijar('password', 'error', MIN_PASSWORD + ' caracteres al menos, porfa');
    } else {
      this.fijar('password', 'ok', 'vale');
    }
    this.actualizar();
  },

  puedeEnviar() {
    return this.estado.aliasEstado === 'ok'
      && this.estado.emailEstado === 'ok'
      && this.estado.passwordEstado === 'ok'
      && !this.estado.enviando;
  },

  enviar(ev) {
    ev.preventDefault();
    if (!this.puedeEnviar()) {
      return;
    }
    const self = this;
    this.estado.enviando = true;
    this.estado.errorEnvio = '';
    this.actualizar();

    $.ajax({
      url: config.registroCgi,
      type: 'POST',
      dataType: 'json',
      data: {
        alias: this.estado.alias,
        email: this.estado.email,
        password: this.estado.password,
      },
    }).done(data => {
      self.estado.enviando = false;
      if (!data || data.error) {
        self.estado.errorEnvio = (data && data.error) || 'no ha podido ser';
        self.actualizar();
        return;
      }
      // Mismo cierre que el login: guardar el uid en la cookie 'city' y
      // volcar el usuario en userModel, que es lo que hace que aparezcan el
      // formulario de entradas y el de comentarios.
      // El JSON.stringify va explicito porque js-cookie 3 ya no serializa
      // objetos sola, y el CGI espera exactamente estos bytes.
      Cookies.set('city', JSON.stringify({ uid: data.uid }));
      userModel.set(data.user);
      userModel.set('uid', data.uid);
      self.trigger('registrado');
    }).fail(() => {
      self.estado.enviando = false;
      self.estado.errorEnvio = 'no se ha podido conectar, prueba otra vez';
      self.actualizar();
    });
  },

  render() {
    this.el.innerHTML = this.template(this.serializer());
    return this;
  },

  serializer() {
    return Object.assign({}, this.estado, {
      puedeEnviar: this.puedeEnviar(),
    });
  },
});
