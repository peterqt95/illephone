:: Copy server files to dist
copy /Y src\server\app.js dist\app.js
copy /Y src\server\timer.js dist\timer.js
copy /Y src\server\timerHandler.js dist\timerHandler.js
copy /Y src\server\illephone.js dist\illephone.js
copy /Y src\server\gameObject.js dist\gameObject.js


:: Run the server
node dist/app.js