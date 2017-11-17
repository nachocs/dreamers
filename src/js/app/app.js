// /*global $D*/
/*jslint browser: true*/

import Backbone from 'backbone';
import DHome from './router';
import userModel from './models/userModel';
import moment from 'moment';
moment.locale('es');

const App = new DHome({
  userModel,
});
Backbone.history.start();
// $('.titular').click(ev => {
//   $D.App.libraryView.muestraIndice(ev);
// });
export default App;
