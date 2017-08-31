// http://maccman.github.io/wysiwyg/

import Backbone from 'backbone';

export default Backbone.View.extend({
  className : 'wysiwyg',
  initialize(){
    this.document = window.document;
    this.render();
  },
  events : {
    'click [data-type=bold]': 'bold',
    'click [data-type=italic]': 'italic',
    'click [data-type=list]': 'list',
    'click [data-type=link]': 'link',
    'click [data-type=h2]': 'h2',
    'click [data-type=h3]': 'h3',
    'click [data-type=XS]': 'XS',
    'click [data-type=spoiler]': 'spoiler',
    'click a': 'cancel',
  },
  render() {
    this.$el.empty();
    this.$el.append('<a href="#" data-type="bold" style="font-weight: bold;" title="bold">B</a>');
    this.$el.append('<a href="#" data-type="italic" style="font-style: italic;" title="italic">I</a>');
    this.$el.append('<a href="#" data-type="link" style="text-decoration: underline;" title="link">A</a>');
    this.$el.append('<a href="#" data-type="h2" title="large">XL</a>');
    this.$el.append('<a href="#" data-type="h3" title="medium">M</a>');
    this.$el.append('<a href="#" data-type="XS" title="medium">XS</a>');
    this.$el.append('<a href="#" data-type="spoiler" title="spoiler">SP</a>');
    this.delegateEvents();

    return this;
  },
  XS(e) {
    e.preventDefault();
    if (!this.selectTest()) {
      return;
    }
    return this.exec('fontSize', 1);
  },
  spoiler(e){
    e.preventDefault();
    if (!this.selectTest()) {
      return;
    }
    return this.exec('insertText', '-:SPOILER[' + this.getSelectedText() + ']SPOILER:-');
  },
  bold(e) {
    e.preventDefault();
    if (!this.selectTest()) {
      return;
    }
    return this.exec('bold');
  },

  italic(e) {
    e.preventDefault();
    if (!this.selectTest()) {
      return;
    }
    return this.exec('italic');
  },

  list(e) {
    e.preventDefault();
    return this.exec('insertUnorderedList');
  },

  link(e) {
    let href;

    e.preventDefault();
    if (!this.selectTest()) {
      return;
    }
    href = 'http://';
    const parentElement = window.getSelection().focusNode.parentElement;
    if (parentElement != null ? parentElement.href : void 0) {
      href = parentElement.href;
    }
    this.exec('unlink');
    href = prompt('Enter a link:', href);
    if (!href || href === 'http://') {
      return;
    }
    if (!/:\/\//.test(href)) {
      href = 'http://' + href;
    }
    return this.exec('createLink', href);
  },

  h2(e) {
    e.preventDefault();
    if (this.query('formatBlock') === 'h2') {
      return this.exec('formatBlock', 'p');
    } else {
      return this.exec('formatBlock', 'h2');
    }
  },

  h3(e) {
    e.preventDefault();
    if (this.query('formatBlock') === 'h3') {
      return this.exec('formatBlock', 'p');
    } else {
      return this.exec('formatBlock', 'h3');
    }
  },

  move(position) {
    return this.el.css(position);
  },

  cancel(e) {
    e.preventDefault();
    return e.stopImmediatePropagation();
  },

  getSelectedText() {
    let _ref;

    if ((_ref = this.document) != null ? _ref.selection : void 0) {
      return document.selection.createRange().text;
    } else if (this.document) {
      return document.getSelection().toString();
    }
  },

  selectTest() {
    if (this.getSelectedText().length === 0) {
      return false;
    }
    return true;
  },

  exec(type, arg) {
    if (arg == null) {
      arg = null;
    }
    return this.document.execCommand(type, false, arg);
  },

  query(type) {
    return this.document.queryCommandValue(type);
  },
});
