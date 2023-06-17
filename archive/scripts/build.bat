@echo off
echo Combining and minifying JS files into temp.js
@java^
	-jar^
	  \closureCompiler\closure-compiler-v20230103.jar^
  --js^
    sources/dom.lib.js^
    sources/calc.app.js^
    sources/help.modals.js^
  --js_output_file^
    temp.js
echo Combining comment.js + temp.js as calc.min.js
copy /B comment.js + temp.js calc.min.js
echo Removing temp.js
del temp.js
echo Attempt Complete
pause
