/**
 * Use closure scope to prevent the code causes namespace problems or something.
 **/
$(document).ready(function () {

   "use strict";

   // Use $uwc-related selectors to isolate injected html nodes on client.
   var $uwc;
   var $uwcChatWindow;
   var $date, $message, $name;
   // Defines if chat has previously been finished by client.
   var $isFinishedBefore = false;
   // Defines if chat has previously been started by client.
   var $isStartedBefore = false;

   var $startChatLinkText = 'Start chat';
   var $clientChatDialogTitle = 'Contact form';
   var $chatFinishedText = 'Was it helpful?';
   var $thankYouDialogTitle = 'Chat is finished';

   // Used for images comparison.
   var $baseViewportImage;
   var $newViewportImage;

   var $clientChatDialogOptions = {
      title: $clientChatDialogTitle,
      position: 'center center',
      height: 410,
      width: 410
   };

   var $thankYouDialogOptions = {
      resizable: false,
      draggable: false,
      width: 640,
      title: $thankYouDialogTitle,
      buttons: {
         Yes: function () {
            handleThankYouDialogResult.apply(this);
         },
         No: function () {
            handleThankYouDialogResult.apply(this);
         }
      }
   };

   /**
       * ===================== Body comes below. =====================================================
       **/
   $('body').append('<div id="uwc"></div>');
   $uwc = $('#uwc');
   $uwc.chat(); // Initialize Chat plugin
   drawClientChatView();
   $uwc.chat('handleClientIO');

   $("#uwc-chat-link").click(function () {
      $(this).parent().hide();
      if ($isFinishedBefore) {
         prepareDialogBoxAfterFinishing();
      }
      $('#uwc-chat-window-dialog').show();
   });

   /**
    * Render Start Chat link when popups are closed.
    */
   $('#uwc-chat-finished-dialog .ui-dialog-titlebar-close').click(function () {
      $uwc.find('#uwc-chat-link-wrapper').show();
   });

   $('#uwc-chat-window-dialog .ui-dialog-titlebar-close').click(function () {
      $isFinishedBefore = true;
      // Emit finishing message and show Thank you dialog.
      if ($isStartedBefore) {
         $isStartedBefore = false;
         $uwc.chat('emitSocketMessage', $name, $date, $message);
         $('#uwc-chat-finished').show();
         $('#uwc-chat-finished').dialog($thankYouDialogOptions)
                                .parent('.ui-widget')
                                .attr('id','uwc-chat-finished-dialog');
      } else {
         // Show Start Chat link when popups are closed.
         $("#uwc-chat-link-wrapper").show();
      }
      $('#uwc-chat-window-dialog').hide();
   });

   /**
    * Send message on submit or ENTER press
    */
   $('#uwc-chat-window-dialog.ui-dialog textarea').keypress(function (event) {
      if (event.which === 13) {
         if ($isStartedBefore === false) {
            $isStartedBefore = true;
            sendRemoteDesktopImage();
         }
         $uwc.chat('handleMessageOnSubmit');
      }
   });

   $('#uwc-chat-window-dialog.ui-dialog .primary').click(function () {
         if ($isStartedBefore === false) {
            $isStartedBefore = true;
            sendRemoteDesktopImage();
         }
      $uwc.chat('handleMessageOnSubmit');
   });

   /**
    * ===================== Functions come below. ======================================================
    **/

   /**
    * Creates a part of DOM for client's chat box.
    */
   function drawClientChatView () {
      $uwc.append('<div id="uwc-chat-link-wrapper"><a id="uwc-chat-link">' + $startChatLinkText + ' &raquo;</a></div>')
          .append('<div id="uwc-chat-window"></div>')
          .append('<div id="uwc-chat-finished">' + $chatFinishedText + '</div>');

      $uwc.chat('drawChatBox', $clientChatDialogOptions);
      $('.ui-dialog textarea').val('');
      $('#uwc-chat-window #message-area').hide();
   }

   /**
    * Clear client chat content if the chat was already finished.
    */
   function prepareDialogBoxAfterFinishing () {
      $uwcChatWindow = $('#uwc-chat-window');
      $uwcChatWindow.find('#message-area ul li').remove();
      $uwcChatWindow.find('#message-area').hide();
      $uwcChatWindow.find('#message').val('');
      $uwcChatWindow.find('#name').val('');
      $uwcChatWindow.find('#name').parent().show();
   }

   /**
    * Ideally, does something with results of Thak you dialog box.
    * Currently, simply closes the popup and some other UI stuff.
    */
   function handleThankYouDialogResult () {
      $(this).dialog("close");
      $("#uwc-chat-link-wrapper").show();
   }

   /**
    * Uses 3-party plugin to make a snapshot of the client's page.
    */
   function makeAwesomeShot () {
      if ($isStartedBefore) {
         $('body').html2canvas({
            onrendered: function(canvas) {
               /*
               // Send diff when somehting is changed on client's viewport
               if ($baseViewportImage === undefined) {
                  $baseViewportImage = canvas;
               } else {
                  $newViewportImage = canvas;
               }
               var $diff = getImageDiff($baseViewportImage, $newViewportImage);
               var $img = ($diff) ? $diff : $baseViewportImage;
               */
               $uwc.chat('emitRDImageMessage', canvas.toDataURL(), canvas.width, canvas.height);
            }
         });
      }
   }

   /**
    * Gets difference between two image files. We need this to underload browser and protocol.
    * @param baseViewportImage
    * @param newViewportImage
    */
   function getImageDiff(baseViewportImage, newViewportImage) {
      // First shot has been done.
      if (!baseViewportImage || !newViewportImage) {
         return false;
      }
      // Shots're the same.
      if (imagediff.equal(baseViewportImage, newViewportImage)) {
         return false;
      }
      var diffImage = imagediff.diff(baseViewportImage, newViewportImage);
      var diffCanvas = imagediff.createCanvas(diffImage.width, diffImage.height);
      var context = diffCanvas.getContext('2d');
      context.putImageData(diffImage, 0, 0);
      return diffCanvas;
   }
   /**
    * Makes client's viewport screenshots every second.
    */
   function sendRemoteDesktopImage () {
      setInterval(function() {
         makeAwesomeShot();
      }, 1000);
   }

});