const logger = new NIL.Logger(`test`); // 声明logger
const path = require(`path`); // 声明路径
const { encode } = require("punycode");
const request = require(`sync-request`);

let vanilla_cfg = NIL._vanilla.cfg; // 读取/vanilla/config.json文件并将JSON对象转化为object
let main_id = vanilla_cfg.group.main; // 读取config中的main_id

const config = JSON.parse(NIL.IO.readFrom(path.join(__dirname, `config.json`))); // 读取插件根目录的config，原理同上
let cmd = config.cmd;
let platform = config.platform;
let groups = config.groups;

let bot = NIL.bots.getBot(NIL._vanilla.cfg.self_id); // 获取机器人，以供oicq使用

function getText(e) { // 一个获取文本消息的function
    var rt = '';
    for (i in e.message) {
        switch (e.message[i].type) {
            case "text":
                rt += e.message[i].text;
                break;
        }
    }
    return rt;
}

function GET_Request(key,platform){
    const api_qq = `https://c.y.qq.com/soso/fcgi-bin/music_search_new_platform?searchid=53806572956004615&t=1&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&format=json&p=1&n=1&w=` + key;
    const api_163 = `http://cloud-music.pl-fe.cn/search?keywords=` + key;
    const api_kugou = `http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=` + key + `&page=1&pagesize=20&showtype=1`;

    if(platform == `qq`){
        let obj = request(`GET`, api_qq);
        let data = JSON.parse(obj.getBody(`utf8`));
        let info = `${data.data.song.list[0].f}`;
        let split = info.split(`|`);
        let song_id = split[0];
        return song_id
    }else if(platform == `163`){
        let obj = request(`GET`, api_163);
        let data = JSON.parse(obj.getBody(`utf8`));
        let song_id = `${data.result.songs[0].id}`;
        return song_id
    }else if(platform == `kugou`){
        let obj = request(`GET`, api_kugou);
        let data = JSON.parse(obj.getBody(`utf8`));
        let song_id = `${data.data.info[0].group[0].audio_id}`;
        return song_id
    }
}

class MagicMusic extends NIL.ModuleBase{
    onStart(api){
        logger.setTitle(`MagicMusic`);
        logger.info(`MagicMusic loaded!`);
        bot.on(`message.group`, (e) => {
            let text = getText(e);
            let pt = text.split(` `); // 用空格将文本消息分段
            if(groups.includes(e.group_id) == true){
                if(pt[0] == cmd){ // 判断第一部分为群指令
                    /*
                    switch(pt.length){ // 分类讨论消息长度（分为几段）
                        case 2: // 两段的情况（指令+歌名）
                            var key = encodeURI(pt[1]);
                            let song_id = GET_Request(key);
                            e.group.shareMusic(`qq`, song_id);
                            // e.group.sendMsg(song_id);
                            break
                        default: // 其它情况
                            e.group.sendMsg(`格式：` + cmd + ` <歌名>`);
                    }
                    */
                    if(text.endsWith(`qq`) == true){
                        var key = encodeURI(text.substring(cmd.length + 1, text.length - 3));
                        let song_id = GET_Request(key, `qq`);
                        e.group.shareMusic(`qq`, song_id);
                    }else if(text.endsWith(`网易`) == true){
                        var key = encodeURI(text.substring(cmd.length + 1, text.length - 3));
                        let song_id = GET_Request(key, `163`);
                        // e.group.sendMsg(song_id);
                        e.group.shareMusic(`163`, song_id);
                    }else if(text.endsWith(`酷狗`) == true){
                        var key = encodeURI(text.substring(cmd.length + 1, text.length - 3));
                        let song_id = GET_Request(key, `kugou`);
                        e.group.sendMsg(song_id)
                        e.group.shareMusic(`kugou`, song_id);
                    }else if(text.endsWith(cmd) == true){
                        e.group.sendMsg(`格式：` + cmd + ` <歌名> <平台（可选）>`);
                    }else{
                        var key = encodeURI(text.substring(cmd.length + 1));
                        let song_id = GET_Request(key, platform);
                        e.group.shareMusic(platform, song_id);
                    }
                }
            }
        });
    }
}

module.exports = new MagicMusic