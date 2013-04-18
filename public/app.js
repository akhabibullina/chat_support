/**
 * The main purpose is to simplify client's work.
 * With current implementation client only needs to add app.js script on the page.
 * We will do the rest of the work.
 **/

(function (document, window) {
   "use strict";

   insertStyles();
   insertScripts();

   function insertScripts() {
      var scrStart = '<script type="text/javascript" src="', scrEnd = '"></script>';

      document.write(scrStart + 'js/lib/jquery.min.js' + scrEnd);
      document.write(scrStart + 'js/lib/jquery-ui/js/jquery-ui.min.js' + scrEnd);
      // capture screenshots
      document.write(scrStart + 'js/lib/html2canvas/src/plugins/jquery.plugin.html2canvas.js' + scrEnd);
      document.write(scrStart + 'js/lib/html2canvas/html2canvas.js' + scrEnd);
      // image shots diff to avoid sending the whole RD
      document.write(scrStart + 'js/lib/imagediff/imagediff.min.js' + scrEnd);
      document.write(scrStart + '/socket.io/socket.io.js' + scrEnd);
      document.write(scrStart + 'js/jquery.chat.js' + scrEnd);
      document.write(scrStart + 'js/client.js' + scrEnd);
   }

   function insertStyles() {
      var uwcStyleTag = document.createElement("link");
      uwcStyleTag.type = "text/css";
      uwcStyleTag.rel = "stylesheet";
      uwcStyleTag.href = "css/chat.css";
      document.getElementsByTagName("head")[0].appendChild(uwcStyleTag);

      var jqUIStyleTag = document.createElement("link");
      jqUIStyleTag.type = "text/css";
      jqUIStyleTag.rel = "stylesheet";
      jqUIStyleTag.href = "js/lib/jquery-ui/css/ui-lightness/jquery-ui.min.css";
      document.getElementsByTagName("head")[0].appendChild(jqUIStyleTag);
   }

}(document, window));