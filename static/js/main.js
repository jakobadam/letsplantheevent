dojo.registerModulePath("evpl", "/js/evpl");
dojo.require("evpl.formatters");
dojo.require("evpl.stores");

dojo.require("dijit.Dialog");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.TabContainer");

dojo.require("dojox.data.JsonRestStore");
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

  dojox.grid.cells.TimeTextBox.markupFactory = function(node, cell){
    dojox.grid.cells._Widget.markupFactory(node, cell);
  };

  var tasks_grid_layout = [
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
      formatter: evpl.formatters.datetimeFormatter
    },
    {
      field: 'starttime',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.TimeTextBox,
      constraint: {timePattern: "HH:mm", selector: "time"},
      formatter: evpl.formatters.datetimeFormatter
    },
    {
      field: 'enddate',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.DateTextBox,
      constraint: {formatLength: 'long', selector: "date"},
      formatter: evpl.formatters.datetimeFormatter
    },
    {
      field: 'endtime',
      width: '70px',
      editable: true,
      type: dojox.grid.cells.TimeTextBox,
      constraint: {timePattern: "HH:mm", selector: "time"},
      formatter: evpl.formatters.datetimeFormatter
    },
    {
      name: 'Actions',
      formatter: function(val, rowIdx, cell){
        var item = this.grid.getItem(rowIdx);
        if(!item.id){
          return "";
        }
        var buttons = [];
        var delete_action = "tasks.deleteById('" + item.id + "');";
        buttons.push('<button onclick="' + delete_action + '">delete</button>');
        return buttons.join('');
      }
    }
  ];

  tasks_grid = new dojox.grid.DataGrid({
    name: "tasks",
    structure: tasks_grid_layout, 
    store:tasks,
    autoheight: true}, 'tasks_grid');

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
      tasks.save({onComplete: function(){
        save_tasks_button.set('disabled', true);
      }});
    },
    disabled: true                                                 
  }, 'save_tasks_button');
  
  dojo.connect(tasks, "onNew",  function(event){
    save_tasks_button.set('disabled', false);
  });
  
  dojo.connect(tasks, "onSet",  function(event){
    save_tasks_button.set('disabled', false);
  });
});
