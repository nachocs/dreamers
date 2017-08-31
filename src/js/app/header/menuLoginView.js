import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import $D from '../app';
import template from './menuLoginView.html';

export default Backbone.View.extend({
  id: 'menuLogin',
  template: _.template(template),
  initialize() {
    _.bindAll(this);
  },
  events: {
    'click #loginSubmit': 'submit',
  },
  submit() {
    const alias = this.$('#loginAlias').val();
    const pass = this.$('#loginPassword').val();
    if((alias.length < 1) || (pass.length < 1)){alert('te olvidaste de poner algo');}
    else{
      $.ajax({
        type: 'POST',
        url: $D.loginCgi,
        data: {
          alias,
          password: pass,
        },
        success({status}) {
          if (status !== 'ok'){
            alert(status);
          }
        },
      });
    }
  },
  render() {
    this.el.innerHTML = this.template();

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender.apply(this);
    }
    return this;
  },
  afterRender() {
  },
});
