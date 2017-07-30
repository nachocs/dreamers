import 'babel-polyfill';
import App from './app';
import loadFBSDK from 'facebook-sdk-promise';

loadFBSDK().then(FB => {
  FB.init({
    appId: '153536311459672',
    cookie: true, // enable cookies to allow the server to access
    // the session
    xfbml: true, // parse social plugins on this page
    version: 'v2.7', // use graph api version 2.5
    status: true,
  });

  // $(function () {
  //   App.initialize();
  // });
  // app.initialize();
});

export default App;
