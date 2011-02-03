import tubes
        
# @tubes.JsonClass()
class Task(object):
    
    def __init__(self, name=None, startdate=None, starttime=None, enddate=None, endtime=None):
        self.name = name
        self.startdate = startdate
        self.starttime = starttime
        self.enddate = enddate
        self.endtime = endtime

Task = tubes.JsonClass()(Task)
