dojo.provide("lpte.stores");
dojo.require('dojox.data.JsonRestStore');

(function($){

  $.tasks = new dojox.data.JsonRestStore({
    target:"/tasks/", 

    deleteById: function(id){
      console.log('tasks::deleteById', id);
      this.fetchItemByIdentity({identity: id, onItem: function(item){
        console.log('tasks::deleteById', 'got item', item);
        tasks.deleteItem(item);
        tasks.save();
      }});
    }
  });

}(window));
