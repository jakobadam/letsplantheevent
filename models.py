import tubes
        
# @tubes.JsonClass()
class Task(object):
    
    def __init__(self, name=None, startdate=None, starttime=None, enddate=None, endtime=None):
        self.name = name
        self.startdate = startdate
        self.starttime = starttime
        self.enddate = enddate
        self.endtime = endtime

    def get_absolute_url(self):
        return "/tasks/%s" % (self.id)

    def __str__(self):
        return "Task: %s" % self.name

Task = tubes.JsonClass()(Task)
