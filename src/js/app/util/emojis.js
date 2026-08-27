import emojiJson from '../../../assets/emoji_short.json';
import _ from 'lodash';
import { emojiImg } from './emojiImg.mjs';

class Emojis {
  constructor() {
    this.emojiList = {};
    // Indice por shortname, para que quien solo quiera un emoji suelto (las
    // barras de formulario piden ':smile:') no tenga que llevar su codepoint
    // a mano ni recorrer el catalogo entero.
    this.porShortname = {};
    _.forOwn(emojiJson, (value, key) => {
      if (!this.emojiList[value.category]) {
        this.emojiList[value.category] = [];
      }
      const img = emojiImg(value.unicode, value.shortname);
      this.emojiList[value.category].push({
        unicode: value.unicode,
        shortname: value.shortname,
        name: key,
        aliases_ascii: value.aliases_ascii,
        img,
      });
      this.porShortname[value.shortname] = img;
    });
  }
  get emojis() {
    return this.emojiList;
  }
  /** El <img> de un emoji por su shortname, o cadena vacia si no esta. */
  img(shortname) {
    return this.porShortname[shortname] || '';
  }
}

const emojis = new Emojis();
export default emojis;