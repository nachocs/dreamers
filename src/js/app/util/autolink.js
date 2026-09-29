// autolinker pesa ~19 KB gzip y solo hace falta al pintar comentarios, asi que
// va en su propio chunk. link() es sincrono, y por eso se sirve en dos tiempos:
// mientras el chunk no ha llegado devuelve el texto tal cual, y quien llama
// puede pedir `loadAutolinker()` para repintar cuando este listo.
const youtube_parser = url => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
    match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
};

let instance = null;
let loading = null;

export const loadAutolinker = () => {
  if (!loading) {
    loading = import(/* webpackChunkName: "autolinker", webpackPrefetch: true */ 'autolinker').then(({ default: Autolinker }) => {
      instance = new Autolinker({
        replaceFn (match) {
          if (match.getType() === 'url') {
            if ((match.getUrl().indexOf('youtube.com') > 0) || (match.getUrl().indexOf('youtu.be') > 0)) {
              const youtubeId = youtube_parser(match.getUrl());
              return `<div class="videodelimitador"><div class="videocontenedor"><iframe src="//www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen=""></iframe></div></div>`;
            }
          } else {
            return;
          }
        },
      });
      return instance;
    }).catch(err => {
      // Si el chunk falla (red, despliegue nuevo), el siguiente intento reintenta.
      loading = null;
      throw err;
    });
  }
  return loading;
};

// Lo minimo que Autolinker podria convertir en enlace: url, www, correo o dominio.
export const mayHaveLinks = text => /https?:|www\.|@|\.[a-z]{2,}/i.test(text);

export const isReady = () => instance !== null;

export const autolink = text => (instance ? instance.link(text) : text);
