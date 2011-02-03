dojo.provide("evpl.formatters");

(function($){

 function datetimeFormatter(/*String*/ timestamp){
   return dojo.date.locale.format(new Date(timestamp), this.constraint);
 }

 $.evpl.formatters.datetimeFormatter = datetimeFormatter;

})(window);
