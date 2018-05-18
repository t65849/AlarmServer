// Application Log
//172.31.9.66
var log4js = require('log4js');
var log4js_extend = require('log4js-extend');
log4js_extend(log4js, {
    path: __dirname,
    format: '(@file:@line:@column)'
});
log4js.configure(__dirname + '/log4js.json');
var logger = log4js.getLogger('alarm');

// 從 config.json 取出參數設定內容並轉為 JSON 物件
var config = require('fs').readFileSync(__dirname + '\\config.json');
config = JSON.parse(config);

// 建立 UDP Server 物件
var dgram = require('dgram');
var udp_server = dgram.createSocket('udp4');

// UDP Server 開始監聽事件
udp_server.on('listening', function () {
    var address = udp_server.address();
    logger.info('Alarm UDP Server listening on ' + address.address + ':' + address.port);
});

// UDP Server 收到資料
udp_server.on('message', function (_message, remote) {
    logger.info(remote.address + ':' + remote.port + ' - ' + _message);
    _message = _message.toString('utf8');
    var module;
    var alarm_id;
    var content;
    var ip = remote.address;
    var level = 1;

    // TG-X:00:Media Gateway Sartup
    try {
        module = _message.split(':')[0];
        alarm_id = _message.split(':')[1];
        level = _message.split(':')[2];
        content = _message;

        var message = {
            AlarmID: alarm_id,
            Module: module,
            Message: content,
            IP: ip,
            Level: level
        }
        sendMessage(module, alarm_id, _message);
        // 將 Alarm Message POST 給 HTTP Server
        var options = {
            host: config.post_host,
            path: config.post_path,
            port: 33334,
            method: 'POST',
            headers: {
                'Content-Length': JSON.stringify(message).length
            }
        };
        var http = require('http');
        var req = http.request(options, function (res) {
            var responseText = '';
            res.setEncoding('utf8');
            res.body = '';
            // 請求後接收 HTTP Server 回傳的資料
            res.on('data', function (chunk) {
                this.res.body += chunk;
            }.bind({ res: res }));
            // HTTP Server 回傳的資料全部傳送完畢
            res.on('end', function () {
                console.info('Response: ' + this.res.body);
            }.bind({ res: res }));
        });
        req.on('error', function (err) {
            console.info('Response: ' + err);
        });
        // 執行 POST 請求
        req.write(JSON.stringify(message));
        req.end();
    } catch (e) {
    }
});

// 啟動 UDP Server
udp_server.bind(config.udp_port, config.op_host);

// HTTP POST Server (模擬測試)
function onRequest(req, res) {
    if (req.method === 'POST') {
        logger.info('Alarm request received.');
        req.body = '';
        req.on('data', function (chunk) {
            this.req.body += chunk;
        }.bind({ req: req }));
        req.on('end', function () {
            logger.info('Alarm message: ' + this.req.body);
            this.res.writeHead(200, { 'Content-Type': 'text/plain' });
            this.res.end('Success');
        }.bind({ req: req, res: res }));
    }
}
try {
    require('http').createServer(onRequest).listen(config.post_port, config.post_host);
    logger.info('HTTP Server has started.');
} catch (e) {

}

var http = require('http');
var port = process.env.PORT || config.op_port;///////////////////////////////////////////
var express = require('express');
var bodyParser = require('body-parser');
//var hashtable = require(__dirname + '\\hashtable');
var mysql = require('mysql'); // mysql
var fs = require('fs');
var url = require("url");
var app = express();
//var server = http.Server(app).listen(config.op_port);
var server = http.Server(app).listen(port);
var jwtDecode = require('jwt-decode');

var path = process.env.deployPath || '';
var db = require('./db');
//mysql----------------------------------------------------------------------------------------------------------------
var pool = mysql.createPool({
    connectionLimit: 100,
    host: db.host, //如果database在另一台機器上，要改這裡
    user: db.user,
    password: db.password,
    database: db.database, //要抓的database名稱
    waitForConnections: true
});

