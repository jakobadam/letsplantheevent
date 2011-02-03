import tubes
import re

@tubes.JsonClass()
class User(object):

    USER_FORMAT = '.*'
    ALL_USER_FORMAT = '^' + USER_FORMAT + '$'
    
    def __init__(self, user=None, firstname=None, lastname=None, email=None):
        """
        """
        self.id = user
        self.user = user
        self.firstname = firstname
        self.lastname = lastname
        self.email = email

    @classmethod
    def is_valid_username(cls, username):
        '''return True if username matches User.USER_FORMAT
        '''
        return re.match(User.ALL_USER_FORMAT, username) is not None
        
@tubes.JsonClass()
class Task(object):
    """
    """
    
    def __init__(self, name=None, startdate=None, starttime=None, enddate=None, endtime=None):
        """
        """
        self.name = name
        self.startdate = startdate
        self.starttime = starttime
        self.enddate = enddate
        self.endtime = endtime

@tubes.JsonClass()
class Event(object):
    
    def __init__(self, name=None):
        self.name = name

@tubes.JsonClass()
class Location(object):
    """
    """
    
    def __init__(self, lat=None, lon=None, name=None):
        """
        """
        self.lat = lat
        self.lon = lon
        self.name = name
