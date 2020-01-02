import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import FormModel from '../models/formModel';
import Wysiwyg from '../util/Wysiwyg';
import template from './formView.html';
import userModel from '../models/userModel';
import config from '../config';
import EmojisModal from '../util/emojisModal';
import EntradaModel from '../models/entradaModel';
import emojione from 'emojione';
import Service from '../util/service';

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
  } else if ((sel = document.selection) && sel.type != 'Control') {
    return isOrContains(sel.createRange().parentElement(), el);
  }
  return false;
}
const getIndice = async (indice) => {
  return await Service.getIndice(indice);
};
export default Backbone.View.extend({
  id: 'formPlace',
  className: 'form-place',
  template: _.template(template),
  initialize({
    collection,
  }) {
    _.bindAll(this);
    this.formModel = new FormModel();
    this.collection = collection;
    this.wysiwyg = new Wysiwyg();
    this.selectedIndice = 'Divaga a tu gusto, comparte tus sue&ntilde;os';
    this.indice = 'articulos';
    this.advanced = false;
    this.indicesArray = {
      'peliculas': 'Pel&iacute;cula',
      'articulos': 'Comparte tus sue&ntilde;os',
      'series': 'Critica Series de TV',
      'comics': 'Critica alg&uacute;n c&oacute;mic',
      'videojuegos': 'Habla sobre Videojuegos',
      'libros': 'Comenta alg&uacute;n libro',
      'discos': 'tu opini&oacuten sobre un Disco',
    };
    this.listenTo(userModel, 'change', this.userModelChange.bind(this));
    this.formatos = [{
      Name: 'Color',
      html: 'Color',
    }, {
      Name: 'Blanco_y_Negro',
      html: 'Blanco y Negro',
    }];
    // $.get(config.path + 'cgi/json.cgi?indice=paises&encontrar=ID').done(function (data){
    //   console.log(data);
    // });
    // fetch(config.path + 'cgi/json.cgi?indice=paises&encontrar=ID').then(res => res.json()).then((response)=>{
    //   console.log(response);
    // });
  },
  events: {
    'click .formulario-inactivo': 'clearArea',
    'click .form-submit': 'submitPost',
    'mouseup': 'getSelectedText',
    'mousedown': 'getSelectedText',
    'keyup': 'getSelectedText',
    'keydown': 'getSelectedText',
    'change #file-submit': 'upload',
    'click .indices-dropdown': 'onIndicesDropdown',
    'click .select-indice li': 'onSelectIndice',
    'click .advanced-dropdown span': 'advancedDropdown',
  },
  advancedDropdown() {
    this.advanced = !this.advanced;
    this.render();
  },
  userModelChange() {
    if (userModel.get('uid')) {
      getIndice('paises').then((data) => {
        this.paises = data;
      });
      getIndice('generos').then((data) => {
        this.generos = data;
      });
      this.render();
    }
  },
  onSelectIndice(e) {
    const indice = $(e.currentTarget).data('indice');
    this.indice = indice;
    this.selectedIndice = this.indicesArray[indice];
    this.indicesDropdown = false;
    if (this.indice !== 'articulos') {
      this.$el.addClass('extended');
    } else {
      this.$el.removeClass('extended');
    }
    this.render();
  },
  onIndicesDropdown() {
    this.indicesDropdown = !this.indicesDropdown;
    this.render();
  },
  addImages() {
    const jsonModel = this.formModel.toJSON();
    let prop;
    let thisThumb;
    for (prop in jsonModel) {
      if (jsonModel.hasOwnProperty(prop)) {
        if ((/IMAGEN\d+\_THUMB/).test(prop)) {
          thisThumb = jsonModel[prop];
          this.$('.thumbs-place').append('<img src=\'' + thisThumb + '\'>');
        }
      }
    }
  },

  upload() {
    if (!userModel.get('uid')) {
      return;
    }
    this.clearArea();

    this.showEmojisIn(false);
    const self = this;
    const data = new FormData();
    let imagenes_jump = 0;

    Object.keys(this.formModel.toJSON()).forEach((key) => {
      if ((/IMAGEN(\d+)_URL/).exec(key)) {
        const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        if ((Number(image) + 1) > imagenes_jump) {
          imagenes_jump = Number(image) + 1;
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
        if (data.response && data.response.Ficheros && self.formModel.get('Ficheros')) {
          data.response.Ficheros = self.formModel.get('Ficheros') + ',' + data.response.Ficheros;
        }
        self.formModel.set(data.response);
        self.addImages();
      },
    });
  },
  setComments() {
    if (this.$('.formularioTextArea').length) {
      this.formModel.set('comments', this.$('.formularioTextArea').html());
    }
  },

  onPaste(e) {
    function replaceStyleAttr(str) {
      return str.replace(/(<[\w\W]*?)(style)([\w\W]*?>)/g, function (a, b, c, d) {
        return b + 'style_replace' + d;
      });
    }

    function removeTagsExcludeA(str) {
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

  deleteTag(e) {
    const tag = this.$(e.currentTarget).data('delete-tag');
    const tags = this.formModel.get('tags').split(',');

    let newTags = '';
    for (let i = 0; i < tags.length; ++i) {
      if (i != tag) {
        if (newTags.length > 0) {
          newTags = newTags + ',';
        }
        newTags = newTags + tags[i];
      }
    }
    this.setComments();
    this.formModel.set({
      tags: newTags,
    });
  },
  inputTag(e) {
    e.preventDefault();
    if (e.target.value && e.target.value.length > 10) {
      e.target.value = e.target.value.substring(0, 10);
    }
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.target.value = e.target.value.replace(/\W/ig, '');
      let newTag = e.target.value.replace(/\W/ig, '');
      if (newTag && newTag.length > 2) {
        newTag = '#' + newTag;
        let tags = this.formModel.get('tags') ? this.formModel.get('tags').split(',') : [];
        tags.push(newTag);
        tags = _.uniq(tags);
        this.setComments();
        this.formModel.set({
          tags: _.join(tags, ','),
        });
        this.$('.input-tag').focus();
      }
    } else {
      e.target.value = e.target.value.replace(/\W/ig, '');
    }
  },
  toggleTags() {
    this.showEmojisIn(false);
    this.tagPlaceShown = !this.tagPlaceShown;
    this.toggleTagsIn(this.tagPlaceShown);
  },
  toggleTagsIn(prev) {
    if (prev) {
      this.$el.find('.tags-place ul').show('slow');
    } else {
      this.$el.find('.tags-place ul').hide('slow');
    }
    if (prev) {
      // this.materialDesignUpdate();
      // componentHandler.upgradeElement(this.$el.find('.mdl-js-textfield')[0]);
    }
    this.tagPlaceShown = prev;
  },
  showEmojisIn(prev) {
    if (prev) {
      this.$('.emojis-modal-place').show('slow');
      EmojisModal.setParent(this);
      this.$('.emojis-modal-place').html(EmojisModal.render().el);
    } else {
      this.$('.emojis-modal-place').hide('slow');
    }
    this.showEmojisModal = prev;
  },
  showEmojis() {
    this.toggleTagsIn(false);
    if (EmojisModal.parent && EmojisModal.parent.cid !== this.cid) {
      this.showEmojisModal = false;
    }
    this.showEmojisModal = !this.showEmojisModal;
    this.showEmojisIn(this.showEmojisModal);
  },
  getEmoji(string) {
    this.clearArea();
    if (this.currentPosition) {
      this.restoreSelection(this.currentPosition);
      this.insertTextAtCursor(string);
    } else {
      this.$('.formularioTextArea').append(string);
    }
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

    if (res && res.commonAncestorContainer.className && !res.commonAncestorContainer.className.match(/formularioTextArea/)) {
      res = null;
    }
    if (res && !res.commonAncestorContainer.className && res.commonAncestorContainer.parentNode && !res.commonAncestorContainer.parentNode.className.match(/formularioTextArea/)) {
      res = null;
    }
    return res;

  },
  insertTextAtCursor(element) {
    let sel, range;
    if (!elementContainsSelection(this.$('.formularioTextArea')[0])) {
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
          while ((node = el.firstChild)) {
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
  getSelectedText(e) {
    let selection;
    if (e.keyCode == 32 || e.keyCode == 13) {
      // this.getCaptureUrls();
    }
    // console.log(e.keyCode);
    //Get the selected stuff
    this.currentPosition = this.saveSelection();

    if (window.getSelection) {
      selection = window.getSelection();
    } else if (typeof document.selection != 'undefined') {
      selection = document.selection;
    }
    if ((typeof selection === 'undefined') || (selection.toString().length < 1)) {
      this.$('.wysiwyg').hide();
      return;
    }

    //Get a the selected content, in a range object
    const range = selection.getRangeAt(0);

    //If the range spans some text, and inside a tag, set its css class.
    if (range && !selection.isCollapsed) { // range da la posicion sin contar el scroll
      this.$('.wysiwyg').show().css({
        top: (range.getBoundingClientRect().top + $(window).scrollTop() - this.$('.formularioTextArea').first().offset().top) + 'px',
        left: (range.getBoundingClientRect().left - this.$('.formularioTextArea').first().offset().left) + 'px',
      });
    } else if (selection.isCollapsed) {
      this.$('.wysiwyg').hide();
    }
  },
  submitPost() {
    let wait = 0;
    let countWait = 0;
    const runPost = _.throttle(this.submitPostThrottle.bind(this), 1000);
    const waiting = (callback, wait) => {
      setTimeout(() => {
        // console.log('countWait', countWait, wait);
        if (!this.capturingUrls || (countWait > 4)) {
          callback();
        } else {
          waiting(callback, wait);
        }
        countWait++;
      }, wait);
    };
    if (this.capturingUrls) {
      wait = 1000;
    }
    waiting(runPost, wait);
  },
  submitPostThrottle() {
    if (!userModel.get('uid')) {
      return;
    }
    if (this.isSaving) {
      return;
    }
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

    if (comments.length < 1) {
      return;
    }
    const saveObj = {
      comments,
      uid: userModel.get('uid'),
      indice: this.indice,
    };


    this.isSaving = true;
    this.formModel.save(
      saveObj, {
      success(model, data) {
        self.isSaving = false;
        self.formModel.clear();
        self.active = false;
        self.$el.removeClass('extended');
        self.render();
        self.capturedUrls = {};
        self.removedCapturedUrls = {};
        // self.render();
        // const newMsg = Object.assign(data.mensaje, { indice: data.mensaje.INDICE });
        // const msgModel = new EntradaModel(newMsg);
        // self.collection.add(msgModel, {
        //   merge: true,
        //   individual: true,
        // });
        self.collection.resetFirstEntry();
        self.collection.reset();
        self.collection.fetch();
        // console.log('success', data);
      },
      error(data) {
        console.log('error', data);
      },
    }
    );
  },
  clearArea() {
    const self = this;
    if (this.active) {
      return;
    }
    this.active = true;
    $(document).on('click.showFormView', ({
      target,
    }) => {
      // e.stopPropagation();
      // e.preventDefault();
      const container = $('.main-form').first();
      let check = false;
      $(target).parents().each(function () {
        if ($(this).hasClass('main-form')) {
          check = true;
          return false;
        }
      });
      try {
        if (check || !target || !container || container.is(target) ||
          $.contains(container[0], target) ||
          container.has(target).length !== 0 ||
          $(target).hasClass('formulario-inactivo') ||
          $(target).parent().hasClass('formulario-inactivo')) {

          } else {
          self.active = false;
          self.$el.removeClass('extended');
          self.render();
          $(document).off('click.showFormView');
        }  
      } catch (error) {
        self.active = false;
        self.$el.removeClass('extended');
        self.render();
        $(document).off('click.showFormView');
        console.log(error);
      }
    });
    this.render();
    this.$('#comments').focus();


  },
  render() {
    if (userModel.get('uid')) {
      this.setComments();
      this.$el.html(this.template(this.serializer()));
      this.$el.addClass('active');
      if (this.indice !== 'articulos') {
        this.$el.addClass('extended');
      } else {
        this.$el.removeClass('extended');
      }
      if (this.active) {
        this.$el.addClass('on');
      } else {
        this.$el.removeClass('on');
      }
      this.$('.wysiwyg-view').html(this.wysiwyg.render().el);

      if (this.afterRender && typeof this.afterRender === 'function') {
        this.afterRender.apply(this);
      }
      this.showEmojisIn(this.showEmojisModal);
      this.toggleTagsIn(this.tagPlaceShown);
    } else {
      this.$el.html(this.template(this.serializer()));
      this.$el.removeClass('active');
    }
    this.delegateEvents();
    return this;
  },
  afterRender() {
    this.$('.wysiwyg').hide();
    this.materialDesignUpdate();

    this.$('#comments').keyup(function () {
      $(this).height(38);
      $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    });
  },
  materialDesignUpdate() {
    const self = this;
    _.defer(() => {
      if (self && self.$el) {
        self.$el.find('[class*=" mdl-js"]').each(function () {
          componentHandler.upgradeElement(this);
        });
      }
    });
  },
  serializer() {
    const obj = userModel.toJSON();
    let titulo_head;
    if (this.parentModel && this.parentModel.get('ID')) {
      Object.assign(obj, {
        parentModel: this.parentModel.toJSON(),
      });
    }
    Object.assign(obj, {
      emojis: emojione.toImage(':smile:'),
      formModel: this.formModel.toJSON(),
      tags: this.formModel.get('tags') ? this.formModel.get('tags').split(',') : null,
      tagPlaceShown: this.tagPlaceShown,
      active: this.active,
      titulo_head,
      indicesDropdown: this.indicesDropdown,
      selectedIndice: this.selectedIndice,
      indicesArray: this.indicesArray,
      paises: this.paises,
      indice: this.indice,
      generos: this.generos,
      formatos: this.formatos,
      advanced: this.advanced,
    });
    return obj;
  },
});