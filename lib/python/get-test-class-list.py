#!/usr/bin/env python3

import os
import sys
import re
from pathlib import Path

def listfiles(folder):
    for root, folders, files in os.walk(folder):
        for filename in folders + files:
            yield os.path.join(root, filename)

test_file_names = []
classes_dir = sys.argv[1]
trigger_dir = sys.argv[2]

# check if any apex classes and add Test and _Test classes
for filename in listfiles(classes_dir):
    file_content = ''
    with open(filename, 'r') as f:
        file_content = f.read().lower()

    if filename.endswith('-meta.xml'):
        pass
    elif '@istest' in file_content:
        test_file_names.append(Path(filename).stem)
    elif 'public interface' in file_content:
        pass
    else:
        test_file_names.append(Path(filename).stem + 'Test')
        test_file_names.append(Path(filename).stem + '_Test')

# check if any triggers and find trigger handlers
for filename in listfiles(trigger_dir):
    file_content = ''
    with open(filename, 'r') as f:
        file_content = f.read()

    if filename.endswith('-meta.xml'):
        pass
    else:
        ## Any string before ()).
        ## Example File. triggers/CaseTrigger.trigger
        ## Example String. CaseFunctionHandler())
        handlers = re.findall(r"\w+(?=\(\)\))",file_content)
        for filename in handlers:
            test_file_names.append(Path(filename).stem + 'Test')
            test_file_names.append(Path(filename).stem + '_Test')

        ## Any class which ends with Handler.
        ## Example File. triggers/AccountContactRelationshipTrigger.trigger
        ## Example String. ACRTriggerHandler.createNumber(Trigger.new);
        handlers = re.findall(r"\w+(?:Handler.)",file_content)
        for filename in handlers:
            filename=filename.replace(".","")
            test_file_names.append(Path(filename).stem + 'Test')
            test_file_names.append(Path(filename).stem + '_Test')

print(','.join(test_file_names))
