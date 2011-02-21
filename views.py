import random
import logging
import os

from google.appengine.api import channel
import simplejson as json

import tubes

from models import Task

handler = tubes.Handler()

TASKS = {}
next_task_id = 0

clients = {}
subscriptions = {}

@handler.post('^/tasks/?$', accepts=tubes.JSON, transform_body=Task.from_json)
def new_task(handler, task):
    global next_task_id
    task.id = str(next_task_id)
    TASKS[task.id] = task
    next_task_id = next_task_id + 1
    task_url = handler.url + str(task.id)

    headers = {'Location': task_url}
    publish(handler, task)
    return tubes.Response(task.to_json_str(), status=201, mimetype=tubes.JSON, headers=headers)

@handler.get('^/tasks/?')
def get_tasks(handler):
    subscribe(handler)
    return Task.to_json_list(TASKS.values())

@handler.get('^/tasks/(.+)/?')
def get_task(handler, id):
    if id in TASKS:
        return TASKS[id]
    return tubes.Response("task not found", 404)

@handler.put('^/tasks/(.+)/?$', accepts=tubes.JSON, transform_body=Task.from_json)
def update_task(handler, task, id):
    print 'updating', task, id
    task.id = id
    TASKS[id] = task
    publish(handler, task)
    return TASKS[id]

@handler.delete('^/tasks/(.+)/?', transform_body=Task.from_json)
def remove_task(handler, id):
    if id in TASKS:
        t = TASKS[id]
        del TASKS[id]
        publish(handler, t)
        return tubes.Response(status=204)
    else:
        return tubes.Response("task not found", 404)

@handler.post('^/channels/?', produces=tubes.TEXT)
def new_channel(handler):
    client_id = handler.headers.get('Create-Client-Id')
    if not client_id:
        return tubes.Response("Missing Create-Client-Id header!", status=200)
    clients[client_id] = {}
    logging.info('Creating new channel for client %s', client_id)
    return channel.create_channel(client_id) # 

def subscribe(handler):
    if handler.headers.get("Subscribe"):
        resource = handler.path
        logging.info("subscribing to updates for resource: %s" % (resource))
        client_id = handler.headers.get("Client-Id") 
        if not resource in subscriptions:
            subscriptions[resource] = {}
        subscriptions[resource][client_id] = True
    else:
        logging.info('byparsing subscribe since header not present')

def publish(handler, entity):
    client = handler.headers.get('Client-Id')
    if not client:
        logging.info('No Client-Id header, not sending updates')
        return
    msg = {
        "channel": entity.get_absolute_url(),
        "source": entity.get_absolute_url(), # same as Content-Location
        "event": handler.method.lower(),
        "result": entity.to_json()
        }
    msg = json.dumps(msg)
    resource = os.path.dirname(entity.get_absolute_url()) + "/"
    logging.info("publishing to %s: %s" % (resource, str(msg)))
    # send message to all subscribers except for the originating client
    logging.info('subscriptions: %s', subscriptions)
    if resource in subscriptions:
        for c_id in subscriptions[resource]:
            if c_id != client:
                logging.info('sending message to %s' % c_id)
                channel.send_message(c_id, msg)

if __name__ == '__main__':
    tubes.run(handler)
