import Backbone from 'backbone';
import _ from 'lodash';
import template from './msgView.html';
import userModel from '../models/userModel';
import Util from '../util/util';
import moment from 'moment';
import MolaView from './molaView';
import Autolinker from 'autolinker';
import $ from 'jquery';
import ModalView from './modalView';

const youtube_parser = url => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
    match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
};

const autolinker = new Autolinker({
  replaceFn (match) {
    if (match.getType() === 'url') {
      if ((match.getUrl().indexOf('youtube.com') > 0) || (match.getUrl().indexOf('youtu.be') > 0)) {
        const youtubeId = youtube_parser(match.getUrl());
        return `<div class="videodelimitador"><div class="videocontenedor"><iframe src="//www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen=""></iframe></div></div>`;
      }
    } else {
      return;
    }
  },
});
export default Backbone.View.extend({
  template: _.template(template),
  className: 'msg',
  events: {
    'click .spoiler': 'openSpoiler',
    'click .show-admin': 'toggleAdminMenu',
    'click .js-ban': 'showBanModal',
    'click .js-delete': 'showDeleteModal',
    'click .js-edit': 'editThis',
    'click .share':'openShare',
    'click .fa-facebook-official':'shareFb',
    'click .fa-twitter-square':'shareTw',
  },
  initialize(options) {
    this.parentModel = options.parentModel;
    this.molaView = new MolaView({
      model: this.model,
      userModel,
    });
    this.listenTo(this.model, 'destroy', this.remove.bind(this));
    this.listenTo(this.model, 'change', this.render.bind(this));
  },

  shareFb(){
    Util.bookmarkthis('facebook', 'https://gritos.com/' + this.model.get('INDICE').replace(/^gritos\//,'') + '/' + this.model.get('ID'), this.headModel.get('Title'));
  },
  shareTw(){
    Util.bookmarkthis('twitter', 'https://gritos.com/' + this.model.get('INDICE').replace(/^gritos\//,'') + '/' + this.model.get('ID'), this.headModel.get('Title'));
  },
  openShare(e){
    e.preventDefault();
    e.stopPropagation();
    this.$(e.currentTarget).find('.share-menu').toggleClass('active');
  },
  editThis(){
    ModalView.update({
      model:
      {
        show: true,
        header: 'EDITAR GRITO',
      },
      editForm:{
        userModel,
        collection: this.collection,
        msg: this.model,
        parentModel: this.parentModel,
      },
    },
    );
  },
  showBanModal(){
    ModalView.update({
      model:
      {
        show: true,
        header: '&iquest;ESTE GRITO APESTA?',
        body: '&iquest;Seguro que quieres denunciar este mensaje como basura?',
      },
      action: this.banThis.bind(this),
    },
    );
  },
  showDeleteModal(){
    ModalView.update({
      model:
      {
        show: true,
        header:'&iquest;BORRAR GRITO?',
        body: '&iquest;Seguro que quieres borrar este mensaje?',
      },
      action: this.deleteThis.bind(this),
    },
    );
  },
  deleteThis(){
    console.log('delete run');
    this.model.destroy();
  },
  banThis(){
    console.log('ban run');
  },
  toggleAdminMenu(e){
    e.preventDefault();
    e.stopPropagation();
    this.$(e.currentTarget).find('.admin-menu').toggleClass('active');
  },
  openSpoiler(e) {
    e.preventDefault();
    e.stopPropagation();
    const spoiler = $(e.currentTarget).attr('data-tip');
    const d_m = 'top';
    let w_t;
    let w_e;
    let h_t;
    let m_l;
    let out;
    const tipr_cont = `.tipr_container_${d_m}`;
    if ($(e.currentTarget).hasClass('spoiler-on')) {
      this.$(e.currentTarget).find(tipr_cont).fadeToggle();
    } else {
      out = `<div class="tipr_container_${d_m}"><div class="tipr_point_${d_m}"><div class="tipr_content">${spoiler}</div></div></div>`;
      this.$(e.currentTarget).append(out);

      w_t = this.$(e.currentTarget).find(tipr_cont).outerWidth();
      w_e = this.$(e.currentTarget).width();
      m_l = (w_e / 2) - (w_t / 2);
      // if (-m_l > this.$(e.currentTarget).position().left) {
        // m_l = m_l + this.$(e.currentTarget).position().left;
      // }
      h_t = -this.$(e.currentTarget).find(tipr_cont).height() - this.$(e.currentTarget).height() - 12;

      this.$(e.currentTarget).find(tipr_cont).css('margin-left', `${m_l}px`);
      this.$(e.currentTarget).find(tipr_cont).css('margin-top', `${h_t}px`);
      // paso dos veces porque cambia el alto al cambiar el margen
      w_t = this.$(e.currentTarget).find(tipr_cont).outerWidth();
      w_e = this.$(e.currentTarget).width();
      m_l = (w_e / 2) - (w_t / 2);
      h_t = -this.$(e.currentTarget).find(tipr_cont).height() - this.$(e.currentTarget).height() - 12;
      this.$(e.currentTarget).find(tipr_cont).css('margin-left', `${m_l}px`);
      this.$(e.currentTarget).find(tipr_cont).css('margin-top', `${h_t}px`);

      this.$(this).removeAttr('title alt');

      this.$(e.currentTarget).find(tipr_cont).fadeIn('300');
      this.$(e.currentTarget).addClass('spoiler-on');
    }
  },
  formatComments(string) {
    if (!string) {
      return string;
    }
    const replacer = (match, p1) => {
      p1 = p1.replace(/\"/ig, '&quot;');
      return ` <span class="spoiler" data-tip="${p1}">SPOILER</span> `;
    };

    string = string.replace(/\-\:SPOILER\[([^\]\[]+)\]SPOILER\:\-/ig, replacer);
    return autolinker.link(string);
  },
  render(){
    this.$el.html(this.template(this.serializer()));
    this.$('.mola-view').first().replaceWith(this.molaView.render().el);

    return this;
  },
  serializer(){
    const images = [];
    Object.keys(this.model.toJSON()).forEach((key)=> {
      if ((/IMAGEN(\d+)_URL/).exec(key)){ const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        images.push(Util.displayImage(this.model.toJSON(), image));
      }
    });
    return Object.assign({},
      this.model.toJSON(),
      {
        images,
        userModel: userModel.toJSON(),
        date: moment.unix(this.model.get('FECHA')).fromNow(),
        comments: this.formatComments(this.model.get('comments')),
      }
    );
  },
});
