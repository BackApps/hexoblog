var http = require('http')
var exec = require('child_process').exec

http.createServer(function (req, res) {
    if(req.url === '/webhooks/push/123456GH'){
	console.log('start');
        exec('sh ./deploy.sh');

	console.log('update');
    }
    res.end()
}).listen(4000)