route(app);
function route(app) {
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());

    app.get(path + '/api', function (req, res) {
        res.send('API is running');
    });
    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
        next();
    });
    app.use(express.static(__dirname + '/pages/CSS'));
    app.use(express.static(__dirname + '/pages/Images'));
    app.use(express.static(__dirname + '/pages/Scripts'));
    app.use(express.static(__dirname + '/pages/Sounds'));

    app.use(express.static('pages/css'));
    app.use(express.static('pages/images'));
    app.use(express.static('pages/scripts'));
    app.use(express.static('pages/sounds'));
    app.get(path + '/pages/config', function (req, res) {
        //logger.info('GET /config request');
        res.header("Content-Type", 'text/html');
        fs.readFile(__dirname + '/pages/Setting.htm', 'utf8', function (err, data) {
            if (err) {
                res.send(err);
            }
            data = data +
                '<script type="text/javascript"> var ServiceUrl = "' + config.op_host + ':' + config.op_port + '"; </script>';
            data = data +
                '<script type="text/javascript">var Modules = ' + JSON.stringify(config.modules) + '; </script>';
            res.send(data);
        });
    });

    //////////////////////////////////////////////////////////////////////////////////////
    app.get("/login", function (request, response) {
        logger.info('-------------------------------------------login-------------------------------------------');
        try {
            var page = request.params.page;
            //下面的跳轉網頁會跳轉到line登入的頁面，同時會在那邊進行登入 然後跳轉到conig的redirect_uri
            response.redirect('https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=' + config.login_channel_id + '&redirect_uri=' + config.login_redirect_uri + '/pages/user' + '&state=reportAuth&scope=openid%20profile&nonce=myapp&bot_prompt=aggressive');
        } catch (err) {
            logger.info(err);
        }

    });//
    app.get('/pages/AlarmMod', function (req, res) {
        //res.header("Content-Type", 'text/html');
        var model_data = [];
        pool.getConnection(function (error, connection) {
            if (error) logger.info('/pages/AlarmMod DB error: ' + error);
            else {
                connection.query("SELECT * FROM alarmdata ", function (err, result) {
                    var sql;
                    if (err)
                        logger.info('/pages/AlarmMod DB error: ' + err);
                    else {
                        fs.readFile(__dirname + '/pages/AlarmMod.htm', 'utf8', function (err, data) {
                            if (err) {
                                logger.info(err);
                            }
                            else {
                                for (var idx in result) {
                                    model_data[idx] = {
                                        model: result[idx].model,
                                        ID_data: []
                                    }

                                    if (result[idx].ID != '""') {
                                        var ID = JSON.parse(result[idx].ID);
                                        var description = JSON.parse(result[idx].description);
                                        for (var idy = 0; idy < ID.length; idy++) {
                                            model_data[idx].ID_data[idy] = {
                                                ID: ID[idy],
                                                description: description[idy]
                                            }
                                        }
                                    }

                                }
                                logger.info(model_data);

                                data = data + '<script type="text/javascript"> var model_data = ' + JSON.stringify(model_data) + ';</script>';
                            }
                            res.send(data);
                            connection.release();
                        });
                    }
                });
            }
        });
    });
    
        app.get('/pages/user', function (req, res) {
            res.header("Content-Type", 'text/html');
    
            var pathname = url.parse(req.url).query;
            logger.info('/pages/user_pathname: ' + pathname);
    
            //獲得user_profile並解碼
            if (String(pathname).indexOf("error_description") < 0) {
                var mid;
                GetUserProfile(pathname, function (data) {
                    if (data != false) {
                        var profile = JSON.parse(data);
                        //friendship_status(profile.access_token);
                        var decode = jwtDecode(profile.id_token);
                        logger.info('decode: ' + JSON.stringify(decode));
                        mid = decode.sub;
                        var profile_data = {
                            'memberId': decode.sub,
                            'displayName': decode.name,
                            'pictureUrl': decode.picture,
                            'statusMessage': 'statusMsg',
                            //'access_token': profile.access_token,
                        }
                        req.header("Content-Type", 'text/html');
                        var model_data = [];
                        pool.getConnection(function (error, connection) {
                            if (error) logger.info('/pages/user DB error: ' + error);
                            else {
                                connection.query("SELECT * FROM alarmdata ", function (err, result) {
                                    var sql;
                                    if (err)
                                        logger.info('/pages/user DB error: ' + err);
                                    else {
                                        fs.readFile(__dirname + '/pages/user.htm', 'utf8', function (err, data) {
                                            if (err) {
                                                logger.info('fs.readFile /pages/user.htm: ' + err);
                                            }
                                            else {
                                                for (var idx in result) {
                                                    model_data[idx] = {
                                                        model: result[idx].model,
                                                        ID: JSON.parse(result[idx].ID),
                                                        description: JSON.parse(result[idx].description)
                                                    }
                                                }
                                                logger.info(model_data);
    
                                                data = data + '<script type="text/javascript"> var model_data = ' + JSON.stringify(model_data) + ';' +
                                                'var mid = "' + mid + '";</script>';
                                            }
                                            res.send(data);
                                            connection.release();
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        logger.info('加入好友畫面');
                        res.send('<div align="center"><h2>請先加入好友</h2><br><a href="https://line.me/R/ti/p/%40nee4889m">加入好友</a></div>');
                    }
                });
            } else {
                logger.info('取得使用者資訊錯誤。');
                res.send('<div align="center"><h1>無法取得權限</div>');
            }
        });
    
    app.post('/api/dbStore', function (request, response) {
        var storeData = request.body.model_data;
        logger.info('/api/dbStore_store_data: ' + JSON.stringify(storeData));
        var model_data = [];
        var times = 0;

        for (var idx = 0; idx < storeData.length; idx++) {
            model_data[idx] = {
                model: storeData[idx].model,
                ID: [],
                description: []
            };
            for (var idy = 0; idy < storeData[idx].ID_data.length; idy++) {
                model_data[idx].ID[idy] = storeData[idx].ID_data[idy].ID;
                model_data[idx].description[idy] = storeData[idx].ID_data[idy].description
            }
        }
        logger.info('/api/dbStore_model_data: ' + JSON.stringify(model_data));
        pool.getConnection(function (error, connection) {
            if (error) logger.info('saveToAlarmDB error: ' + error);
            else {
                connection.query("DELETE FROM iddescription ", function (err, result) {
                    var sql;
                    if (err) {
                        logger.info('dbStore_DescriptionDB delete error: ' + err);
                    }
                    else {
                        for (var idx = 0; idx < storeData.length; idx++) {
                            //logger.info(storeData[idx].model + "   " + storeData[idx].ID);
                            saveToAlarmDB(model_data[idx].model, model_data[idx].ID, model_data[idx].description, function (rst) {
                                if (rst)
                                    times++;
                                else {
                                    response.send("change alarmDB fail");
                                }
                                if (times == storeData.length) {
                                    response.send("change alarmDB success");
                                }
                            });
                            for (var idy in storeData[idx].ID_data) {
                                saveToDescriptionDB(model_data[idx].model, storeData[idx].ID_data[idy].ID, storeData[idx].ID_data[idy].description);
                            }
                        }
                    }
                    connection.release();
                });
            }
        });

    });
    app.post('/api/subThisModel', function (request, response) {
        //var todo = request.body.todo;
        var mid = request.body.mid;
        var model = request.body.model;
        var thisModel_data = request.body.thisModel_data;
        var user_data = request.body.user_data;
        var sql;
        logger.info("/api/subThisModel request.body: " + JSON.stringify(request.body, null, 2));
        for (var i in user_data) {
            if (user_data[i].model == model) {
                sql = "UPDATE subcontain SET ID = '" + JSON.stringify(thisModel_data.ID) + "' WHERE model = '" + model + "' AND mid = '" + mid + "'";
                break;
            }
            sql = "INSERT INTO subcontain (mid, model, ID) VALUES ('" + mid + "', '" + model + "', '" + JSON.stringify(thisModel_data.ID) + "')";
        }
        if (sql == null) {
            sql = "INSERT INTO subcontain (mid, model, ID) VALUES ('" + mid + "', '" + model + "', '" + JSON.stringify(thisModel_data.ID) + "')";
        }
        pool.getConnection(function (error, connection) {
            if (error) {
                logger.info('/api/subThisModel DB error: ' + error);
            }
            else {
                connection.query(sql, function (err, result) {
                    if (err) {
                        logger.info('/api/subThisModel DB error: ' + err);
                        response.send('error');
                    }
                    else {
                        response.send('success');
                        logger.info('/api/subThisModel success');
                        connection.release();
                    }
                });
            }
        });

    });
    app.post('/api/subAllModel', function (request, response) {
        //var todo = request.body.todo;
        var mid = request.body.mid;
        var model_data = request.body.model_data;
        logger.info("/api/subAllModel request.body: " + JSON.stringify(request.body, null, 2));

        var sql = "DELETE FROM subcontain WHERE mid = '" + mid + "'";
        var times = 0;


        var flag = 0;
        if (mid == null) {
            logger.info('/api/subAllModel mid is null');
            flag = 1;
        }
        if (model_data == null) {
            logger.info('/api/subAllModel model_data is null');
            flag = 1;
        }
        if (flag == 1) {
            response.send("error");
            return;
        }

        pool.getConnection(function (error, connection) {
            if (error) logger.info('/api/subAllModel DB error: ' + error);
            else {
                connection.query(sql, function (err, result) {
                    if (err) {
                        throw err;
                        logger.info('/api/subAllModel DB error: ' + err);
                    }
                    else {
                        logger.info('/api/subAllModel success');
                        for (var i in model_data) {
                            saveToSubDB(mid, model_data[i].model, model_data[i].ID, function (rst) {
                                if (rst)
                                    times++;
                                else {
                                    logger.info("/api/subAllModel change SubDB fail");
                                    response.send("error");
                                }
                                if (times == model_data.length) {
                                    logger.info("/api/subAllModel change SubDB success");
                                    response.send("success");
                                }
                            });
                        }
                    }
                    connection.release();
                });
            }
        });

    });
    app.post('/api/delModel', function (request, response) {
        //var todo = request.body.todo;
        var mid = request.body.mid;
        var model = request.body.model;
        var todo = request.body.todo;
        logger.info("/api/delModel request.body: " + JSON.stringify(request.body, null, 2));

        var flag = 0;
        if (mid == null) {
            logger.info('/api/delModel mid is null');
            flag = 1;
        }
        if (todo == null) {
            logger.info('/api/delModel todo is null');
            flag = 1;
        }
        if (todo == 'delThisModel') {
            if (model == null) {
                logger.info('/api/delModel model is null');
                flag = 1;
            }
            var sql = "DELETE FROM subcontain WHERE mid = '" + mid + "' AND model = '" + model + "'";
        }
        else if (todo == 'delAllModel')
            var sql = "DELETE FROM subcontain WHERE mid = '" + mid + "'";

        if (flag == 1) {
            response.send("error");
            return;
        }

        pool.getConnection(function (error, connection) {
            if (error) logger.info('/api/delModel DB error: ' + error);
            else {
                connection.query(sql, function (err, result) {
                    if (err) {
                        throw err;
                        logger.info('/api/delModel DB error: ' + err);
                        response.send("error");
                    }
                    else {
                        logger.info("/api/delModel change SubDB success");
                        response.send("success");

                    }
                    connection.release();
                });
            }
        });

    });
    app.post('/api/subContain', function (request, response) {
        var todo = request.body.todo;
        var mid = request.body.mid;
        var model = request.body.model;
        var ID = request.body.ID;
        var sql;
        logger.info('/api/subContain body: ' + JSON.stringify(request.body));
        switch (todo) {
            case 'addSub':
                logger.info('addSub')
                sql = "INSERT INTO subcontain (mid, model, ID) VALUES ('" + mid + "', '" + model + "', '" + JSON.stringify(ID) + "')";
                break;
            case 'updateSub':
                logger.info('updateSub')
                sql = "UPDATE subcontain SET ID = '" + JSON.stringify(ID) + "' WHERE model = '" + model + "' AND mid = '" + mid + "'";
                break;
            case 'deleteSub':
                sql = "DELETE FROM subcontain WHERE model = '" + model + "' AND mid = '" + mid + "'";
                break;
        }
        pool.getConnection(function (error, connection) {
            if (error) logger.info('/api/subContain DB error: ' + error);
            else {
                connection.query(sql, function (err, result) {
                    if (err) {
                        logger.info('/api/subContain DB error: ' + err);
                        response.send('error');
                    }
                    else {
                        response.send('success');
                        logger.info('/api/subContain success');
                        connection.release();
                    }
                });
            }

        });

    });
    app.get('/api/listPDatasetInfoToShow', function (request, response) {
        var mid = request.query.mid;
        logger.info(mid);
        pool.getConnection(function (error, connection) {
            if (error) logger.info('/api/listPDatasetInfoToShow DB error: ' + error);
            else {
                connection.query("SELECT ID, model FROM subcontain WHERE mid='" + mid + "'", function (err, result) {
                    var rst = {
                        result: '',
                        data: []
                    };
                    if (err)
                        logger.info('/api/listPDatasetInfoToShow DB error: ' + err);
                    else {
                        if (result == '') {
                            rst = {
                                result: false,
                            };
                        }
                        else {
                            rst = {
                                result: true,
                                data: result
                            };
                        }
                        logger.info('/api/listPDatasetInfoToShow: ' + JSON.stringify(result, null, 2));

                        response.send(rst);
                        connection.release();

                    }
                });
            }
        });

    });
}///////////////////////////////////////////////////////////////////////////////////////////////////////////
function sendMessage(model, ID, msg) {
    logger.info('sendMessage');
    pool.getConnection(function (error, connection) {
        if (error) logger.info('sendMessage error: ' + error);
        else {
            connection.query("SELECT mid, ID FROM subcontain WHERE model='" + model + "'", function (err, result) {
                if (err)
                    logger.info('sendMessage error: ' + err);
                else {
                    
                    connection.query("SELECT description FROM iddescription WHERE (model='" + model + "' AND ID = '" + ID + "')", function (err, result1) {
						logger.info('result1: '+JSON.stringify(result1));
                        for (var idx in result) {
							var db_ID = JSON.parse(result[idx].ID);
							for(var idy in db_ID){
								if (db_ID[idy] == ID) {
									var send_data = {
										'to': result[idx].mid,
										'messages': [
											{
												'type': 'text',
												'text': '模組: ' + model + " ID: " + ID + "(" + result1[0].description + ") 訊息: " + msg
											}
										]
									};
									PostToLINE(send_data, config.message_channel_access_token, function (rst) {
										if (rst) {
											logger.info('PostToLINE success');
										}
									});
									break;
								}
							}               
                        }
                    });
                    connection.release();
                }
            });
        }
    });
}
function saveToDescriptionDB(model, ID, description) {
    logger.info('saveToDescriptionDB_data: ' + model + ', ' + ID + ', ' + description);
    pool.getConnection(function (error, connection) {
        if (error) logger.info('saveToAlarmDB error: ' + error);
        else {
            connection.query("INSERT INTO iddescription (model, ID, description) VALUES ('" + model + "', '" + ID + "', '" + description + "')", function (err, result) {
                var sql;
                if (err) {
                    logger.info('saveToDescriptionDB INSERT error: ' + err);
                }
                else {
                    logger.info('saveToDescriptionDB INSERT success: ');
                }
                connection.release();
            });
        }
    });
}
function saveToAlarmDB(model, ID, description, callback) {
    pool.getConnection(function (error, connection) {
        if (error) logger.info('saveToAlarmDB error: ' + error);
        else {
            connection.query("SELECT * FROM alarmdata WHERE (model = '" + model + "')", function (err, result) {
                var sql;
                if (err) {
                    logger.info('saveToAlarmDB error: ' + err);
                    callback(false);
                }
                else {
                    if (result == '')
                        sql = "INSERT INTO alarmdata (model, ID, description) VALUES ('" + model + "', '" + JSON.stringify(ID) + "', '" + JSON.stringify(description) + "')";
                    else {
                        if (ID.length == 1 && ID[0] == null)
                            sql = "DELETE FROM alarmdata WHERE model = '" + model + "'";
                        else
                            sql = "UPDATE alarmdata SET ID = '" + JSON.stringify(ID) + "', description = '" + JSON.stringify(description) + "' WHERE model = '" + model + "'";
                    }

                    connection.query(sql, function (error, result) {
                        logger.info(sql);
                        if (error) {
                            logger.info(error);
                            callback(false);
                        }
                        else {
                            logger.info(result.affectedRows + " record(s) updated/insert");
                            callback(true);
                        }
                        connection.release();
                    });
                }
            });
        }
    });
}
function saveToSubDB(mid, model, ID, callback) {
    pool.getConnection(function (error, connection) {
        if (error) logger.info('saveToSubDB error: ' + error);
        else {
            connection.query("INSERT INTO subcontain (mid, model, ID) VALUES ('" + mid + "', '" + model + "', '" + JSON.stringify(ID) + "')", function (err, result) {
                var sql;
                if (err) {
                    logger.info('saveToSubDB error: ' + err);
                    callback(false);
                }
                else {
                    logger.info(result.affectedRows + " record(s) updated/insert");
                    callback(true);
                }
                connection.release();
            });
        }
    });
}
function GetUserProfile(pathname, callback) {
    var code, state, friendship_status_changed = null;
    logger.info("GetUserProfile_path: " + pathname);
    logger.info('String(pathname).indexOf("friendship_status_changed"): ' + String(pathname).indexOf("friendship_status_changed"));
    if (String(pathname).indexOf("friendship_status_changed") > -1) {
        //friendship_status_changed=false&code=8d2jdhSMLLy9jezXmNsj&state=reportAuth
        logger.info('have friendship_status_changed');
        friendship_status_changed = String(pathname).split("=")[1].split("&")[0];
        code = String(pathname).split("=")[2].split("&")[0];
        state = String(pathname).split("=")[3];
    } else {
        logger.info('no have friendship_status_changed');
        code = String(pathname).split("=")[1].split("&")[0];
        state = String(pathname).split("=")[2];
    }
    logger.info('friendship_status_changed: ' + friendship_status_changed + ' code: ' + code + ' state: ' + state);
    var data = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: config.login_redirect_uri + '/pages/user',
        client_id: config.login_channel_id,
        client_secret: config.login_channel_secret
    }

    var postdata = "grant_type=" + data.grant_type + "&code=" + data.code + "&redirect_uri=" + data.redirect_uri + "&client_id=" + data.client_id + "&client_secret=" + data.client_secret;
    var options = {
        host: 'api.line.me',
        port: '443',
        path: '/oauth2/v2.1/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Content-Length': Buffer.byteLength(postdata)
        }
    };
    var https = require('https');
    var req = https.request(options, function (res) {
        var access;
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            logger.info('Response: ' + chunk);
            if (friendship_status_changed == null || friendship_status_changed == 'true') {
                if (access == true) {
                    callback(chunk);
                }
            }
            else callback(false);
        });
        res.on('end', function () {
        });
        logger.info('Reply message status code: ' + res.statusCode);
        if (res.statusCode == 200) {
            logger.info('Reply message success');
            access = true;
        } else {
            logger.info('Reply message failure');
            access = false;
        }
    });
    req.write(postdata);
    req.end();

};

function PostToLINE(data, channel_access_token, callback) {
    logger.info('PostToLINE: ' + JSON.stringify(data));
    var options = {
        host: 'api.line.me',
        port: '443',
        path: '/v2/bot/message/push',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Content-Length': Buffer.byteLength(JSON.stringify(data)),
            'Authorization': 'Bearer <' + channel_access_token + '>'
        }
    };
    var https = require('https');
    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            logger.info('Response: ' + chunk);
        });
    });
    req.write(JSON.stringify(data));
    req.end();
    try {
        callback(true);
    } catch (e) { };
}
