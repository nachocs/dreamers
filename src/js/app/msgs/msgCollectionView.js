import Backbone from 'backbone';
import MsgView from './msgView';

export default Backbone.View.extend({
  initialize(){
    this.views = {};
    this.listenTo(this.collection, 'add', this.renderOne.bind(this));
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
    });
    this.views[model.id] = msgView;
    this.$el.append(msgView.render().el);
    // const view = $(msgView.render().el).hide();
    // view.prependTo(this.$el).slideDown('slow');
  },
});
