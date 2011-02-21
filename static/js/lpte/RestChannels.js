dojo.provide("lpte.RestChannels");
 
dojo.require("dojox.rpc.Client");
dojo.requireIf(dojox.data && !!dojox.data.JsonRestStore,"dojox.data.restListener");

(function(){
	dojo.declare("lpte.RestChannels", null, {
		constructor: function(options){
			// summary:
			//		Initiates the REST Channels protocol
			//	options:
			//		Keyword arguments:
			//	The *autoSubscribeRoot* parameter:
			//		When this is set, all REST service requests that have this
			// 		prefix will be auto-subscribed. The default is '/' (all REST requests).
			//  The *url* parameter:
			//		This is the url to connect to for server-sent messages. The default
			//		is "/channels".
			//	The *autoReconnectTime* parameter:
			// 		This is amount time to wait to reconnect with a connection is broken
			dojo.mixin(this,options);
			// If we have a Rest service available and we are auto subscribing, we will augment the Rest service 
			if(dojox.rpc.Rest && this.autoSubscribeRoot){
				// override the default Rest handler so we can add subscription requests
				var defaultGet = dojox.rpc.Rest._get;
				var self = this;
				dojox.rpc.Rest._get = function(service, id){
					// when there is a REST get, we will intercept and add our own xhr handler
					var defaultXhrGet = dojo.xhrGet;
					dojo.xhrGet = function(r){
						var autoSubscribeRoot = self.autoSubscribeRoot;
						return (autoSubscribeRoot && r.url.substring(0, autoSubscribeRoot.length) == autoSubscribeRoot) ?
							self.get(r.url,r) : // auto-subscribe 
							defaultXhrGet(r); // plain XHR request
					};
		
					var result = defaultGet.apply(this,arguments);
					dojo.xhrGet = defaultXhrGet;
					return result;
				};
			}
		},
		absoluteUrl: function(baseUrl,relativeUrl){
			return new dojo._Url(baseUrl,relativeUrl)+'';
		},
		subscriptions: {},
		subCallbacks: {},
		autoReconnectTime: 3000,
		sendAsJson: false,
		url: '/channels',
		autoSubscribeRoot: '/',
		open: function(){
			// summary:
			// 		Startup the transport (connect to the "channels" resource to receive updates from the server).
			//
			// description:
			//		Note that if there is no connection open, this is automatically called when you do a subscription,
			// 		it is often not necessary to call this
			//
          var self = this;
		  if(!self.connected){
            var dfd = gaechannel.open();
            var onLoad = function(){
              self.connected = true;
            };
            var onError = function(){
			  self.disconnected();
            };
            dfd.addCallbacks(onLoad, onError);
          }
		},
		_send: function(method,args,data){
          
			// fire an XHR with appropriate modification for JSON handling
			if(this.sendAsJson){
				// send use JSON Messaging
				args.postData = dojo.toJson({
					target:args.url,
					method:method,
					content: data,
					params:args.content,
					subscribe:args.headers["Subscribe"]
				});
				args.url = this.url;
				method = "POST";
			}else{
				args.postData = dojo.toJson(data);
			}			
			return dojo.xhr(method,args,args.postData);
		}, 
		subscribe: function(/*String*/channel, /*dojo.__XhrArgs?*/args){
			// summary:
			// 		Subscribes to a channel/uri, and returns a dojo.Deferred object for the response from 
			// 		the subscription request
			//
			// channel: 
			// 		the uri for the resource you want to monitor
			// 
			// args: 
			// 		See dojo.xhr
			// 
			// headers:
			// 		These are the headers to be applied to the channel subscription request
			//
			// callback:
			// 		This will be called when a event occurs for the channel
			// 		The callback will be called with a single argument:
			// 	|	callback(message)
			// 		where message is an object that follows the XHR API:
			// 		status : Http status
			// 		statusText : Http status text
			// 		getAllResponseHeaders() : The response headers
			// 		getResponseHeaders(headerName) : Retrieve a header by name
			// 		responseText : The response body as text
			// 			with the following additional Bayeux properties 
			// 		data : The response body as JSON
			// 		channel : The channel/url of the response
			args = args || {};
			args.url = this.absoluteUrl(this.url, channel);
			if(args.headers){ 
				// FIXME: combining Ranges with notifications is very complicated, we will save that for a future version
				delete args.headers.Range;
			}
			var oldSince = this.subscriptions[channel];
			var method = args.method || "HEAD"; // HEAD is the default for a subscription
			var since = args.since;
			var callback = args.callback;
			var headers = args.headers || (args.headers = {});
			this.subscriptions[channel] = since || oldSince || 0;
			var oldCallback = this.subCallbacks[channel];
			if(callback){
				this.subCallbacks[channel] = oldCallback ? function(m){
					oldCallback(m);
					callback(m);
				} : callback;
			} 
			if(!this.connected){
				this.open();
			}
			if(oldSince === undefined || oldSince != since){
				headers["Cache-Control"] = "max-age=0";
				since = typeof since == 'number' ? new Date(since).toUTCString() : since;
				if(since){
					headers["Subscribe-Since"] = since;
				}
				headers["Subscribe"] = args.unsubscribe ? 'none' : '*';
				var dfd = this._send(method,args);
				
				var self = this;
				dfd.addBoth(function(result){					
					var xhr = dfd.ioArgs.xhr;
					if(!(result instanceof Error)){
						if(args.confirmation){
							args.confirmation();
						}
					}
					if(xhr && xhr.getResponseHeader("Subscribed")  == "OK"){
						var lastMod = xhr.getResponseHeader('Last-Modified');
						
						if(xhr.responseText){ 
							self.subscriptions[channel] = lastMod || new Date().toUTCString();
						}else{
							return null; // don't process the response, the response will be received in the main channels response
						}
					}else if(xhr && !(result instanceof Error)){ // if the server response was successful and we have access to headers but it does indicate a subcription was successful, that means it is did not accept the subscription
						delete self.subscriptions[channel];
					}
					if(!(result instanceof Error)){
						var message = {
							responseText:xhr && xhr.responseText,
							channel:channel,
							getResponseHeader:function(name){
								return xhr.getResponseHeader(name);
							},
							getAllResponseHeaders:function(){
								return xhr.getAllResponseHeaders();
							},
							result: result
						};
						if(self.subCallbacks[channel]){
							self.subCallbacks[channel](message); // call with the fake xhr object
						}
					}else{
						if(self.subCallbacks[channel]){
							self.subCallbacks[channel](xhr); // call with the actual xhr object
						}
					}
					return result;
				});
				return dfd;
			}
			return null;
		},
		publish: function(channel,data){
			// summary:
			//		Publish an event.
			// description:
			// 		This does a simple POST operation to the provided URL,
			// 		POST is the semantic equivalent of publishing a message within REST/Channels
			// channel:
			// 		Channel/resource path to publish to
			// data:
			//		data to publish
			return this._send("POST",{url:channel,contentType : 'application/json'},data);
		},
		get: function(/*String*/channel, /*dojo.__XhrArgs?*/args){
          console.log("get", arguments);
          
			// summary:
			// 		GET the initial value of the resource and subscribe to it  
			//		See subscribe for parameter values
			(args = args || {}).method = "GET"; 
			return this.subscribe(channel,args);
		},
		unsubscribe: function(/*String*/channel, /*dojo.__XhrArgs?*/args){
			// summary:
			// 		unsubscribes from the resource  
			//		See subscribe for parameter values 
			
			args = args || {};
			args.unsubscribe = true;
			this.subscribe(channel,args); // change the time frame to after 5000AD 
		},
		disconnect: function(){
			// summary:
			// 		disconnect from the server  
			this.xhr.abort();
		}
	});

	new lpte.RestChannels();

})();
