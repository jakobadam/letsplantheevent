import tubes

from models import Task

handler = tubes.Handler()

TASKS = {}
next_task_id = 0

@handler.post('^/tasks/?$', accepts=tubes.JSON, transform_body=Task.from_json)
def new_task(handler, task):
    global next_task_id
    task.id = str(next_task_id)
    TASKS[task.id] = task
    next_task_id = next_task_id + 1
    headers = {'Location': handler.url + str(task.id)}
    return tubes.Response(task.to_json_str(), status=201, mimetype=tubes.JSON, headers=headers)

@handler.get('^/tasks/?')
def get_tasks(handler):
    return Task.to_json_list(TASKS.values())

@handler.get('^/tasks/(.+)/?')
def get_task(handler, id):
    if id in TASKS:
        return TASKS[id]
    return tubes.Response("task not found", 404)

@handler.put('^/tasks/(.+)/?$', accepts=tubes.JSON, transform_body=Task.from_json)
def update_task(handler, task, id):
    task.id = id
    TASKS[id] = task
    return TASKS[id]

@handler.delete('^/tasks/(.+)/?', transform_body=Task.from_json)
def remove_task(handler, id):
    if id in TASKS:
        del TASKS[id]
    else:
        return tubes.Response("task not found", 404)

if __name__ == '__main__':
    tubes.run(handler)
