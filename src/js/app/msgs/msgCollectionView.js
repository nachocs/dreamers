import Backbone from 'backbone';
import MsgView from './msgView';
import $ from 'jquery';

export default Backbone.View.extend({
  initialize(options){
    this.parentModel = options.parentModel;
    this.views = {};
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
    // this.listenTo(this.collection, 'update', this.render.bind(this));
  },
  className: 'msg-collection-view',
  render() {
    this.$el.html('');
    this.collection.each(function (model) {
      this.renderOne(model);
    }, this);
    return this;
  },
  renderOne(model) {
    if (!model.id){return;}
    const msgView = new MsgView({
      model,
      parentModel: this.parentModel,
      collection: this.collection,
    });
    this.views[model.id] = msgView;
    // this.$el.append(msgView.render().el);
    const view = $(msgView.render().el).hide();
    view.appendTo(this.$el).slideDown('slow');
  },
});
