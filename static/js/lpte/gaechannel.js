dojo.provide("lpte.gaechannel");

dojo.require("dojox.rpc.Client");
dojo.require("dojox.data.restListener");

(function($){
   
   var channel,socket;
   
   function createChannel(client_id){
     console.log("channel::createChannel", client_id);
     var dfd = dojo.xhrPost({
       headers: { "Create-Client-Id": client_id},
       url: "/channels/"
     });
     return dfd;
   }

   function open(){
     console.log("channel::open");
     var client_id = dojox.rpc.Client.clientId;
     var dfd = createChannel(client_id);
     var onLoad = function(token){
       console.log('token', arguments);
       
       channel = new goog.appengine.Channel(token);
       socket = channel.open();
       socket.onopen = function(){
         console.log("onopen");
       };
       socket.onmessage = function(msg){
         console.log("channel::socket::onmessage", msg);
         var data = dojo.fromJson(msg.data);
         console.log(data);
         dojox.data.restListener(data);
       };
       // socket.onerror = onError;
       // socket.onclose = onClose;
       dojo.addOnUnload(function(){
         channel.disconnect();
       });
     };

     var onError = function(){
       console.log("onError", arguments);
     };
     dojo.when(dfd, onLoad, onError);
   }
   
   $.gaechannel = {
     open: open
   };
   
})(window);

