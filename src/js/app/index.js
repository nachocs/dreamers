// Ya no se carga babel-polyfill (core-js 2, sin mantenimiento desde 2019):
// el objetivo de navegadores declarado en 'browserslist' trae Promise,
// Object.assign y fetch de serie, asi que solo anadia peso.
import App from './app';
import loadFBSDK from 'facebook-sdk-promise';
// loadFBSDK.logging.on();

// import * as OfflinePluginRuntime from 'offline-plugin/runtime';
// if (process.env.NODE_ENV === 'production') {
//   OfflinePluginRuntime.install();
// }

loadFBSDK().then(FB => {
  FB.init({
    appId: '153536311459672',
    cookie: true, // enable cookies to allow the server to access
    // the session
    xfbml: true, // parse social plugins on this page
    version: 'v2.11', // use graph api version 2.5
    status: true,
  });

  // $(function () {
  //   App.initialize();
  // });
  // app.initialize();
});

export default App;