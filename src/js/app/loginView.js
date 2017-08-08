import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';
import template from './loginView.html';
import FbView from './fbView';
import Cookies from 'js-cookie';
import $D from './app';

export default Backbone.View.extend({
  id: 'loginPlace',
  className: 'login-view',
  template: _.template(template),
  initialize({userModel}) {
    _.bindAll(this);
    this.model = userModel;
    this.fbView = new FbView();
    this.fbView.initialize();
    this.listenTo(this.model, 'change', this.render.bind(this));
  },
  events: {
    'click #loginSubmit': 'submit',
    'click input'(e) {
      e.preventDefault();
      e.stopPropagation();
    },
    'click .login-menu-button': 'openMenu',
    'click .fb-login': 'fBlogin',
    'click .js-logout': 'logOut',
  },
  logOut(){
    Cookies.set('city', null);
    this.model.clear();
    FB.logout();
  },
  fBlogin() {
    FB.login(response => {
      console.log('fb login response', response);
    }, {
      scope: 'public_profile,email',
    });
  },

  openMenu() {
    this.$('.login-menu').toggleClass('hidden');

  },
  checkCookie(){
    let obj = {};
    const cookie = Cookies.get('city');
    if (cookie){
      try{
        obj = JSON.parse(cookie);
      }
      catch(e){
        console.log('cookie', cookie);
        if (cookie.match(/^uid\:\:(.+)/)){
          obj = {
            uid: cookie.match(/^uid\:\:(.*)/)[1],
          };
        } else {
          return;
        }
      }
      if (obj && obj.uid){
        this.loginCall(obj);
      }
    }
  },
  loginCall(data){
    const self = this;
    $.ajax({
      type: 'POST',
      url: $D.loginCgi,
      data,
      success(data) {
        if (data.status !== 'ok') {
          self.showError('no tira');
          console.log('error: ', data.status);
          Cookies.set('city', null);
        } else {
          self.model.set(data.user);
          Cookies.set('city', {
            uid: data.uid,
          });
        }
      },
    });
  },
  submit(e) {
    e.preventDefault();
    const alias = this.$('#loginAlias').val(),
      password = this.$('#loginPassword').val();
    if ((alias.length < 1) || (password.length < 1)) {
      console.log('te olvidaste de poner algo'); // TODO
    } else {
      // mockup
      this.loginCall({
        alias,
        password,
      });
    }
  },
  showError(error){
    this.$('.error-login').html(error).addClass('active');
  },
  render() {
    this.$el.html(this.template(this.model.toJSON()));
    //	$('#loginPlace').html(this.el);
    this.delegateEvents();

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender.apply(this);
    }
    return this;
  },
  afterRender() {
  },
});
