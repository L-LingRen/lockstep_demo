var last_update = Date.now();
var interval = setInterval(function () {
    var now = Date.now();
    var dt = now - last_update;
    last_update = now;
    update(dt);
});
// clearInterval(interval);

// 由于每台计算机的性能参差不齐, 所以需要统一每台计算机的逻辑帧频率
// 并且这里假设update频率远高于logic_update, 否则认为配置不够
var accumulated_frame_time = 0;
var logic_frame_interval = 20; //单位: ms, 每n毫秒执行一帧逻辑帧
function update(dt) {
    accumulated_frame_time += dt;
    if (accumulated_frame_time > logic_frame_interval) {
        logic_update(logic_frame_interval);
        accumulated_frame_time -= logic_frame_interval;
    }

    scene_update(dt);
}

var game_frame = 0;
var logic_frame = 0;
function logic_update(dt) {
    if (game_frame == 0 && logic_frame == 0) {
        var input = {
            "frame": logic_frame,
            "input": input_direction,
        };
        client.send_time_out(input);
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
            var player = net_player;
            player.velocity.x = 0;
            player.velocity.y = 0;
            // console.log("收到的输入", last_packet);
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

            player.position.x += player.velocity.x * (dt / 1000);
            player.position.y += player.velocity.y * (dt / 1000);

            logic_frame = next_frame;
        } else {
            console.log("等待不到控制包信息", logic_frame);
        }
    } else {
        game_frame++;
        // console.log("不执行逻辑, 此期间应该正在scene_update进行平滑渲染");
    }
}

// 渲染, update函数每台计算机的频率不一样
// 因此平滑渲染以最快的速度跟上逻辑帧
var net_player_element;
var accumulated_show_frame = 0;
function scene_update(dt) {

    if (!net_player_element) {
        net_player_element = $('#net_player');
    }

    var old_position_x = parseInt(net_player_element.css("left"));
    var old_position_y = parseInt(net_player_element.css("top"));

    // 如果player的速度太快, 会导致abs_df过大, 在下一个logic_update前跟不上
    var follow_speed = net_player.speed * dt / 1000;// 但这样会因dt不固定导致移动很生硬
    if (follow_speed < 1) {// css的top等属性不能设置小数
        follow_speed = 1;
    }

    var df = net_player.position.x - old_position_x;
    var abs_df = Math.abs(df);

    if (abs_df >= 1) {
        var temp = old_position_x + df / abs_df * follow_speed;
        net_player_element.css("left", temp + "px");
    }



    df = net_player.position.y - old_position_y;
    abs_df = Math.abs(df);

    if (abs_df >= 1) {
        var temp = old_position_y + df / abs_df * follow_speed;
        net_player_element.css("top", temp + "px");
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
        }, 25);//延迟25ms发送
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
    this.speed = 100;  // 每秒移动n px

    this.velocity = new Object();
    this.velocity.x = 0;
    this.velocity.y = 0;

    this.position = new Object();
    this.position.x = 0;
    this.position.y = 0;
}