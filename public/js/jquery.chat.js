/** 
 * Chat plugin takes care of any general chat functionality such as socket.io, validation or message processing.
 */
(function ($) {

   "use strict";

   var $socket;
   var $isValidInput;
   var $host = 'http://localhost:8080';
   // Defines if support has already accepted client's request to start chat.
   var $supportAccepted = false;
   // Messages stored untill support accepts chat and then shown in chat box.
   var $clientRequestMessages = [];

   // Used for images comparison.
   var $baseViewportImage;

   var $supportAlertDialogTitle = 'You got a new message from client. Would you like to response?';
   var $finishingMessage = 'Client has finished conversation at';
   var $validationEmptyFieldError = 'Please fill out the field(s)';
   var $defaultTextAreaMessage = 'Type message here...';

   var $supportAlertDialogOptions = {
      resizable: false,
      draggable: false,
      width: 640,
      title: $supportAlertDialogTitle,
      buttons: {
         Ok: function () {
            $supportAccepted = true;
            $(this).dialog("close");
            handleAlertDialogOkResult.apply(this);
         },
         Cancel: function () {
            $supportAccepted = false;
            $(this).dialog("close");
         }
      }
   };

   /**
    * ===================== Plugin methods come below. ====================================================
    */
   var methods = {

      /**
       * Initialize globals and do the other init stuff.
       */
      init: function () {
         $socket = io.connect($host);
      },

      drawChatBox: function(options) {
         var $uwcChatWindow = $('#uwc-chat-window');
         $uwcChatWindow.dialog(options)
                       .parent('.ui-widget')
                       .attr('id', 'uwc-chat-window-dialog');
         $('#uwc-chat-window-dialog.ui-dialog').hide();

         pupulateChatContent();
         handleDefaultMessageText();
      },

      /**
       * Generates a reqular message with parameters given.
       * @param name Message's owner name
       * @param date Message's creation date
       * @param message Message's body
       */
      emitSocketMessage: function (name, date, message) {
         $socket.emit('message', {
            me: name,
            mytime: date,
            message: message
         });
      },

      /**
       * Generates a message for view port content with parametres given.
       * @param $img Screenshot of a client's remote desktop area.
       * @param $width Width of client's desktop screenshot image.
       * @param $height Height of client's desktop screenshot image.
       */
      emitRDImageMessage: function ($img, $width, $height) {
         $socket.emit('message', {
            img: $img,
            width: $width,
            height: $height
         });
      },

     /**
      * Generates a message containing mouse action/movement data.
      */
      emitMouseMoveMessage: function (x, y, action) {
          $socket.emit('message', {
            mouse: true,
            action: action,
            x: x,
            y: y
         });
      },

      /**
       * Takes care of processing the message arrived on client side.
       */
      handleClientIO: function () {
         $socket.on('message', function (message) {
            // Remote Desktop: track mouse-related actions
            if (message.mouse) {
               processMouseMove(message.x, message.y, message.action);
               return false;
            }
            methods.showMessage(message.me, message.mytime, message.message);
         });
      },

      /**
       * Takes care of processing the message arrived on support side.
       */
      handleSupportIO: function () {
         $socket.on('message', function (message) {
            // view port
            if (message.img) {
               processViewPortImage(message.img, message.width, message.height);
               return false;
            }
            $clientRequestMessages.push(message);
            // Client has started chat.
            if (!$supportAccepted) {
               $('#alert').dialog($supportAlertDialogOptions);
               return false;
            }
            // Client has finished chat.
            if ($.isEmptyObject(message)) {
               $supportAccepted = false;
               methods.showFinishingMessage(new Date(), 'Client has finished conversation at');
               $('#view-port').hide();
               $('#greetings').show();
               disableMessaging();
               return false;
            }
            // Client has sent a regular message.
            methods.showMessage(message.me, message.mytime, message.message);
         });
      },

      /**
       * Does all the work conserning message processing once user submits it, i.e.
       * - primitive validation stuff;
       * - message display in chat dialog box;
       * - throwaway the message.
       */
      handleMessageOnSubmit: function () {
         var $date = new Date();
         var $name = $('#name').val();
         var $message = $('#message').val();

         performValidation($name, $message);
         if (!$isValidInput) {
            return false;
         }
         switchClientDialogContent($name);
         methods.emitSocketMessage($name, $date, $message);
         // Show message for yourself.
         methods.showMessage('you', $date, $message);
      },

      /**
       * Displays message in chat dialog box.
       * Note: if name is not given then process the message as the finishing one.
       * @param name Message's owner name
       * @param date Message's creation date
       * @param message Message's body
       */
      showMessage: function (name, date, message) {
         var $finishingMessageHtml, $regularMessageHtml, $messageHtmlToInsert;
         if (arguments[0] === undefined) {
            $finishingMessageHtml = '<li class="client-message"><div id="complete-message">' + $finishingMessage + ' <span>' + dateFormat(new Date(), "DD/MM/YYYY hh:mm:ss") + '</span></div></li>';
            clearMessageStock();
         } else {
            $regularMessageHtml = '<li class="client-message"><div><span class="name">' + name + ' : </span><span class="time">' + dateFormat(new Date(date), "DD/MM/YYYY hh:mm:ss") + '</span></div>' + message + '</li>';
         }
         $messageHtmlToInsert = ($finishingMessageHtml === undefined) ? $regularMessageHtml : $finishingMessageHtml;
         $('#message-area ul').append($messageHtmlToInsert);
         $('#message-area').scrollTop($('#message-area ul').height());
         $('#message').val('');
      },

      /**
       * Displays finishing message which has different structure then the normal ones.
       * @param date Message's creation date
       * @param message Message's body
       */
      showFinishingMessage: function (date, message) {
         methods.showMessage(undefined, date, message);
      },

      /**
       * Validation template. Use more sophisticated validation for each fields if needed.
       * @param msg Message text to be validated.
       */
      isValidValue: function (msg) {
         return !isEmpty(msg) && msg !== $defaultTextAreaMessage;
      }
   };

   /**
    * ===================== Additional/protected functions come below. ====================================
    */

   /**
     * Primitive validator. Checks if the string is empty.
     * Note: '!string' will evaluate to true for null, undefined, and "",
     * and the trim check catches strings that only contain whitespace.
     * @param string A string to process.
     * @return true if string is empty, false otherwise.
     */
   function isEmpty(string) {
      return (!string || $.trim(string).length === 0);
   }

   /**
     * Format date as a string using tempate given.
     * Calculate date parts and replace instances in format string accordingly.
     * Note: Pad with '0' if needed. For example, months and hours are zero-based.
     * @param date - a date object (usually "new Date();").
     * @param format - a string format, eg. "DD-MM-YYYY".
     * @return formatted date.
     */
   function dateFormat(date, format) {
      format = format.replace("DD", (date.getDate() < 10 ? '0' : '') + date.getDate());
      format = format.replace("MM", (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1));
      format = format.replace("YYYY", date.getFullYear());

      format = format.replace("hh", (date.getHours() < 10 ? '0' : '') + date.getHours());
      format = format.replace("mm", (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
      format = format.replace("ss", (date.getSeconds() < 10 ? '0' : '') + date.getSeconds());
      return format;
   }

   /**
    * Contains all the validation logic.
    * @param name Name value to validate.
    * @param message Message value to validate.
    */
   function performValidation(name, message) {
      if (!methods.isValidValue(name) || !methods.isValidValue(message)) {
         alert($validationEmptyFieldError);
         $isValidInput = false;
      } else {
         $isValidInput = true;
      }
   }

   /**
    * Clears client's request messages stock.
    */
   function clearMessageStock() {
       $clientRequestMessages = [];
   }

   /**
    * Provides/clears default message text on blur/focus respectively.
    */
   function handleDefaultMessageText() {
      $('.ui-dialog textarea').blur(function () {
         var messageInput = $(this).val();
         if (!messageInput || $.trim(messageInput).length === 0) {
            $(this).val($defaultTextAreaMessage);
         }
      });

      $('.ui-dialog textarea').focus(function () {
         if ($(this).val() === $defaultTextAreaMessage) {
            $(this).val('');
         }
      });
   }

   /**
    * Creates and inserts markup for chat inner html.
    */
   function pupulateChatContent() {
      var $nameMarkup    = '<div><label for="name">Your name:</label><input type="text" name="name" value="" id="name" class="span5"></div>';
      var $messageMarkup = '<div><label for="message">Message:</label><textarea name="message" value="" id="message" class="span5">' + $defaultTextAreaMessage + '</textarea></div>';
      var $buttonMarkup  = '<div><div class="buttons"><button class="btn primary" class="span5">Submit</button></div>';
      $('#uwc-chat-window').append($nameMarkup + $messageMarkup + $buttonMarkup)
                           .prepend('<div id="message-area"><ul></ul></div>');
   }

   /**
    * Toogles different chat content since client first sees prompt to type name/message.On submit, he/she gets message box.
    * @param name Name value to make sure we only switch views for client.
    */
   function switchClientDialogContent(name) {
      // Switch dialog content for client.
      if (name !== 'support') {
         $('#name').parent().hide();
         $('#message-area').show();
      }
   }

   /**
    * Does the work needed after support clicks "OK" to accept chat.
    */
   function handleAlertDialogOkResult() {
      $('#greetings').hide();
      $('#view-port').show();
      $('#uwc-chat-window #message-area ul li').remove();
      $('#uwc-chat-window-dialog.ui-dialog').show();
      enableMessaging();

      $.each($clientRequestMessages, function (index, message) {
         methods.showMessage(message.me, new Date(message.mytime), message.message);
      });
   }

   /**
    * Enables to send message.
    */
   function enableMessaging() {
      $('#message').removeAttr('disabled').val($defaultTextAreaMessage);
      $('.buttons .primary').removeAttr('disabled');
   }

   /**
    * Disables to send message.
    */
   function disableMessaging() {
      $('#message').val('').attr('disabled', 'disabled');
      $('.buttons .primary').attr('disabled', 'disabled');
   }

   /**
    * ===================== View Port & Remote Desktop logic-related functions. ======================================
    */

   /**
    * Handles view port image when received.
    * @param imageDataURL Image of client's view port in format data:image/png;base64
    * @param width Width of the image transferred
    * @param height Height of the image transferred
    */
   function processViewPortImage(imageDataURL, width, height) {
      var myCanvas = document.getElementById('view-port');
      myCanvas.height = height;
      myCanvas.width = width;
      var ctx = myCanvas.getContext('2d');
      var img = new Image();
      img.src = imageDataURL;
      
      // todo: render diff image above
      if ($baseViewportImage === undefined) {
         $baseViewportImage = img;
      }

      img.onload = function(){
         ctx.drawImage(img, 0, 0, myCanvas.width, myCanvas.height);
      };
   }

   function processMouseMove(x, y, action) {
      // Fire a new jQuery.Event object with specified event properties.
      var target = document.elementFromPoint(x, y);
      $(target).trigger(action);
   }

   $.fn.chat = function (options) {
      var $chatBox = this;

      // Method calling logic
      if (methods[options]) {
         return methods[options].apply($chatBox, Array.prototype.slice.call(arguments, 1));
      } else if (typeof options === 'object' || !options) {
         return methods.init.apply($chatBox, arguments);
      } else {
         $.error('Method ' +  options + ' does not exist on chat');
      }
   };

}(jQuery));