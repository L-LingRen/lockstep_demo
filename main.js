var last_update = Date.now();
var interval = setInterval(function () {
    var now = Date.now();
    var dt = now - last_update;
    last_update = now;
    update(dt);
});
// clearInterval(interval);

// 由于每台计算机的性能参差不齐, 所以需要统一每台计算机的逻辑帧频率
var accumulated_frame_time = 0;
var logic_frame_interval = 20; //单位: ms, 每n毫秒执行一帧逻辑帧
function update(dt) {
    accumulated_frame_time += dt;
    if (accumulated_frame_time > logic_frame_interval) {
        logic_update();
        accumulated_frame_time -= logic_frame_interval;
    }

    scene_update(dt);
}

var game_frame = 0;
var logic_frame = 0;
function logic_update() {
    if (game_frame == 0 && logic_frame == 0) {
        var input = {
            "frame": logic_frame,
            "input": input_direction,
        };
        client.send(input);
        console.log("初始化发送");
    }

    if (game_frame == logic_frame) {
        // 获取更新包
        var last_packet;
        while(client.packets.length > 0) {
            last_packet = client.packets.shift();
            if (last_packet.frame == logic_frame) {
                break;
            }
        }

        if (last_packet && last_packet.frame == logic_frame) {
            var next_frame = logic_frame + 1; // 1个逻辑帧发送一次
            // 采集当前的输入作为包发送(最后一次的输入)
            var input = {
                "frame": next_frame,
                "input": input_direction,
            };
            client.send_time_out(input);
            // console.log("发送的输入", input);

            // 以last_packet.input做输入数据(此时是next_frame - 1数据)
            // 模拟移动本地及网络客户端
            // 每个客户端的逻辑一致
            // TO_DO()....
            var player = net_player;
            player.velocity.x = 0;
            player.velocity.y = 0;
            console.log("收到的输入", last_packet);
            switch(last_packet.input) {
                case 38: 
                    player.velocity.y = -player.speed;
                    break;
                case 40: 
                    player.velocity.y = player.speed;
                    break;
                case 37: 
                    player.velocity.x = -player.speed;
                    break;
                case 39: 
                    player.velocity.x = player.speed;
                    break;
            }

            logic_frame = next_frame;
        } else {
            console.log("等待不到控制包信息", logic_frame);
        }
    } else {
        game_frame++;
        console.log("不执行逻辑, 此期间应该正在scene_update进行平滑渲染");
    }
    // scene_update(10);
}

// 渲染改动, 不稳定, update函数每台计算机的频率不一样
var net_player_element;
var accumulated_show_frame = 0;
function scene_update(dt) {

    // 由于css里top等属性不能设置小数，因此改成达到1px的时间时才进行渲染
    accumulated_show_frame += dt;
    var target_frame = 1000 / net_player.speed; // player速度100px/1000ms, 则1px/10ms
    if (accumulated_show_frame > target_frame) {

        if (!net_player_element) {
            net_player_element = $('#net_player');
        }

        if (net_player.velocity.x != 0) {
            var old_x = parseInt(net_player_element.css("left"));
            var temp = old_x + net_player.velocity.x / net_player.speed; // 不能直接设置1, 因为方向不能丢, 所以进行单位化
            net_player_element.css("left", temp + "px");
        }

        if (net_player.velocity.y != 0) {
            var old_y = parseInt(net_player_element.css("top"));
            var temp = old_y + net_player.velocity.y / net_player.speed; // 不能直接设置1, 因为方向不能丢, 所以进行单位化
            net_player_element.css("top", temp + "px");
        }

        accumulated_show_frame -= target_frame;
    }
}

// 模拟socket
var client = new Client();
function Client() {
    this.packets = new Array();

    // 模拟无延迟发送
    this.send = function (input) {
        this.receive(input);
    }

    // 模拟延迟发送
    this.send_time_out = function (input) {
        setTimeout(function () {
            client.send(input);
        }, 100);//延迟25ms发送
    }

    // 模拟接收
    this.receive = function (input) {
        this.packets.push(input);
    }
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


// var local_player = new Player();
var net_player = new Player();
function Player() {
    this.speed = 100;  // 每秒10px

    this.velocity = new Object();
    this.velocity.x = 0;
    this.velocity.y = 0;
}