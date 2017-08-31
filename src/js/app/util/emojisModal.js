import Backbone from 'backbone';
import template from './emojisModal-t.html';
import _ from 'lodash';
import emojis from './emojis';
const Model = Backbone.Model.extend({});

const EmojisModal = Backbone.View.extend({
  className: 'emojis-modal',
  template: _.template(template),
  events:{
    'click .emojis-modal-tabs span[data-tab]':'selectTab',
    'click .emojis-modal-content .emojione':'selectEmoji',
  },
  initialize(){
    this.model = new Model();
    this.model.set('selectedCategory','people');
    this.emojiList = emojis.emojis;
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  setParent(scope){
    this.parent = scope;
  },
  selectEmoji(e){
    this.parent.getEmoji(this.$(e.currentTarget)[0].outerHTML);
    // let emoji = '';
    // if(this.parent.formModel.get('comments')){
    //   emoji = this.parent.formModel.get('comments');
    // }
    // emoji = emoji + this.$(e.currentTarget)[0].outerHTML;
    // this.parent.formModel.set('comments', emoji);
  },
  selectTab(e){
    this.model.set('selectedCategory', this.$(e.currentTarget).data('tab'));
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    setTimeout(()=>{
      this.delegateEvents();
    });
    return this;
  },
  serializer(){
    // activity flags food modifier nature objects people regional symbols travel
    return Object.assign({},
      {list: this.emojiList},
      this.model.toJSON(),
    );
  },
});
export default new EmojisModal();
