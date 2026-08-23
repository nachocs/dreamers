import _ from 'lodash';
import template from './displayImage.html';
import template2 from './displayImage2.html';
import templateCapturedUrl from './displayCapturedUrl.html';
import $ from 'jquery';

class Util{
  constructor(){
    this.template = _.template(template);
    this.template2 = _.template(template2);
    this.templateCapturedUrl = _.template(templateCapturedUrl);
  }
  displayImage(obj, image){
    return this.template(Object.assign({}, obj, {image}));
  }
  displayImage2(obj, image){
    return this.template2(Object.assign({}, obj, {image}));
  }
  // Reemplaza a moment.unix(x).fromNow() (locale 'es'), que solo se usaba
  // aqui: 177KB en el bundle para una sola llamada. Mismos umbrales que
  // usa moment por defecto (ss:44, s:45, m:45, h:22, d:26, M:11) y mismas
  // cadenas del locale es.js, asi que el texto que ve el usuario no cambia.
  hace(unixSeconds){
    const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
    const minutes = Math.round(diffSeconds / 60);
    const hours = Math.round(diffSeconds / 3600);
    const days = Math.round(diffSeconds / 86400);
    const months = Math.round(diffSeconds / (86400 * 30.436875));
    const years = Math.round(diffSeconds / (86400 * 365.25));

    if (diffSeconds < 45) return 'hace unos segundos';
    if (minutes <= 1) return 'hace un minuto';
    if (minutes < 45) return `hace ${minutes} minutos`;
    if (hours <= 1) return 'hace una hora';
    if (hours < 22) return `hace ${hours} horas`;
    if (days <= 1) return 'hace un día';
    if (days < 26) return `hace ${days} días`;
    if (months <= 1) return 'hace un mes';
    if (months < 11) return `hace ${months} meses`;
    if (years <= 1) return 'hace un año';
    return `hace ${years} años`;
  }
  displayCapturedUrl(obj){
    let tmpl = this.templateCapturedUrl(obj);
    tmpl = tmpl.replace(/\n/g, '');
    tmpl = tmpl.replace(/\r/g, '');
    tmpl = tmpl.replace(/\cM/g, '');
    return tmpl;
  }
  bookmarkthis(quin, href, title) {
    let url;
    let specs = 'width=450, height=250';
    switch (quin) {
      case 'facebook':
        url = 'http://www.facebook.com/sharer.php?u=' + href + '&t=' + title;
        break;
      case 'twitter':
        url = 'http://twitter.com/home?status=' + href;
        break;
      case 'webeame':
        url = 'http://www.webeame.net/submit.php?url=' + href;
        break;
      case 'meneame':
        url = 'http://meneame.net/submit.php?url=' + href;
        break;
      case 'stumbleupon':
        url = 'http://www.stumbleupon.com/submit?url=' + href;
        break;
      case 'delicious':
        url = 'http://del.icio.us/post?url=' + href + '&title=' + title;
        break;
      case 'wong':
        url = 'http://www.mister-wong.es/index.php?action=addurl&bm_url=' + href + '&bm_description=' + title;
        break;

      case 'digg':
        url = 'http://digg.com/submit?phase=2&url=' + href;
        break;
      case 'technorati':
        url = 'http://technorati.com/faves?add=' + href + '&t=' + title;
        break;
      case 'blinklist':
        url = 'http://blinklist.com/index.php?Action=Blink/addblink.php&url=' + href + '&Title=' + title;
        break;
      case 'furl':
        url = 'http://furl.net/storeIt.jsp?u=' + href + '&t=' + title;
        break;
      case 'reddit':
        url = 'http://reddit.com/submit?url=' + href + '&title=' + title;
        break;

      case 'slashdot':
        url = 'http://slashdot.org/bookmark.pl?url=' + href + '&title=' + title;
        break;
      case 'newsvine':
        url = 'http://www.newsvine.com/_tools/seed&save?u=' + href + '&h=' + title;
        break;

      case 'google':
        url = 'http://www.google.com/bookmarks/mark?op=edit&bkmk=' + href + '&title=' + title;
        break;

      case 'yahoo':
        url = 'http://bookmarks.yahoo.com/myresults/bookmarklet?u=' + href;
        break;

      case 'fresqui':
        url = 'http://tec.fresqui.com/post?url=' + href;
        break;

      case 'barrapunto':
        url = 'http://barrapunto.com/submit.pl?story=' + href + '&subj=' + title;
        break;

      case 'myspace':
        url = 'http://www.myspace.com/Modules/PostTo/Pages/?u=' + href;
        break;

      case 'printer':
        url = 'javascript:window.print();';
        break;

      case 'email_link':
        url = 'mailto:?subject=' + title + '&body=' + href;
        specs = '';
        break;

    }
    window.open(url, '', specs);
  }
  checkForms(success, error){
    let check = true;
    $('.formularioTextArea').each((index, el)=>{
      if ($(el).html().length>0 && check){
        const currentScrollTop = $('body').scrollTop();
        const go = confirm('Tienes un mensaje pendiente de enviar.\n ¿Continuar y descartar mensaje?');
        if (go){
          success();
        } else {
          if (error){
            error();
            setTimeout(()=>{
              $('body').scrollTop(currentScrollTop);
            },0);
          }
        }
        check = false;
      }
    });
    if (check){
      success();
    }
  }

};

export default new Util();
