import emojiJson from '../../../assets/emoji_short.json';
import _ from 'lodash';
import emojione from 'emojione';

class Emojis {
  constructor() {
    this.emojiList = {};
    _.forOwn(emojiJson, (value, key) => {
      if (!this.emojiList[value.category]) {
        this.emojiList[value.category] = [];
      }
      this.emojiList[value.category].push({
        unicode: value.unicode,
        shortname: value.shortname,
        name: key,
        aliases_ascii: value.aliases_ascii,
        img: emojione.toImage(value.shortname, ),
      });
    });
  }
  get emojis() {
    return this.emojiList;
  }
}

const emojis = new Emojis();
export default emojis;