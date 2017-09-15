import Backbone from 'backbone';
import template from './molaView-t.html';
import _ from 'lodash';
// import grinImage from '../../../../../node_modules/icomoon-free-npm/SVG/234-grin.svg';
import userModel from '../models/userModel';

export default Backbone.View.extend({
  template: _.template(template),
  className: 'mola-view',
  initialize() {
    this.listenTo(userModel, 'change', this.render.bind(this));
    this.listenTo(this.model, 'change:mola', this.render.bind(this));
    this.listenTo(this.model, 'change:nomola', this.render.bind(this));
    this.listenTo(this.model, 'change:love', this.render.bind(this));
  },
  events: {
    'click i': 'molaAction',
  },
  molaAction(e) {
    e.stopPropagation();
    e.preventDefault();
    const mola = this.$(e.currentTarget).hasClass('mola') ? 'mola' : this.$(e.currentTarget).hasClass('nomola') ? 'nomola' : 'love';
    const modelObj = {};
    const array = this.model.get(mola + 'log') ? this.model.get(mola + 'log').split('|') : [];
    const newarray = [];
    let yaEstaba = false;
    array.forEach((ele) => {
      if (ele !== userModel.get('ID')){
        newarray.push(ele);
      } else {
        yaEstaba = true; // si ya estaba lo quita
      }
    });
    if (!yaEstaba){ // si no estaba lo pone
      newarray.push(userModel.get('ID'));
    }
    modelObj[mola + 'log'] = newarray.join('|');
      // userObj[molaTag] = (!this.userModel.get(molaTag)) ? 1 : null;
    // this.userModel.save(userObj);
    modelObj[mola] = newarray.length;
    this.model.save(modelObj);
  },
  render() {
    if (userModel && userModel.get('ID')) {
      this.$el.html(this.template(this.serializer()));
    }
    this.delegateEvents();
    return this;
  },
  serializer() {
    const arraymola = this.model.get('molalog') ? this.model.get('molalog').split('|') : [];
    const currentMola = arraymola.includes(userModel.get('ID'));
    const arraynomola = this.model.get('nomolalog') ? this.model.get('nomolalog').split('|') : [];
    const currentNomola = arraynomola.includes(userModel.get('ID'));
    const arraylove = this.model.get('lovelog') ? this.model.get('lovelog').split('|') : [];
    const currentLove = arraylove.includes(userModel.get('ID'));
    return _.extend({},
      this.model.toJSON(), {
        currentMola,
        currentNomola,
        currentLove,
        // grinImage,
      });
  },
  clean(string) {
    return string.replace(/\//ig, '.');
  },

});
