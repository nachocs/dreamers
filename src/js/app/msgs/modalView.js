import Backbone from 'backbone';
import _ from 'lodash';
import template from './modalView-t.html';
import FormView from './msgFormView';

const Model = Backbone.Model.extend({
  defaults:{
    show: false,
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
      this.model.set(obj.model);
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
    this.undelegateEvents();
    this.delegateEvents();
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
