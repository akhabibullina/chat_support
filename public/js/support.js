$(document).ready(function () {

   "use strict";
   var $uwc = $('#uwc');
   var $mouseMoved = false;
   var $mouseX = -1;
   var $mouseY = -1;
   var $remoteDesktopView;

   var $supportChatDialogTitle = 'Support form';

   var $supportChatDialogOptions = {
      title: $supportChatDialogTitle,
      position: 'center center',
      height: 410,
      width: 450
   };

   /**
    * ===================== Body comes below. =====================================================
    */

   $uwc.chat(); // Initialize Chat plugin.
   drawSupportChatView();
   $uwc.chat('handleSupportIO');
   catchMouse();
//   setTimeout(sendMouseMove, 100);

   /**
    * Send message on submit or ENTER press
    */
   $('#uwc-chat-window-dialog.ui-dialog textarea').keypress(function (event) {
      if (event.which === 13) {
         $uwc.chat('handleMessageOnSubmit');
      }
   });

   $('#uwc-chat-window-dialog.ui-dialog .primary').click(function () {
      $uwc.chat('handleMessageOnSubmit');
   });

   /**
    * Creates a part of DOM for support's chat box.
    */
   function drawSupportChatView () {
      $uwc.chat('drawChatBox', $supportChatDialogOptions);

      var $uwcChatWindow = $('#uwc-chat-window');
      // No way support will ever be so rude to close the chat.
      $uwcChatWindow.parent()
                    .find('.ui-dialog-titlebar-close')
                    .hide();
      $uwcChatWindow.find('#name')
                    .val('support');
   }

   /**
    * ===================== View Port & Remote Desktop logic-related functions. ======================================
    */

   /**
    * Mouse move handler. Catches the most general events such as click, mousemove etc.
    */
   function catchMouse() {
      $remoteDesktopView = $('#view-port');

      $remoteDesktopView.mousedown(function (e) {
         handleEvent(e);
      });
      

      $remoteDesktopView.mouseup(function (e) {
         handleEvent(e);
      });

      $remoteDesktopView.mousemove(function (e) {
         if (($mouseX != e.pageX) || ($mouseY != e.pageY)) {
            $mouseX = e.pageX;
            $mouseY = e.pageY;
            $mouseMoved = true
         }
      });

      $remoteDesktopView.click(function (e) {
         handleEvent(e);
      });
}

   /**
    * Prepares and send event data.
    * @param e An event fired.
    */
   function handleEvent(e) {
      sendMouse(e.pageX, e.pageY, e.type);
      e.stopPropagation();
      e.preventDefault();
   }

   /**
    * Throws a request to send an appropriate message when event is fired.
    * @param x The height point of mouse position on the page
    * @param y The width point of mouse position on the page
    * @param action The type of event to process. Examples: click, mousemove etc
    */
   function sendMouse(x, y, action) {
      $remoteDesktopView = document.getElementById('view-port');
      $uwc.chat('emitMouseMoveMessage', x - getIntendX(), y - getIntendY(), action);
   }

   /**
    * Since view port has intendions when being displayed on support,
    * we need to fetch x- and y- margins in order to get pure measurements later.
    */
   function getIntendX () {
      return $remoteDesktopView.offsetLeft;
   }

   function getIntendY () {
      return $remoteDesktopView.offsetTop;
   }
});