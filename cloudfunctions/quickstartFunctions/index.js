
const cloud = require('wx-server-sdk');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
const wxContext = cloud.getWXContext();
const openId = wxContext.OPENID;
console.log("openId:"+openId)
const db = cloud.database();
const _ = db.command;

const updateCourseInfo = require('./updateCourseInfo/index');
const semesterManage = require('./semesterManage/index');
const entityManage = require('./entityManage/index');
const schedulerManage = require('./schedulerManage/index');
const userManage = require('./userManage/index');
const loginManage = require('./loginManage/index');

// 云函数入口函数
exports.main = async (event, context) => {

    if (event.type) {
        switch (event.type) {
            case 'updateCourseInfo':
                return await updateCourseInfo.main(event, context);

            case 'semesterManage':
                return await semesterManage.main(event, context);

            case 'schedulerManage':
                return await schedulerManage.main(event, context);

            case 'userManage':
                return await userManage.main(event, context);

            case 'loginManage':
                return await loginManage.main(event, context);
           
            default:
                return await entityManage.main(event, context);
        }
    } else {
        console.log("else 执行定时任务")
        await updateCourseInfo.main(event, context);
    }
};