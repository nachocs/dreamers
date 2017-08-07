import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import FormModel from './formModel';
import Wysiwyg from './Wysiwyg';
import template from './formView.html';
export default Backbone.View.extend({
  id: 'formPlace',
  template: _.template(template),
  initialize({collection, userModel}) {
    _.bindAll(this);
    this.formModel = new FormModel();
    this.collection = collection;
    this.model = userModel;
    this.model.bind('change', this.render);

  },
  events: {
    'click #comments': 'clearArea',
    'click .form-submit': 'submitPost',
    'mouseup': 'getSelectedText',
    'mousedown': 'getSelectedText',
    'keyup': 'getSelectedText',
    'keydown': 'getSelectedText',
    'change #file-submit': 'upload',
  },
  addImages() {
    const jsonModel = this.formModel.toJSON();
    let prop;
    let thisThumb;
    for (prop in jsonModel) {
      if (jsonModel.hasOwnProperty(prop)) {
        if ((/IMAGEN\d+\_THUMB/).test(prop)) {
          thisThumb = jsonModel[prop];
          $('#comments').append(`<img src='${thisThumb}'>`);
        }
      }
    }
  },
  upload() {
    this.clearArea();
    const self = this, data = new FormData();
    $.each($('#file-submit')[0].files, (i, file) => {
      data.append(`FICHERO_IMAGEN${i}`, file);
    });
    $.ajax({
      url: `cgi/upload.cgi?sessionId=${this.model.get('sessionId')}`,
      data,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      success(data) {
        console.log('UPLOAD RESPONSE: ', data);
        self.formModel.set(data.response);
        self.addImages();
      },
    });
  },
  getSelectedText() {
    let selection;

    //Get the selected stuff
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.selection !== undefined) {
      selection = document.selection;
    }
    if ((selection === undefined) || (selection.toString().length < 1)) {
      this.$('.wysiwyg').hide();
      return;
    }

    //Get a the selected content, in a range object
    const range = selection.getRangeAt(0);

    //If the range spans some text, and inside a tag, set its css class.
    if (range && !selection.isCollapsed) {
      this.$('.wysiwyg').show().offset({
        top: range.getBoundingClientRect().top - 22,
        left: range.getBoundingClientRect().left,
      });
    } else if (selection.isCollapsed) {
      this.$('.wysiwyg').hide();
    }
  },
  submitPost() {
    const self = this;
    let comments = this.$('#comments').html();
    comments = comments.replace(/\n/ig, '<br>');
    comments = comments.replace(/\r/ig, '<br>');
    this.formModel.save({
      comments,
      'sessionId': this.model.get('sessionId'),
    }, {
      success(data) {
        self.formModel.clear();
        self.isClear = false;
        self.render();
        self.collection.reload();
        console.log('success', data);
      },
      error(data) {
        console.log('error', data);
      },
    });
  },
  clearArea() {
    const self = this;
    if (this.isClear) {
      return;
    }
    this.$('#comments').addClass('on');
    if (this.$('#comments').html() === 'share your thoughts') {
      this.$('#comments').html('');
    }
    this.$('#formulario').removeClass('off').addClass('on');
    this.isClear = true;
    $(document).on('click.showFormView', ({target}) => {
      // e.stopPropagation();
      // e.preventDefault();
      const container = $('#formulario');

      if (!container.is(target) && container.has(target).length === 0) {
        self.$('#comments').removeClass('on');
        if (self.$('#comments').html() === '') {
          self.$('#comments').html('share your thoughts');
        }
        self.$('#formulario').addClass('off').removeClass('on');
        self.isClear = false;

        $(document).off('click.showFormView');
      }
    });
    // tinymce.init({
    //     selector: 'textarea',
    //     plugins: [
    //         'advlist autolink lists link image charmap print preview anchor',
    //         'code emoticons textcolor',
    //         'table contextmenu paste'
    //     ],
    //     toolbar: 'preview | undo redo | bold italic fontselect fontsizeselect | alignleft aligncenter alignright alignjustify | table bullist numlist outdent indent | link image | emoticons forecolor backcolor',
    //     menubar: false,
    //     statusbar: false,
    //     toolbar_items_size: 'small',
    //     auto_focus: 'formulario',
    //     object_resizing : false,
    //     convert_fonts_to_spans : true,
    //     fontsize_formats: '8pt 10pt 12pt 14pt 18pt',
    //     entity_encoding : 'raw'
    // });
  },
  render() {
    this.el.innerHTML = this.template(this.model.toJSON());

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    return this;
  },
  afterRender() {
    const wysiwyg = new Wysiwyg();
    wysiwyg.$el.insertBefore('#comments');
    this.$('.wysiwyg').hide();


    this.$('#comments').keyup(function () {
      $(this).height(38);
      $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    });
  },
});
