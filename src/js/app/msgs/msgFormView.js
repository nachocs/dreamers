import Backbone from 'backbone';
import formModel from '../models/msgFormModel';
import _ from 'lodash';
import $ from 'jquery';
import Wysiwyg from '../util/Wysiwyg';
import template from './msgFormView.html';
import emojione from 'emojione';
import EmojisModal from '../util/emojisModal';
import Util from '../util/util';
import MsgModel from '../models/msgModel';
import vent from '../util/vent';
import userModel from '../models/userModel';
import config from '../config';

function isOrContains(node, container) {
  while (node) {
    if (node === container) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function elementContainsSelection(el) {
  let sel;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      for (let i = 0; i < sel.rangeCount; ++i) {
        if (!isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
          return false;
        }
      }
      return true;
    }
  } else if ( (sel = document.selection) && sel.type != 'Control') {
    return isOrContains(sel.createRange().parentElement(), el);
  }
  return false;
}

export default Backbone.View.extend({
  template: _.template(template),
  initialize(options) {
    this.parentModel = options.parentModel;
    this.formModel = new formModel();
    if(options.msg){
      this.formModel.set(options.msg.toJSON());
    }
    this.showEmojisModal = false;
    this.tagPlaceShown = false;
    this.capturedUrls = {};
    this.removedCapturedUrls = {};


    this.wysiwyg = new Wysiwyg();
    this.listenTo(userModel, 'change', this.render.bind(this));
    this.listenTo(this, 'remove', this.clean.bind(this));
    this.listenTo(this.formModel, 'change', this.render.bind(this));
    $(window).on('beforeunload', ()=>{
      if (this.$('.formularioTextArea').html().length>0){
        return 'tienes un mensaje pendiente de enviar';
      }
    });
  },
  className: 'msg-form-view formulario',
  events: {
    'click .formularioTextArea': 'clearArea',
    'click .form-submit-button': 'submitPost',
    'mouseup .formularioTextArea': 'getSelectedText',
    'mousedown .formularioTextArea': 'getSelectedText',
    'keyup .formularioTextArea': 'getSelectedText',
    'keydown .formularioTextArea': 'getSelectedText',
    'change input[type="file"]': 'upload',
    'click .emojis': 'showEmojis',
    'click .show-tags': 'toggleTags',
    'keyup .input-tag': 'inputTag',
    'click [data-delete-tag]':'deleteTag',
    'paste .formularioTextArea' : 'onPaste',
    'error': 'imgError',
    'click .capture-url-close': 'removeCapturedUrl',
  },
  imgError(e){
    console.log(e);
  },
  onPaste(e) {
    function replaceStyleAttr (str) {
      return str.replace(/(<[\w\W]*?)(style)([\w\W]*?>)/g, function (a, b, c, d) {
        return b + 'style_replace' + d;
      });
    }

    function removeTagsExcludeA (str) {
      return str.replace(/<\/?((?!a)(\w+))\s*[\w\W]*?>/g, '');
    }

    e.preventDefault();
    let text = '';
    if (e.clipboardData || e.originalEvent.clipboardData) {
      text = (e.originalEvent || e).clipboardData.getData('text/plain');
    } else if (window.clipboardData) {
      text = window.clipboardData.getData('Text');
    }
    text = removeTagsExcludeA(replaceStyleAttr(text));
    if (document.queryCommandSupported('insertText')) {
      document.execCommand('insertText', false, text);
    } else {
      document.execCommand('paste', false, text);
    }
  },
  deleteTag(e){
    const tag = this.$(e.currentTarget).data('delete-tag');
    const tags = this.formModel.get('tags').split(',');

    let newTags = '';
    for (let i = 0; i < tags.length; ++i) {
      if (i != tag){
        if (newTags.length > 0){
          newTags = newTags + ',';
        }
        newTags = newTags + tags[i];
      }
    }
    this.setComments();
    this.formModel.set({tags: newTags});
  },
  inputTag(e){
    e.preventDefault();
    if (e.target.value && e.target.value.length > 10){
      e.target.value = e.target.value.substring(0,10);
    }
    if (e.keyCode === 13 || e.keyCode === 188){
      e.target.value = e.target.value.replace(/\W/ig,'');
      let newTag = e.target.value.replace(/\W/ig,'');
      if (newTag && newTag.length > 2 ){
        newTag = '#' + newTag;
        let tags = this.formModel.get('tags') ? this.formModel.get('tags').split(',') : [];
        tags.push(newTag);
        tags = _.uniq(tags);
        this.setComments();
        this.formModel.set({tags:_.join(tags, ',')});
        this.$('.input-tag').focus();
      }
    } else {
      e.target.value = e.target.value.replace(/\W/ig,'');
    }
  },
  toggleTags(){
    this.showEmojisIn(false);
    this.tagPlaceShown = !this.tagPlaceShown;
    this.toggleTagsIn(this.tagPlaceShown);
  },
  toggleTagsIn(prev){
    if (prev){
      this.$el.find('.tags-place ul').show('slow');
    } else {
      this.$el.find('.tags-place ul').hide('slow');
    }
    if (prev){
      // this.materialDesignUpdate();
      // componentHandler.upgradeElement(this.$el.find('.mdl-js-textfield')[0]);
    }
    this.tagPlaceShown = prev;
  },
  showEmojisIn(prev){
    if (prev){
      this.$('.emojis-modal-place').show('slow');
      EmojisModal.setParent(this);
      this.$('.emojis-modal-place').html(EmojisModal.render().el);
    } else {
      this.$('.emojis-modal-place').hide('slow');
    }
    this.showEmojisModal = prev;
  },
  showEmojis(){
    this.toggleTagsIn(false);
    if (EmojisModal.parent && EmojisModal.parent.cid !== this.cid){
      this.showEmojisModal = false;
    }
    this.showEmojisModal = !this.showEmojisModal;
    this.showEmojisIn(this.showEmojisModal);
  },
  getEmoji(string){
    this.clearArea();
    if (this.currentPosition){
      this.restoreSelection(this.currentPosition);
      this.insertTextAtCursor(string);
    } else {
      this.$('.formularioTextArea').append(string);
    }
  },
  addImages() {
    const jsonModel = this.formModel.toJSON();
    for (const prop in jsonModel){
      if ((/IMAGEN\d+\_THUMB$/).test(prop)){
        const thisThumb = jsonModel[prop];
        this.$('.thumbs-place').append('<img src=\'' + thisThumb + '\'>');
      }
    }
  },

  upload() {
    if (!userModel.get('uid')){ return; }
    this.clearArea();
    this.showEmojisIn(false);
    const self = this;
    const data = new FormData();
    let imagenes_jump = 0;

    Object.keys(this.formModel.toJSON()).forEach((key)=> {
      if ((/IMAGEN(\d+)_URL/).exec(key)){
        const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        if ((Number(image)+1)>imagenes_jump){
          imagenes_jump = Number(image)+1;
        }
      }
    });

    $.each(this.$('input[type="file"]')[0].files, (i, file) => {
      const numero = imagenes_jump + i;
      data.append('FICHERO_IMAGEN' + numero, file);
    });
    $.ajax({
      url: config.path + 'cgi/upload.cgi?sessionId=' + userModel.get('uid'),
      data,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      success(data) {
        // console.log('UPLOAD RESPONSE: ', data);
        self.setComments();
        if (data.response && data.response.Ficheros && self.formModel.get('Ficheros')){
          data.response.Ficheros = self.formModel.get('Ficheros') + ',' + data.response.Ficheros;
        }
        self.formModel.set(data.response);
        self.addImages();
      },
    });
  },
  setComments(){
    this.formModel.set('comments', this.$('.formularioTextArea').html());
  },
  saveSelection() {
    let sel, res = null;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        res = sel.getRangeAt(0);
      }
    } else if (document.selection && document.selection.createRange) {
      res = document.selection.createRange();
    }

    if (res && res.commonAncestorContainer.className && !res.commonAncestorContainer.className.match(/formularioTextArea/)){
      res = null;
    }
    if (res && !res.commonAncestorContainer.className && res.commonAncestorContainer.parentNode && !res.commonAncestorContainer.parentNode.className.match(/formularioTextArea/)){
      res = null;
    }
    return res;

  },
  insertTextAtCursor(element) {
    let sel, range;
    if (!elementContainsSelection(this.$('.formularioTextArea')[0])){
      this.$('.formularioTextArea').append(element);
    } else {
      if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0);
          range.deleteContents();
          // Range.createContextualFragment() would be useful here but is
          // only relatively recently standardized and is not supported in
          // some browsers (IE9, for one)
          const el = document.createElement('div');
          el.innerHTML = element;
          const frag = document.createDocumentFragment();
          let node;
          let lastNode;
          while ( (node = el.firstChild) ) {
            lastNode = frag.appendChild(node);
          }
          range.insertNode(frag);

          // Preserve the selection
          if (lastNode) {
            range = range.cloneRange();
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      } else if (document.selection && document.selection.type != 'Control') {
        // IE < 9
        document.selection.createRange().pasteHTML(element);
      }
    }

    this.currentPosition = this.saveSelection();
  },
  restoreSelection(range) {
    let sel;
    if (range) {
      if (window.getSelection) {
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.selection && range.select) {
        range.select();
      }
    }
  },
  getCaptureUrls(){
    // setTimeout(()=>{
    let content = this.$('.formularioTextArea').clone();
    content.find('.captured-url').remove();
    content = content.html();
    content = content.replace(/&nbsp;/ig, ' ');
    content = content.replace(/\n/ig, ' ');
    content = content.replace(/<[^>]*>/ig, ' ');

    const urlMatch = content.match(/\b(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/igm);
    if (urlMatch && urlMatch.length>0){
      urlMatch.forEach((url)=>{
        url = url.replace(/[\s\t\n<]+/ig,'');
        url = url.replace(/^https?\:\/\//, '');
        if (!this.capturedUrls[url] && !url.match(/youtube/) && !this.removedCapturedUrls[url] && (Object.keys(this.capturedUrls).length < 5)){
          this.capturingUrls = true;
          vent.on('capture_url_reply_' + userModel.get('ID'), (data)=>{
            const dataurl = data.url.replace(/^https?\:\/\//, '');
            if (!this.capturedUrls[dataurl]){
              this.capturedUrls[dataurl] = true;
              // console.log('recibido capture_url_reply ', data);
              const capturedUrlDiv = Util.displayCapturedUrl(Object.assign({},data.reply,{id:dataurl}));
              this.$('.formularioTextArea').append(capturedUrlDiv);
            }
            this.capturingUrls = false;
          });
          // console.log('capture url request', url);
          // Ws.captureUrlRequest(this.userModel.get('ID'), url);
        }
      });
    }
    // },0);

  },
  removeCapturedUrl(e){
    const url = this.$(e.target).data('capturedurl');
    delete this.capturedUrls[url];
    this.removedCapturedUrls[url] = true;
    this.$('.formularioTextArea').find('div[data-capturedurlid="' + url + '"]').remove();
  },
  getSelectedText(e) {
    let selection;
    if (e.keyCode == 13){
      this.getCaptureUrls();
      this.submitPost();
      return;
    } else if (e.keyCode == 32 || e.keyCode == 13){
      this.getCaptureUrls();
    }
    // console.log(e.keyCode);
    //Get the selected stuff
    this.currentPosition = this.saveSelection();

    if(window.getSelection){
      selection = window.getSelection();
    }
    else if(typeof document.selection != 'undefined'){
      selection = document.selection;
    }
    if ((typeof selection === 'undefined') || (selection.toString().length < 1) ){
      this.$('.wysiwyg').hide();
      return;
    }

    //Get a the selected content, in a range object
    const range = selection.getRangeAt(0);

    //If the range spans some text, and inside a tag, set its css class.
    if(range && !selection.isCollapsed)
    { // range da la posicion sin contar el scroll
      this.$('.wysiwyg').show().css({top: (range.getBoundingClientRect().top+$(window).scrollTop()-this.$('.mdl-card').first().offset().top-22)+'px', left: (range.getBoundingClientRect().left-this.$('.mdl-card').first().offset().left)+'px'});
    } else if (selection.isCollapsed){
      this.$('.wysiwyg').hide();
    }
  },
  submitPost(){
    let wait = 0;
    let countWait = 0;
    const runPost = _.throttle(this.submitPostThrottle.bind(this), 1000);
    const waiting = (callback, wait) => {
      setTimeout(() => {
        console.log('countWait', countWait, wait);
        if (!this.capturingUrls || (countWait > 4)){
          callback();
        } else {
          waiting(callback, wait);
        }
        countWait++;
      }, wait);
    };
    if (this.capturingUrls){
      wait = 1000;
    }
    waiting(runPost, wait);
  },
  submitPostThrottle() {
    if (!userModel.get('uid')){ return; }
    if (this.isSaving){ return; }
    this.showEmojisIn(false);
    this.toggleTagsIn(false);
    const self = this;
    let comments;
    // tinyMCE.triggerSave();
    comments = this.$('.formularioTextArea').clone();
    comments.find('.captured-url .capture-url-close').remove();
    comments = comments.html();
    // comments = comments.replace(/\n/ig, '<br>');
    // comments = comments.replace(/\r/ig, '<br>');
    comments = comments.replace(/\&nbsp\;/ig, ' ');
    comments = comments.replace(/\&amp\;/ig, '&');

    if (comments.length < 1 ){
      return;
    }
    if (!this.parentModel.get('INDICE') || !this.parentModel.get('ID') || ! userModel.get('uid')){
      return;
    }
    const saveObj = {
      comments,
      uid: userModel.get('uid'),
      indice: this.parentModel.get('INDICE'),
      entrada: this.parentModel.get('ID'),
    };


    this.isSaving = true;
    this.formModel.save(
      saveObj,
      {
        success(model, data) {
          self.isSaving = false;
          self.formModel.clear();
          self.isClear = false;
          self.capturedUrls = {};
          self.removedCapturedUrls = {};
          self.render();

          const msgModel = new MsgModel(data.mensaje);
          self.collection.add(msgModel, {merge:true, individual:true});

          // self.collection.reset();
          // self.collection.fetch();
          // console.log('success', data);
        },
        error() {
          // console.log('error', data);
        },
      }
    );
  },
  clearArea(focus) {
    // if (this.isClear){return;}
    // this.$('.formularioTextArea').html(this.formModel.get('comments')).addClass('on');
    this.active = true;
    this.$('.formularioTextArea').addClass('on');
    if (focus){
      this.$('.formularioTextArea').focus();
    }
    // this.isClear =  true;
  },
  render() {
    if (userModel.get('uid')){
      this.$el.html(this.template(this.serializer()));
      this.$el.addClass('active');
      this.$('.wysiwyg-view').html(this.wysiwyg.render().el);

      if (this.afterRender && typeof this.afterRender === 'function') {
        this.afterRender.apply(this);
      }
      this.showEmojisIn(this.showEmojisModal);
      this.toggleTagsIn(this.tagPlaceShown);
    } else {
      this.$el.removeClass('active');
    }
    this.delegateEvents();
    return this;
  },
  afterRender() {
    this.$('.wysiwyg').hide();
    // componentHandler.upgradeElement(this.$el.find('.mdl-button')[0]);
    // if (this.tagPlaceShown){
    //   this.$el.find('.mdl-js-textfield').each((index, ele)=>{
    //     componentHandler.upgradeElement(ele);
    //   });
    // }
    // this.materialDesignUpdate();
    // this.$('.formularioTextArea').keyup(function() {
    //   $(this).height(38);
    //   $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    // });
  },
  serializer(){
    const obj = userModel.toJSON();
    let titulo_head;
    if (this.parentModel && this.parentModel.get('ID')){
      Object.assign(obj, { parentModel: this.parentModel.toJSON() });
    }
    Object.assign(obj, {
      emojis: emojione.toImage(':smile:'),
      formModel: this.formModel.toJSON(),
      tags: this.formModel.get('tags') ? this.formModel.get('tags').split(',') : null,
      tagPlaceShown: this.tagPlaceShown,
      active: this.active,
      titulo_head,
    });
    return obj;
  },
  clean(){
    if (this.wysiwyg){
      this.wysiwyg.remove();
    }
    if (this.emojisModal){
      this.emojisModal.remove();
    }
    delete this.wysiwyg;
    delete this.emojisModal;
    for (const prop of Object.keys(this)) {
      delete this[prop];
    }
    $(window).off('beforeunload');
  },
});
