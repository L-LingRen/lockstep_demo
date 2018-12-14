
// var local_player = new Player();
var net_player = new Player();
function Player() {
    this.speed = 1000;  // 每秒移动n px

    this.velocity = new Object();
    this.velocity.x = 0;
    this.velocity.y = 0;

    this.position = new Object();
    this.position.x = 0;
    this.position.y = 0;
}

// 键盘监听
var input_direction = 0;
$(document).keydown(function(e) {
    switch(e.keyCode) {
        case 38: //上
            input_direction = 38;
            break;
        case 40: //下
            input_direction = 40;
            break;
        case 37: //左
            input_direction = 37;
            break;
        case 39: //右
            input_direction = 39;
            break;
    }
}).keyup(function (e) {
    switch(e.keyCode) {
        case 38: 
            input_direction = 0;
            break;
        case 40: 
            input_direction = 0;
            break;
        case 37: 
            input_direction = 0;
            break;
        case 39: 
            input_direction = 0;
            break;
    }
});

// // 模拟按住↓方向键1000ms
// var input_direction = 40; 
// setTimeout(function(){input_direction = 0;}, 1000);

// 模拟游戏引擎的update
var last_update = Date.now();
var interval = setInterval(function () {
    var now = Date.now();
    var dt = now - last_update;
    last_update = now;
    update(dt);
});
// clearInterval(interval);

// 并且这里假设update频率远高于logic_update, 否则认为配置不够
var accumulated_frame_time = 0;
var logic_frame_interval = 50; //单位: ms, 每n毫秒执行1帧逻辑帧
function update(dt) {
    accumulated_frame_time += dt;
    if (accumulated_frame_time > logic_frame_interval) {
        logic_update(logic_frame_interval);
        accumulated_frame_time -= logic_frame_interval;
    }

    // 在此渲染, dt会比较小, 即时间切片是运行的代码机器里最小的, 渲染流畅
    scene_update(dt);
}

var logic_frame = 0;
function logic_update(dt) {
    // console.log("1000ms应该跑20次才对");
    
    if (logic_frame == 0) {
        var input = {
            "frame": logic_frame,
            "input": input_direction,
        };
        client.send(input);
        // console.log("初始化发送");
    }
    
    // 获取更新包
    var last_packet;
    while(client.packets.length > 0) {
        last_packet = client.packets.shift();
        if (last_packet.frame == logic_frame) {
            break;
        }
    }

    if (last_packet && last_packet.frame == logic_frame) {
        var next_frame = ++logic_frame;

        // 采集当前的输入作为包发送(最后一次的输入)
        var input = {
            "frame": next_frame,
            "input": input_direction,
        };
        client.send_time_out(input);
        // console.log("发送的输入", input);

        // 以last_packet.input做输入数据(此时是next_frame - 1数据)
        // 模拟移动本地及网络客户端, 每个客户端的逻辑一致
        net_player.velocity.x = 0;
        net_player.velocity.y = 0;
        // console.log("收到的输入", last_packet);
        switch(last_packet.input) {
            case 38: 
                net_player.velocity.y = -net_player.speed;
                break;
            case 40: 
                net_player.velocity.y = net_player.speed;
                break;
            case 37: 
                net_player.velocity.x = -net_player.speed;
                break;
            case 39: 
                net_player.velocity.x = net_player.speed;
                break;
        }

        net_player.position.x += (net_player.velocity.x * dt / 1000);
        net_player.position.y += (net_player.velocity.y * dt / 1000);
    } else {
        console.log("等待不到控制包信息, 卡顿等待", logic_frame);
    }

    // 在此渲染, dt会比较大, 即时间切片较大, 渲染不流畅
    // scene_update(dt);
}

// 让画面流畅的诀窍在于scene_update"刚好"在下一逻辑帧前一刻完成渲染
var net_player_element;
function scene_update(dt) {

    if (!net_player_element) {
        net_player_element = $('#net_player');
    }

    var old_position_x = parseInt(net_player_element.css("left"));
    var old_position_y = parseInt(net_player_element.css("top"));

    var df = net_player.position.x - old_position_x;
    var abs_df = Math.abs(df);

    if (abs_df >= 2) { // 防抖动, 缺陷是和逻辑位置有1~2个像素偏差
        var ddf = df / abs_df * net_player.speed * dt / 1000;
        ddf = ddf > 0 ? Math.ceil(ddf) : Math.floor(ddf);
        var temp = old_position_x + ddf;
        net_player_element.css("left", temp + "px");
    }



    df = net_player.position.y - old_position_y;
    abs_df = Math.abs(df);

    if (abs_df >= 2) {
        var ddf = df / abs_df * net_player.speed * dt / 1000;
        ddf = ddf > 0 ? Math.ceil(ddf) : Math.floor(ddf);
        var temp = old_position_y + ddf;
        net_player_element.css("top", temp + "px");
    }
}

// 模拟socket
var client = new Client();
function Client() {
    this.packets = new Array();
    // this.packets = [
    //     {
    //         "frame": next_frame,
    //         "input": input_direction,
    //     }, 
    // ];

    // 模拟无延迟发送
    this.send = function (input) {
        this.receive(input);
    }

    // 模拟延迟发送, 网络延迟大于logic_frame_interval时才会出现卡顿
    this.send_time_out = function (input) {
        setTimeout(function () {
            client.send(input);
        }, 25);//延迟25ms发送
    }

    // 模拟接收
    this.receive = function (input) {
        this.packets.push(input);
    }
}