const cloud = require('wx-server-sdk');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
let wxContext = cloud.getWXContext();
const qRcode = require("qrcode"); 
let openId = wxContext.OPENID;
const db = cloud.database();
const _ = db.command;

const entityManage = require('./../entityManage/index');

// 获取openId云函数入口函数
exports.main = async (event, context) => {

    // 获取基础信息
    const opt = event.opt;
    qRcode.toDataURL('{"equipmentTypeId":"0002","equipmentId":"001“"}', (err,url) => {
        console.log(url);
    })
    switch (opt) {

        

        case 'requestUserInfo':
            return requestUserInfo();
        case 'certificate':
            const entity = event.entity;
            return requestCertificate(entity);
        case 'requestByUserIdOrName':
            const keyword = event.keyword;
            return requestByUserIdOrName(keyword);
        default:
            return await entityManage.main(event, context);
    }
};

async function requestByUserIdOrName(keyword) {
    let where = db.command.or([{
        userId: keyword
    }, {
        name: keyword
    }])
    const resp = await entityManage.findbyWhere("users", where);
    const userList = resp.data;
    return userList;
}


async function requestCertificate(entity) {
    var result = {
        success: true
    };
    
    var name = entity.name;
    var userId = entity.userId;
    var registerCode = parseInt(entity.registerCode);
    var now = new Date().getTime();
    var where = {
        name: registerCode
    }
    var resp = await entityManage.findbyWhere("registerCodes", where);
    if (resp.data.length > 0) {
        var registerCode = resp.data[0];
        var end = registerCode.end;
        var start = registerCode.start;
        if (now < start) {
            result.success = false;
            result.errMsg = "邀请码未生效，请联系管理员！";
        } else if (now > end) {
            result.success = false;
            result.errMsg = "邀请码已失效，请联系管理员！";
        } else {
            where = {
                name: name
            }
            resp = await entityManage.findbyWhere("users", where);
            if (resp.data.length > 0) {
                var user = resp.data[0];
                user.userId = userId;
                user.openId = openId;
                await entityManage.update("users", user);
            } else {
                var user = {
                    name: name
                }
                user.userId = userId;
                user.openId = openId;
                await entityManage.add("users", user);
            }
        }
    } else {
        result.success = false;
        result.errMsg = "邀请码错误或暂无开通注册，请联系管理员！";
    }
    return result;


}

async function requestUserInfo() {
    wxContext = cloud.getWXContext();
    openId = wxContext.OPENID;
    console.log("userManage requestUserInfo ")
    console.log(wxContext)
    console.log(openId)
    const where = {
        openId: openId
    }

    const resp = await entityManage.findbyWhere("users", where);
    const userList = resp.data;
    return userList;
}

exports.requestUserInfo = requestUserInfo;