const cloud = require('wx-server-sdk');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
let wxContext = cloud.getWXContext();
let openId = wxContext.OPENID;
const db = cloud.database();
const _ = db.command;

const entityManage = require('./../entityManage/index');
const semesterManage = require('./../semesterManage/index');
const updateCourseInfo = require('./../updateCourseInfo/index');

// 获取openId云函数入口函数
exports.main = async (event, context) => {
    let modifies = await updateCourseList();
};



async function updateCourseList(){
    let resp = await entityManage.findAll("rooms");
    let roomList = resp.data;
    let roomLen = roomList.length;
    resp = await semesterManage.findMaxNew("semesters");

    let semesters = resp.data;
    let curWeek = 1;
    if (semesters !== null && semesters.length > 0) {
        let semester = semesters[0];
        var start = semester.start;
        var startMoment = moment(start);
        var nowMoment = moment();
        curWeek = nowMoment.diff(startMoment, 'weeks') + 1;
    }
    let modifies = {};
    for (let i = 0; i < roomLen; i++) {
        let room = roomList[i];
        let roomId = room._id;
        let roomName = room.name;
        console.log("自动抓取课表开始，roomId=" + roomId + ";roomName=" + roomName);
        let result = await updateCourseInfo.crawlerCourseList(curWeek, roomId, roomName);
        console.log("自动抓取课表结束，roomId=" + roomId + ";roomName=" + roomName);
        for(let i = 0 ; i < result.length; i++){
            let courseInfo = result[i];
            modifies[schedulerId][roomName] = courseInfo;
        }
    }
    return modifies;
}
