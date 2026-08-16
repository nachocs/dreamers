import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import template from './loginView.html';
import config from '../config';
import userModel from '../models/userModel';

export default Backbone.View.extend({
  id: 'loginPlace',
  className: 'login-view',
  template: _.template(template),
  initialize() {
    _.bindAll(this);
    this.model = userModel;
    this.listenTo(this.model, 'change', this.render.bind(this));
    // Recuperar la sesion al cargar. Esto FALTABA: comprobarSesion (antes
    // checkCookie) estaba definida y no la llamaba nadie, asi que la sesion
    // solo duraba lo que durara la pagina en la que habias entrado. Al
    // volver aparecias desconectado aunque tu sesion siguiera viva en el
    // servidor, y con el formulario de publicar escondido detras.
    this.comprobarSesion();
  },
  events: {
    'click #loginSubmit': 'submit',
    'click input'(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    'click .login-menu-button': 'openMenu',
    'click .js-logout': 'logOut',
  },
  logOut(){
    // Cerrar sesion tiene que pasar por el servidor. Vaciar la cookie aqui
    // dejaba VIVO el fichero de sesion (hasta 10 dias), asi que la tienda te
    // seguia viendo dentro: ese era el "si te haces log-off de uno no se va
    // del otro". panel.cgi?logoff=1 borra la sesion de verdad; el navegador
    // manda la cookie solo, no hace falta leerla desde aqui.
    const self = this;
    $.ajax({
      type: 'GET',
      url: config.logoffCgi,
      xhrFields: { withCredentials: true },
    }).always(() => {
      self.model.clear();
    });
    // Aqui iba tambien un FB.logout(). Al retirar el SDK, 'FB' ya no
    // existe en el navegador y llamarlo reventaba el cierre de sesion.
  },

  openMenu() {
    this.$('.login-menu').toggleClass('hidden');

  },
  comprobarSesion(){
    // Ya no se lee la cookie desde JS. Antes habia que interpretarla aqui, y
    // convivian DOS formatos con el mismo nombre: el que escribia este JS
    // ({"uid":"..."}) y el del Perl (uid::...), que es el unico que entienden
    // la tienda y el resto del sitio. Ahora se le pregunta al servidor y el
    // navegador manda la cookie sola, sea del formato que sea. Ademas esto
    // seguira funcionando cuando la cookie pase a ser HttpOnly.
    this.loginCall({}, true);
  },
  // 'sondeo' = solo estamos mirando si hay sesion abierta. No haberla es lo
  // normal para un visitante anonimo y no debe pintar ningun error.
  loginCall(data, sondeo){
    const self = this;
    $.ajax({
      type: 'POST',
      url: config.loginCgi,
      data,
      xhrFields: { withCredentials: true },
      success(respuesta) {
        if (!respuesta || respuesta.status !== 'ok') {
          if (!sondeo) {
            self.showError('no tira');
          }
          return;
        }
        self.model.set(respuesta.user);
        // La cookie NO se toca desde aqui: la pone el servidor en el
        // Set-Cookie de esta misma respuesta, en formato uid::, que es el
        // que ya leen panel.cgi, foros.cgi y la tienda.
      },
    });
  },
  submit(e) {
    e.preventDefault();
    const alias = this.$('#loginAlias').val(),
      password = this.$('#loginPassword').val();
    if ((alias.length < 1) || (password.length < 1)) {
      console.log('te olvidaste de poner algo'); // TODO
    } else {
      // mockup
      this.loginCall({
        alias,
        password,
      });
    }
  },
  showError(error){
    this.$('.error-login').html(error).addClass('active');
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.delegateEvents();

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender.apply(this);
    }
    return this;
  },
  afterRender() {
  },
  serializer() {
    return this.model.toJSON();
  },
});
