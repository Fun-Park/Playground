#!/usr/bin/env python
#-----------------------------------------------------------------------------
# This example will read an XML file and parse out the data using the
# xml.etree.ElementTree library that is included in the standard library. 
#
# There are two methods for doing XML parsing, the DOM method loads the XML
# file into a tree structure in memory and the SAX method reads the XML file
# as a stream of text. The DOM method is fast but only works on small files
# that will fit in memory. The SAX method can work on arbitrary length files.
#
# I will be using Python's ElementTree module in the example below because I  
# want to use the tools in the standard library. You can get more information  
# about ElementTree at:
#         http://docs.python.org/library/xml.etree.elementtree.html, and
#         http://effbot.org/zone/element.htm
#
# There are a number of external XML parsing libraries that can be used with 
# Python. Details are available at wiki.python.org/moin/PythonXml. If you plan 
# to do a lot of XML processing, then I would suggest looking at the lxml 
# library. It is based on libxml2 and libxslt and is fast and easy to use. You 
# can get more information about lxml at http://lxml.de/index.html. 
# 
# Reference code from 
# https://github.com/averagesecurityguy/Python-Examples/edit/master/parse_xml_file.py
#-----------------------------------------------------------------------------


#-----------------------------------------------------------------------------
# Import any needed libraries below
#-----------------------------------------------------------------------------
# We need the ElementTree module
import xml.etree.ElementTree
import os
import sys
import re
from pathlib import Path
	
#-----------------------------------------------------------------------------
# Begin the main program.
#-----------------------------------------------------------------------------
namespace = '{http://soap.sforce.com/2006/04/metadata}'
testClassNames = []
pathToXML = sys.argv[1]

# Load an XML file into the tree and get the root element.
# for testing, you can load xml from string
# packagexml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' \
# '<Package xmlns="http://soap.sforce.com/2006/04/metadata">' \
# '   <types>' \
# '       <members>DirectionHandler</members>' \
# '       <name>ApexClass</name>' \
# '    </types>' \
# '   <version>52.0</version>' \
# '</Package>' \
# root = xml.etree.ElementTree.fromstring(packagexml)
xml = xml.etree.ElementTree.ElementTree(file=pathToXML)
root = xml.getroot()

testClassNames.append('DefaultClassTest')
for child in root.findall(namespace+'types'):
    innerName = child.find( namespace+'name')
    if innerName.text == 'ApexClass':
        memberClasses = child.findall(namespace+'members')
        for memberClass in memberClasses:
            if memberClass.text:
                testClassNames.append(memberClass.text + 'Test')
    if innerName.text == 'ApexTrigger':
        memberClasses = child.findall(namespace+'members')
        for memberClass in memberClasses:
            if memberClass.text:
                testClassNames.append(memberClass.text + 'Test')             
print(','.join(testClassNames))     
            
