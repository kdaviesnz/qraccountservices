var q = require('querystring');
var env = process.env.NODE_ENV || 'development';

function sendAuthServiceResult(req, res, result) {
    req.statusCode = result!==null && result.status?result.status:200;
    res.writeHead(result!=null && result.status?result.status:200, {'Content-Type': 'application/json'});
    res.write(result!=null && result.content && result.content!==''?JSON.stringify(result.content):'{}');
    res.end();
}

exports.get = function(req, res) {
    // Get the url GET parameters
    var temp = req.url.split("?");
    var params = temp[1]?q.parse(temp[1]):{};
    if(!params.username){
// qrcode
	if(!params.qrcode){
	    sendAuthServiceResult(req, res, {
		'err':'No username or qrcode',
		'content':'',
		'status':400
	    });
	}
	else{
	    // Look up the qr and check if a matching record exists
	    db.query("SELECT `id`FROM `users` WHERE `qrcode`=?", [md5(params.qrcode)], function(err, rows){
		if(err) throw err;
		var qrcodeexists = rows.length > 0;
		// If qr code exists return 200 OK, otherwise 404 Not found
		sendAuthServiceResult(req, res, {
		    'err':'',
		    'content':qrcodeexists?rows[0]:{},
		    'status': qrcodeexists?200:404
		});
	    });
	}
    }
    else{
	// Look up the username and check if it's already being used
	db.query("SELECT `id`, `firstname`, `lastname`, `email`, `lastonline` FROM `users` WHERE `id`=?", [params.username], function(err, rows){
	    if(err) throw err;
	    var userexists = rows.length > 0;
	    // If user exists return 200 OK, otherwise 404 Not found
	    sendAuthServiceResult(req, res, {
		'err':'',
		'content':userexists?rows[0]:{},
		'status':userexists?200:404
	    });
	});
    }
}

exports.post = function(req, res) {
    var data = '';
    req.on("data", function(chunk){
	data += chunk; // POST data
    });
    req.on("end", function(){
	var params = q.parse(data);
	// https://www.npmjs.org/package/qrcode-npm
	try{
	    var qr = qrCode.qrcode(4, 'M');
	    var text = params.username + Math.round(new Date().getTime());
	    qr.addData( text );
	    qr.make();
	    //    qr.createTableTag(4);  // creates a <table> tag as text
	    // Save the username and qr code
	    db.query("INSERT INTO `users` (`id`, `qrcode`) VALUES (?,?)", [params.username, md5(text)], function(err){
		if(err) throw err;
		sendAuthServiceResult(req, res, {
		    'err':'',
		    'content':{'img':qr.createImgTag(4)},
		    'status':201
		});
	    });
	}
	catch(err){
		sendAuthServiceResult(req, res, {
		    'err':err,
		    'content':{},
		    'status':500
		});
	}
    });
}

exports.put = function(req, res) {

}

exports.del = function(req, res) {

}

