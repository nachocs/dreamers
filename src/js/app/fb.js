
// import FB from 'facebook';
import config from './config';
import $ from 'jquery';

export default {
  init({userModel}) {
    const self = this;
    this.userModel = userModel;
    FB.init({
      appId: '153536311459672', // App ID
      channelUrl: 'channel.html', // Channel File
      status: true, // check login status
      cookie: true, // enable cookies to allow the server to access the session
      xfbml: true, // parse XFBML
    });

    // Additional init code here

    this.FBlogin = () => {
      FB.login(response => {
        console.log('fb login response', response);
      }, {
        scope: 'email,publish_actions,user_birthday',
      });
    };

    this.Dlogin = data => {
      const email = data.email;
      $.ajax({
        url: config.emailLoginCgi,
        dataType: 'json',
        type: 'POST',
        data: {
          email,
          access_token: FB.getAuthResponse().accessToken,
          FBuserID: FB.getAuthResponse().userID,
          FBuser: data,
        },
        success(res) {
          console.log('Respuesta de dreamers', res);
          self.userModel.set(res.user);
          self.userModel.set('sessionId', res.uid);
          // $D.user = $D.user || {};
          // $D.user.sessionId = res.uid;
          self.displayLogin(res);
          //  self.FBpost();
        },
      });
    };

    this.displayLogin = data => {
      console.log('data', data);
      //      $('#loginPlace').html(data.user.alias_principal);
    };

    this.FBpost = () => {
      // const obj = {
      //   message: 'test message',
      // };
      FB.api(
        'me/feed',
        'post', {
          message: 'test message',
          picture: 'http://dreamers.com/imagenes/rotulin.gif',
          link: 'http://dreamers.com',
          name: 'dreamers test post',
          privacy: {
            'value': 'SELF',
          },
        },
        response => {
          if (!response) {
            alert('Error occurred.');
          } else if (response.error) {
            console.log('error', response.error.message);
          } else {
            console.log('success', response.id);
          }
        }
      );
    };

    // Here we subscribe to the auth.authResponseChange JavaScript event. This event is fired
    // for any authentication related change, such as login, logout or session refresh. This means that
    // whenever someone who was previously logged out tries to log in again, the correct case below
    // will be handled.
    FB.Event.subscribe('auth.authResponseChange', response => {
      console.log('response', response);
      // Here we specify what we do with the response anytime this event occurs.
      if (response.status === 'connected') {
        // The response object is returned with a status field that lets the app know the current
        // login status of the person. In this case, we're handling the situation where they
        // have logged in to the app.
        $('#FB_login').hide();
        FB.api('/me', response => {
          console.log(`Good to see you, ${response.name}.`, response);
          self.Dlogin(response);

        });
      } else if (response.status === 'not_authorized') {
        // In this case, the person is logged into Facebook, but not into the app, so we call
        // FB.login() to prompt them to do so.
        // In real-life usage, you wouldn't want to immediately prompt someone to login
        // like this, for two reasons:
        // (1) JavaScript created popup windows are blocked by most browsers unless they
        // result from direct interaction from people using the app (such as a mouse click)
        // (2) it is a bad experience to be continually prompted to login upon page load.
        self.FBlogin();
      } else {
        // In this case, the person is not logged into Facebook, so we call the login()
        // function to prompt them to do so. Note that at this stage there is no indication
        // of whether they are logged into the app. If they aren't then they'll see the Login
        // dialog right after they log in to Facebook.
        // The same caveats as above apply to the FB.login() call here.
        self.FBlogin();
      }
    });
    $(document).on('click', '#FB_login', () => {
      self.FBlogin();
    });


  },

};
