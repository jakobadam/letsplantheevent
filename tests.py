#!/usr/bin/python
# -*- coding: utf-8 -*-
import unittest

from werkzeug import Client
from werkzeug import BaseResponse

from google.appengine.api import channel

import views
import simplejson as json
import tubes
import models

# APP_ID = 'letsplantheevent'
# LOGIN_URL = '/_ah/login'

# config = {
#     'login_url':'/_ah/login',
#     'blobstore_path': "blob",
#     'datastore_path': "db",
#     'clear_datastore': True
#     }

# dev_appserver.SetupStubs(APP_ID, **config)
# WTF?
# AttributeError: 'XmppServiceStub' object has no attribute '_Dynamic_CreateChannel'
# Why would it call that one???
# To avoid the above error we overwrite the relevant functions.

# Overwrite the Channel API calls so we don't get errors!
channel.create_channel = lambda id: id 
channel.send_message = lambda msg: msg

class ChannelsViewTest(unittest.TestCase):

    def setUp(self):
        self.c = Client(views.handler, BaseResponse)

    def test_POSTing_with_create_client_id_header_should_create_new_channel(self):
        r = self.c.post(path="/channels/", headers={"Create-Client-Id":"1"})
        self.assertEquals(r.status_code, 200)
        self.assertTrue("1" in views.clients)

class TasksViewTest(unittest.TestCase):

    def setUp(self):
        self.c = Client(views.handler, BaseResponse)
        # clear state
        views.TASKS = {}
        views.clients = {}
        views.subscriptions = {}

    def test_POST(self):
        t = models.Task(name='Task1')
        r = self.c.post(path='/tasks/', headers={'Content-Type':tubes.JSON}, data=t.to_json_str())

        # check response
        self.assertEquals(r.status_code, 201)
        task = json.loads(r.data)
        self.assertEquals(task['name'], 'Task1')
        self.assertTrue('/tasks/0' in r.headers.get('Location'))

        # back-end
        task = views.TASKS['0']
        self.assertTrue(task != None)
        self.assertEquals(task.name, 'Task1')


    def test_PUT(self):
        views.TASKS['0'] = models.Task()
        r = self.c.put(path='/tasks/0',
                       headers={'Content-Type':tubes.JSON},
                       data=models.Task(name='Task_0').to_json_str())
        self.assertEquals(r.status_code, 200)

        # check response
        task = json.loads(r.data)
        self.assertEquals(task['name'], 'Task_0')

        # back-end
        task = views.TASKS['0']
        self.assertEquals(task.name, 'Task_0')

    def test_DELETE(self):
        views.TASKS['0'] = models.Task()
        r = self.c.delete(path='/tasks/0')
        self.assertEquals(r.status_code, 204)
        self.assertTrue(views.TASKS.get('0') == None)

    def test_GET_tasks(self):
        views.TASKS['0'] = models.Task(name='foo')
        r = self.c.get(path='/tasks/')
        self.assertTrue('foo' in r.data)

    def test_GET_task(self):
        views.TASKS['0'] = models.Task(name='foo')
        r = self.c.get(path='/tasks/0')
        self.assertTrue('foo' in r.data)
        
if __name__ == '__main__':
    unittest.main()

