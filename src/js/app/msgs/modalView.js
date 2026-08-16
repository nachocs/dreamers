import Backbone from 'backbone';
import _ from 'lodash';
import template from './modalView-t.html';
import FormView from './msgFormView';
import SignUpView from '../header/signUpView';

const Model = Backbone.Model.extend({
  defaults:{
    show: false,
    sinBotones: false,
  },
});
const ModalView = Backbone.View.extend({
  model: new Model(),
  template: _.template(template),
  initialize(){
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  events:{
    'click .js-close': 'close',
    'click .js-action': 'runAction',
  },
  runAction(){
    if (this.action){
      this.action();
    }
    this.close();
  },
  update(obj){
    if (obj.model){
      // El modelo es un singleton, asi que las banderas se quedan pegadas
      // de una apertura a la siguiente: sin este defaults, abrir el
      // registro (que pide sinBotones) dejaba sin pie de OK/Cancelar al
      // siguiente modal de borrar entrada. Quien no lo pida, lo tiene a
      // false.
      this.model.set(_.defaults({}, obj.model, { sinBotones: false }));
    }
    if (obj.action){
      this.action = obj.action;
    }
    if(obj.editForm){
      const EditForm = new FormView({
        userModel: obj.editForm.userModel,
        collection: obj.editForm.collection,
        msg: obj.editForm.msg,
        parentModel: obj.editForm.parentModel,
      });
      this.$('.modal-body').html(EditForm.render().el);
      this.action = EditForm.submitPost.bind(EditForm);
    }
    if (obj.signUp){
      // El formulario de alta trae su propio boton de enviar (ver
      // 'sinBotones' en la plantilla) y se cierra solo al registrarse.
      // ModalView es un singleton, asi que hay que soltar la vista
      // anterior: si no, cada apertura deja su escucha colgando.
      if (this.signUpView){
        this.stopListening(this.signUpView);
      }
      this.signUpView = new SignUpView();
      this.$('.modal-body').html(this.signUpView.render().el);
      this.listenTo(this.signUpView, 'registrado', this.close.bind(this));
      this.action = null;
    }
    this.undelegateEvents();
    this.delegateEvents();
  },
  // Abre el alta rapida. Lo llaman los sitios que invitan a participar.
  abrirRegistro(){
    this.update({
      model: {
        show: true,
        header: 'Reg&iacute;strate',
        body: '',
        sinBotones: true,
      },
      signUp: true,
    });
  },
  close(){
    this.model.set('show', false);
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    this.delegateEvents();
    return this;
  },
  serializer(){
    return this.model.toJSON();
  },
});

export default new ModalView();
