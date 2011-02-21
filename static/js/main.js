dojo.registerModulePath("lpte", "/js/lpte");

dojo.require("lpte.formatters");
dojo.require("lpte.stores");
dojo.require("lpte.gaechannel");

dojo.require("dijit.Dialog");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.TabContainer");

dojo.require("dojox.data.JsonRestStore");

// The presence of this enables differt RestChannel headers.
dojo.require("dojox.cometd.RestChannels");

dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.grid.cells.dijit");

dojo.ready(function(){

  // wonder why this is not included in dojox.grid.cells.dijit.js
  dojo.declare("dojox.grid.cells.TimeTextBox", dojox.grid.cells._Widget, {
    widgetClass: dijit.form.TimeTextBox,
    setValue: function(inRowIndex, inValue){
      if(this.widget){
        this.widget.set('value', new Date(inValue));
      }else{
        this.inherited(arguments);
      }
    },
    getWidgetProps: function(inDatum){
      return dojo.mixin(this.inherited(arguments), {
        value: new Date(inDatum)
      });
    }
  });

  // for declarative use (not used in the example)
  dojox.grid.cells.TimeTextBox.markupFactory = function(node, cell){
    dojox.grid.cells._Widget.markupFactory(node, cell);
  };

  var tasks_grid_structure = [
    { 
      field: 'name',
      editable: true
    },
    {
      field: 'startdate',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.DateTextBox,
      constraint: {formatLength: 'long', selector: "date"},
      formatter: lpte.formatters.datetimeFormatter
    },
    {
      field: 'starttime',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.TimeTextBox,
      constraint: {timePattern: "HH:mm", selector: "time"},
      formatter: lpte.formatters.datetimeFormatter
    },
    {
      field: 'enddate',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.DateTextBox,
      constraint: {formatLength: 'long', selector: "date"},
      formatter: lpte.formatters.datetimeFormatter
    },
    {
      field: 'endtime',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.TimeTextBox,
      constraint: {timePattern: "HH:mm", selector: "time"},
      formatter: lpte.formatters.datetimeFormatter
    },
    {
      name: 'Actions',
      field: 'id',
      formatter: function(id, rowIdx, cell){
        if(!id){
          return "<em>unsaved</em>";
        }
        var delete_action = "tasks.deleteById('" + id + "');";
        return '<button onclick="' + delete_action + '">delete</button>';
      }
    }
  ];

  tasks_grid = new dojox.grid.DataGrid({
    name: "tasks",
    structure: tasks_grid_structure, 
    store:tasks}, 'tasks_grid');

  tasks_grid.startup();

  var new_task_button = new dijit.form.Button({
     label: "New",
     onClick: function(){
       var d = new Date();
       d.setMinutes(0);
       tasks.newItem({name: "default", starttime: d, startdate:d, endtime:d, enddate: d});
     }                                     
  }, 'new_task_button');

  var save_tasks_button = new dijit.form.Button({
    label: "Save",
    onClick: function(){
      console.log("save_button::click");
      tasks.save({
        onComplete: function(){
          console.log("save_button::onComplete");
          save_tasks_button.set('disabled', true);
        },
        onError: function(){
          console.log("WTF?", arguments);
        }         
      });
    },
    disabled: true                                                 
  }, 'save_tasks_button');

  dojo.connect(tasks, "onNew",  function(event){
    console.log("tasks::onNew", event);
    if(tasks.isDirty()){
      save_tasks_button.set('disabled', false);      
    }
  });
  
  dojo.connect(tasks, "onSet",  function(event){
    console.log("tasks::onSet", event);
    if(tasks.isDirty()){
      save_tasks_button.set('disabled', false);      
    }
  });

  // open channel to GAE!             
  gaechannel.open();

});
