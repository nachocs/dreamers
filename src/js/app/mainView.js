import Backbone from 'backbone';
import _ from 'lodash';
import template from './mainView.html';
import LibraryView from './entradas/libraryView';
import LoginView from './header/loginView';
import FormView from './entradas/formView';
import ModalView from './msgs/modalView';
import MenuDreamers from './header/menuDreamersView';
import { alternarDrawer, cerrarDrawer, manejarTeclaEnBoton, engancharEscape } from './util/drawer';

export default Backbone.View.extend({
  template: _.template(template),
  initialize(options) {
    this.router = options.router;
    this.libraryView = new LibraryView({
      collection: this.collection,
      router: this.router,
    });
    this.formView = new FormView({
      collection: this.collection,
    });
    this.loginView = new LoginView();
    this.menuDreamers = new MenuDreamers({ router: this.router });
    this.model = new Backbone.Model();
    this.model.set('Titulo', 'dreamers');
    // logodreamers50x50
    this.images = {
      logo: require('../../img/logodreamers50x50.jpg'),
    };
  },
  events: {
    // El cajon lateral: antes de esto lo movia el JS de MDL, que se enganchaba
    // solo al inyectar el boton. Ahora el markup esta en la plantilla y los
    // eventos van por delegacion, como el resto de la vista.
    'click .js-drawer-toggle': 'alDrawerPulsado',
    'keydown .js-drawer-toggle': 'alDrawerTecla',
    'click .js-drawer-close': 'alDrawerCerrar',
    'click .logomask': 'logomask',
    'click .js-abrir-login': 'abrirLogin',
    'click .js-registro': 'abrirRegistro',
  },
  // El alta rapida se ofrece desde tres sitios (el desplegable de la
  // cabecera y las dos invitaciones), y desde los tres abre el mismo modal.
  abrirRegistro(ev) {
    ev.preventDefault();
    ModalView.abrirRegistro();
  },
  // Las invitaciones a participar salen en sitios muy distintos (el hueco
  // del formulario en la portada y el pie de cada ficha expandida), pero
  // todas tienen que abrir el MISMO desplegable de login de la cabecera.
  // El manejador vive aqui porque el el de mainView contiene a los dos, y
  // Backbone delega, asi que vale igual para las fichas que se pintan
  // despues. En vez de duplicar el formulario, se pulsa el boton que ya
  // existe y se deja que loginView siga siendo el unico que sabe abrirlo.
  abrirLogin(ev) {
    ev.preventDefault();
    this.$('.login-view .login-menu-button').first().trigger('click');
  },
  logomask() {
    alternarDrawer();
    // const indice = $(ev.currentTarget).data('indice');
    // this.router.navigate('/indices/' + indice, { trigger: true });
  },

  // Nombres distintos a los de las funciones importadas a proposito: un
  // metodo llamado igual que su import se lee como una recursion infinita.
  alDrawerPulsado(ev) {
    ev.preventDefault();
    alternarDrawer();
  },
  alDrawerTecla(ev) {
    manejarTeclaEnBoton(ev);
  },
  alDrawerCerrar() {
    cerrarDrawer();
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.$('#container').html(this.libraryView.render().el);
    // this.$('#head').append(this.logoView.render().el);
    this.$('.form-view').html(this.formView.render().el);
    this.$('.login-view').html(this.loginView.render().el);
    this.$('.modal-view').html(ModalView.render().el);
    this.$('.resumen-collection').html(this.menuDreamers.render().el);
    // Escape cierra el cajon. Va al documento y se engancha una sola vez, asi
    // que repintar la vista no acumula manejadores.
    engancharEscape();
    return this;
  },
  serializer() {
    return Object.assign({},
      this.model.toJSON(), {
        imgLogo: this.images.logo,
      });
  },
});