// /*global $D*/
/*jslint browser: true*/

const $D = window.$D || {};
import $ from 'jquery';
import Backbone from 'backbone';

import config from './config';
import DHome from './router';

import UserModel from './userModel';
const userModel = new UserModel();
import fbModule from './fb';

$D.userModel = userModel;

fbModule.init({
  userModel,
});

// $('body').append(templates);

/*\
* $D.provide
[ method ]
* Creates a namespace in the global
* $D namespace.
> Arguments
- ns (object) Object in which to create this namespace
- ns_string (string) Name for this namespace
> Usage
| $D.provide($D, 'app')
\*/
$D.provide = (ns, ns_string) => {
  let parts = ns_string.split('.'), parent = ns, i;
  if (parts[0] === '$B') {
    parts = parts.slice(1);
  }
  const pl = parts.length;
  for (i = 0; i < pl; i += 1) {
    if (parent[parts[i]] === 'undefined') {
      parent[parts[i]] = {};
    }
    parent = parent[parts[i]];
  }
  return parent;
};
$D.provide($D, 'App');
$D.path = config.path;
$D.loginCgi = config.loginCgi;
$D.init = {};
$D.indice = '';
$D.empieza = '';
$D.Loading = true;
$D.ancho = 178;
$D.init.ancho = $D.ancho;
$D.alto = 272;
$D.init.alto = $D.alto;
$D.espaciado = 20;
$D.matrix = [];
$D.SQanchoTotal = 2;

if ($(document).width() < (($D.ancho + 20) * 2)) {
  $D.ancho = $(document).width() / 2 - $D.espaciado * 2;
  $D.alto = $D.alto * ($D.ancho / $D.init.ancho);
} else {
  $D.ancho = $D.init.ancho;
  $D.alto = $D.init.alto;
}


// _.templateSettings = {
//     interpolate: /\{\{(.+?)\}\}/g,
//     evaluate: /\[\[(.+?)\]\]/g
// };


$D.Uroboro = ((() => {
  let UroboroCounter = 0;
  return {
    open() {
      UroboroCounter++;
      $('.uroboro').show();
    },
    close() {
      UroboroCounter--;
      if (UroboroCounter < 1) {
        $('.uroboro').hide();
      }
    },
  };
})());


$(() => {
  $D.App = new DHome({
    userModel,
  });
  Backbone.history.start();
  // $('body').on('click', '[data-indice]', function (ev) {
  //  $D.App.libraryView.muestraIndice(ev);
  // });
  $('.titular').click(ev => {
    $D.App.libraryView.muestraIndice(ev);
  });
});
export default $D;
