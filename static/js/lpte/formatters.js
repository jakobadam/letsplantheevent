dojo.provide("lpte.formatters");

(function($){

 function datetimeFormatter(/*String*/ timestamp){
   return dojo.date.locale.format(new Date(timestamp), this.constraint);
 }

 $.lpte.formatters.datetimeFormatter = datetimeFormatter;

})(window);
