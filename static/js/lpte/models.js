dojo.provide("lpte.models");

dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.TimeTextBox");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.Dialog");

dojo.require("lpte.stores");

(function($){
   
  $.task = {
    
    delete: function(){
      $.tasks.deleteItem(this);
      $.tasks.save();
    },

    show: function(){
      console.log("task::show", this);
      this.edit();
    },

    edit: function(){
      console.log("task::edit", this);
      var self = this,
          content = self._render_edit_view(),
          save_button = '<button id="dialogSave" dojoType="dijit.form.Button">Save</button>',
          cancel_button = '<button id="dialogCancel" dojoType="dijit.form.Button">Cancel</button>',
          dialog;

      content += save_button + cancel_button;
      dialog = self._show_dialog(content);

      dojo.query('#dialogSave').onclick(function(){
        if(!self.isSaved()){
          self = $.tasks.newItem();
        }
        self._populate_from_dialog();
        self.save();
        dialog.hide();
      });

      dojo.query('#dialogCancel').onclick(function(){
        dialog.hide();
      });
    },

    isSaved: function(){
      return $.tasks.isItem(this);
    },

    save: function(){
      $.tasks.changing(this);

      // remove starttime and endtime
      this.end = new Date(this.end.getTime() + this.endtime.getTime());
      this.start = new Date(this.start.getTime() + this.starttime.getTime());
      delete this.endtime;
      delete this.starttime;

      $.tasks.save();
    },

    _populate_from_dialog: function(){
      var self = this;
      dojo.query("#taskDialogForm input").forEach(function(node, index, arr){
        if(node.id){
          self[node.id] = dijit.byId(node.id).get("value");
        }
      });
    },

    _show_dialog: function(content){
      var dialog = dijit.byId('editTaskDialog');
      if(!dialog){
        dialog = new dijit.Dialog({
          id: "editTaskDialog",
          title: "Task",
          onCancel: function(){this.hide();}
        });
      }
      dialog.set('content', content);
      dialog.show();
      return dialog;
    },

    _edit_template: [
      '<div style="width:600px;overflow:auto">',
      '<form id="taskDialogForm" dojoType="dijit.form.Form">',
      '<table>',
      '<tr>',
      '  <td>',
      '   <label for="name">Name</label>',
      '  </td>',
      '  <td>',
      '    <input id="name" dojoType="dijit.form.ValidationTextBox" value="${name}"></input>',
      '  </td>',
      '</tr>',
      '<tr>',
      '  <td>',
      '   <label for="start">Start</label>',
      '  </td>',
      '  <td>',
      '    <input id="start" dojoType="dijit.form.DateTextBox" value="${start}"></input>',
      '    <input id="starttime" dojoType="dijit.form.TimeTextBox" value="${starttime}"></input>',
      '  </td>',
      '</tr>',
      '<tr>',
      '  <td>',
      '   <label for="end">End</label>',
      '  </td>',
      '  <td>',
      '    <input id="end" dojoType="dijit.form.DateTextBox" value="${end}"></input>',
      '    <input id="endtime" dojoType="dijit.form.TimeTextBox" value="${endtime}"></input>',
      '  </td>',
      '</tr>',
      '</table>',
      '</form>',
      '</div>'].join(''),

    _render_edit_view: function(view){
      console.log("task::_render_edit_view", this);
      // ensure everything is defined
      var c = {};
      c.end = c.endtime = this.end || "";
      c.start = c.starttime = this.start || "";
      c.name = this.name || "";
      return dojo.string.substitute(this._edit_template, c);
    }
  };

})(window);

