import _ from 'lodash';
import $ from 'jquery';
import userModel from '../../models/userModel';
import Cookies from 'js-cookie';
import loadFBSDK from 'facebook-sdk-promise';
import endpoints from '../../util/endpoints';

const faceb = () => {};

faceb.prototype = {
  initialize() {
    // FB.getLoginStatus(function (response) {
    //     self.statusChangeCallback(response);
    // });
    loadFBSDK().then(FB => {
      FB.Event.subscribe('auth.authResponseChange', _.bind(this.statusChangeCallback, this));
    });
  },
  statusChangeCallback(response) {
    function dLogin(data) {
      if (!data.email) {
        console.log('No tengo email');
      }
      console.log('dLogin');
      if (!userModel.get('uid')) {
        const email = data.email,
          payload = {
            email,
            access_token: FB.getAuthResponse().accessToken,
            FBuserID: FB.getAuthResponse().userID,
            FBuser: data,
          };
        $.ajax({
          url: endpoints.apiUrl + 'emaillogin.cgi',
          dataType: 'json',
          type: 'POST',
          data: payload,
          success(res) {
            console.log('Respuesta de dreamers', res);
            userModel.set(res.user);
            userModel.set('uid', res.uid);
            Cookies.set('city', {
              uid: res.uid,
            });
          },
        });
      }
    }
    console.log('response', response);
    if (response.status === 'connected') {
      FB.api('/me?fields=id,email,name,first_name,last_name,languages,picture{url},name_format', response => {
        console.log('Good to see you, ' + response.name + '.', response);
        FB.api('/me/picture?width=100&height=100', res => {
          _.extend(response, {
            imgUrl: res.data.url,
          });
          dLogin(response);
        });
      });
    } else if (response.status === 'not_authorized') {
      console.log('not_authorized');
      // self.fBlogin();
    } else {
      console.log('not logged');
      // self.fBlogin();
    }
  },
};

export default faceb;
