var app = require('express')();
// ﻿var router = require('express').Router();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
// var fs=require('fs');
console.log(123);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client.html');
});
app.get('/jquery.js', function (req, res) {
    res.sendFile(__dirname + '/js/jquery-1.12.3.min.js');
});
app.get('/iscroll.js', function (req, res) {
    res.sendFile(__dirname + '/js/iscroll.js');
});
app.get('/emoji.js', function (req, res) {
    res.sendFile(__dirname + '/js/emoji.js');
});
app.get('/emoji.css', function (req, res) {
    res.sendFile(__dirname + '/style/emoji.css');
});
app.get('/emoji.png', function (req, res) {
    res.sendFile(__dirname + '/imgs/emoji.png');
});
app.get('/bootstrap.min.css', function (req, res) {
    res.sendFile(__dirname + '/bootstrap-3.3.5/css/bootstrap.min.css');
});
app.get('/bootstrap.min.js', function (req, res) {
    res.sendFile(__dirname + '/bootstrap-3.3.5/js/bootstrap.min.js');
});
app.get('/reset.css', function (req, res) {
    res.sendFile(__dirname + '/style/reset.css');
});
app.get('/client.css', function (req, res) {
    res.sendFile(__dirname + '/style/client.css');
});
app.get('/imgs/:imgname', function (req, res) {
    res.sendFile(__dirname + '/imgs/'+req.params.imgname);
});
app.get('/fonts/:fontname', function (req, res) {
    res.sendFile(__dirname + '/fonts/'+req.params.fontname);
});
http.listen(5050, function () {
    console.log('listening on *:5050');
});

// router.get('/img/:imgname',function (req,res){
//   console.log(req.params.imgname);  //测试1
//   const rs=fs.createReadStream('imgupload/'+req.params.imgname);//获取图片的文件名
//   rs.pipe(res);
// })
function wsSend(type, client_uuid, nickname, message, head) {
    io.emit(type, JSON.stringify({
        "type": type,
        "id": client_uuid,
        "nickname": nickname,
        "message": message,
        "head": head
    }));
}
var clientIndex = 1;
var clients = [];
io.on('connection', function (socket) {
    console.log(socket.handshake.query.ouser);
    var ouser = socket.handshake.query.ouser;
    var client_uuid,nickname,nickhead,connect_message ;
    if(ouser){
        client_uuid = JSON.parse(ouser).id,
        nickname = JSON.parse(ouser).nickname,
        nickhead = JSON.parse(ouser).head,
        connect_message = "<span class='hl'>" + nickname + "</span> 已上线";
        wsSend("online", client_uuid, nickname, connect_message, nickhead);
    }else{
        // client_uuid = uuid.v4();
        client_uuid = socket.handshake.query.nuser;
        nickname = "用户" + clientIndex;
        clientIndex += 1;
        clients.push({ "id": client_uuid, "nickname": nickname, "head": nickhead });
        connect_message = "<span class='hl'>" + nickname + "</span> 加入群聊";
        wsSend("fonline", client_uuid, nickname, connect_message, nickhead);
    }
    console.log('client [%s] connected', client_uuid);
    console.log('client [%s] connected', client_uuid);
    socket.on('message', function (message) {
        wsSend("message", client_uuid, nickname, message, nickhead);
    });
    socket.on('nick_update', function (nick) {
        var old_nickname = nickname;
        nickname = nick;
        var nickname_message = "<span class='hl'>" + old_nickname + "</span> 改名为 <span class='hl'>" + nickname + "</span>";
        wsSend("nick_update", client_uuid, nickname, nickname_message, nickhead);
    });
    socket.on('head_update', function (head) {
        nickhead = head;
        wsSend("head_update", client_uuid, nickname, "", nickhead);
    });

    var closeSocket = function (customMessage) {
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].id == client_uuid) {
                var disconnect_message;
                if (customMessage) {
                    disconnect_message = customMessage;
                } else {
                    disconnect_message = "<span class='hl'>" + nickname + "</span> 已下线";
                }
                wsSend("offline", client_uuid, nickname, disconnect_message, nickhead);
                clients.splice(i, 1);
            }
        }
    };
    socket.on('disconnect', function () {
        closeSocket();
    });
    process.on('SIGINT', function () {
        console.log("Closing things");
        closeSocket('Server has disconnected');
        process.exit();
    });


});
