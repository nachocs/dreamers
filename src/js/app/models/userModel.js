import Backbone from 'backbone';

const UserModel = Backbone.Model.extend({
  idAttribute: 'ID',
  url() {
  },
  defaults: {
  },
  initialize() {
  },
});
const userModel = new UserModel();
export default userModel;
