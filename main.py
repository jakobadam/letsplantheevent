from google.appengine.dist import use_library
use_library('django', '1.1')

import tubes
import os

from google.appengine.ext.webapp import template
from django.template import TemplateDoesNotExist
from views import handler

TEMPLATE_DIR = "templates"

def render(file_name, **values):
    path = os.path.join(TEMPLATE_DIR, file_name)
    try:
        return template.render(path, values)
    except TemplateDoesNotExist:
        path = os.path.join(TEMPLATE_DIR, '404.html')
        return template.render(path, values)

@handler.get('^/?$', produces=tubes.HTML)
def main(handler):
    return render('index.html')

if __name__ == '__main__':
    tubes.run_gae(handler)
