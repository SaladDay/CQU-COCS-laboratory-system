const rp = require('request-promise');
const request = require('request');
const cheerio = require('cheerio');
var moment = require('moment');
const userManage = require('./../userManage/index');
const semesterManage = require('./../semesterManage/index');
const entityManage = require('./../entityManage/index');
const schedulerManage = require('./../schedulerManage/index');

const {
    utils,
    getLogger
} = require("xmcommon");
var urlTool = require('url');
const log = getLogger(__filename);
const CryptoJS = require('crypto-js');
const {
    SSL_OP_NO_QUERY_MTU
} = require('constants');

const cloud = require('wx-server-sdk');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
const wxContext = cloud.getWXContext();
const openId = wxContext.OPENID;
const db = cloud.database();
const _ = db.command;

// 获取openId云函数入口函数
exports.main = async (event, context) => {
    console.log("自动抓取课表，curWeek=;roomLen=");
    try {
        const opt = event.opt;
        let result = null;
        switch (opt) {
            case 'crawlerCourseListByRoom':
                const selectWeek = event.selectWeek;
                const roomId = event.roomId;
                const roomName = event.roomName;
                const semesterId = event.semesterId;
                console.log("[" + new Date() + "]" + "开始抓取" + roomName + "第" + selectWeek + "周课表数据...");
                await crawlerCourseList(semesterId, selectWeek, roomId, roomName);
                return {
                    success: true
                };

            case 'findCourseList':
                
                console.log("[" + new Date() + "]" + "开始从数据库中读取第" +  event.where.weekNum + "周课表...");
                result = await findCourseList(event.where.semesterId,event.where.weekNum);
                console.log("[" + new Date() + "]" + "开始从数据库中读取第" +  event.where.weekNum + "周课表：" + result.list);
                return result;

            default:
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

                for (let i = 0; i < roomLen; i++) {
                    let room = roomList[i];
                    let roomId = room._id;
                    let roomName = room.name;
                    console.log("自动抓取课表开始，roomId=" + roomId + ";roomName=" + roomName);
                    await crawlerCourseList(curWeek, roomId, roomName);
                    console.log("自动抓取课表结束，roomId=" + roomId + ";roomName=" + roomName);
                }
        }

    } catch (e) {
        console.log("发生异常，信息如下:")
        console.log(e)
        return {
            success: false,
            errMsg: "网络异常或学校网站改版！"
        };
    }
};

async function findCourseList(semesterId,weekNum) {

    console.log("[" + new Date() + "]" + "首先从数据库中读取个人信息userInfo...");
    let userInfo = await userManage.requestUserInfo();
    console.log("userInfo：" + userInfo[0].name);
    let schedulerId = userInfo[0]._id;
    let where = {
        schedulerId: schedulerId
    };
    console.log("[" + new Date() + "]" + "从数据库中读取" + userInfo[0].name + "负责安排值班的教室数据...");
    let resp = await entityManage.findbyWhere("rooms", where);
    let roomList = resp.data;

    let roomIds = [];
    let roomNames = [];
    let roomLen = roomList.length;
    for (let i = 0; i < roomLen; i++) {
        roomIds.push(roomList[i]._id);
        roomNames.push(roomList[i].name);
    }
    console.log("[" + new Date() + "]" + userInfo[0].name + "负责安排值班的教室:" + roomNames);
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection("courses").where({
        weekNum: weekNum,
        semesterId:semesterId,
        roomId: db.command.in(roomIds)
    }).count()
    const total = countResult.total
    console.log("[" + new Date() + "]" + "教室" + roomNames + "中的课程总数：" + total);
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []

    for (let i = 0; i < batchTimes; i++) {

        const promise = db.collection('courses')
            .aggregate()
            .match({
                weekNum: weekNum,
                semesterId:semesterId,
                roomId: db.command.in(roomIds)
            })
            .lookup({
                from: 'rooms',
                localField: 'roomId',
                foreignField: '_id',
                as: 'room',
            })
            .lookup({
                from: 'schedulers',
                localField: '_id',
                foreignField: 'courseId',
                as: 'schedulers',
            })
            .addFields({
              isSchedul: db.command.aggregate.size('$schedulers'),
            })
            .unwind({
                path: '$room',
                preserveNullAndEmptyArrays: true
            })
            .project({
              schedulers:0
            }).skip(i * MAX_LIMIT).limit(MAX_LIMIT)
            .end()

        tasks.push(promise)
    }
    if (tasks.length === 0) {
        return {
            list: [],
            errMsg: "collection.get:ok",
        }
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {

        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })
}

exports.findCourseList = findCourseList;

async function findAll(table) {
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection(table).count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection(table).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
        tasks.push(promise)
    }
    if (tasks.length === 0) {
        return {
            data: [],
            errMsg: "collection.get:ok",
        }
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
        return {
            data: acc.data.concat(cur.data),
            errMsg: acc.errMsg,
        }
    })
}

async function parseCourseInfo(semesterId, curWeek, roomId, roomName, courseInfoList, type) {

    let length = courseInfoList.length;
    let courses = [];
    for (let i = 0; i < length; i++) {
        let courseInfo = courseInfoList[i];
        let singleCourses = parseSingleCourseInfo(semesterId,curWeek, roomId, roomName, courseInfo, type);
        for (let j = 0; j < singleCourses.length; j++) {
            if (curWeek === singleCourses[j].weekNum)
                courses.push(singleCourses[j])
        }
    }
    console.log("[" + new Date() + "]" + "当前学期房间" + roomId + "中第" + curWeek + "周type=" + type + "的课程总数：" + courses.length);
    let curWeekCoursesRes = await db.collection("courses").where({
        weekNum: curWeek,
        type: type,
        roomId: roomId
    }).get();

    let curWeekCourses = curWeekCoursesRes.data;
    let lastDbCoursesLen = curWeekCourses.length;
    length = courses.length;
    for (let i = 0; i < length; i++) {
        let course = courses[i];
        let curWeekCoursesLen = curWeekCourses.length;
        for (let j = 0; j < curWeekCoursesLen; j++) {
            let curWeekCourse = curWeekCourses[j];
            if (course.semesterId == curWeekCourse.semesterId &&
                course.courseName == curWeekCourse.courseName &&
                course.instructorName == curWeekCourse.instructorName &&
                course.roomId == curWeekCourse.roomId &&
                course.selectedStuNum == curWeekCourse.selectedStuNum &&
                course.weekDay == curWeekCourse.weekDay &&
                course.weekNum == curWeekCourse.weekNum &&
                course.morning == curWeekCourse.morning &&
                course.startPeriod == curWeekCourse.startPeriod &&
                course.endPeriod == curWeekCourse.endPeriod) {
                curWeekCourses.splice(j, 1);
                courses.splice(i, 1);
                length = courses.length;
                j = j - 1;
                i = i - 1;
                break;
            }
        }
    }
    console.log("["+new Date()+"]"+"需要从数据库中删除的课程为："+curWeekCourses)
    console.log("["+new Date()+"]"+"需要写入数据库的课程为："+courses)
    let curWeekCoursesLen = curWeekCourses.length;
    length = courses.length;
    let tasks = []
    for (let i = 0; i < curWeekCoursesLen; i++) {

        const promise = db.collection('courses').where({
            _id: curWeekCourses[i]._id
        }).remove();
        tasks.push(promise);

        const promise1 = db.collection('schedulers').where({
            courseId: curWeekCourses[i]._id
        }).remove();
        tasks.push(promise1);
    }

    for (let i = 0; i < length; i++) {
        const promise = db.collection('courses').add({
            data: courses[i]
        })
        tasks.push(promise)
    }
    if (tasks.length === 0) {
        return {
            errMsg: "collection.get:ok",
        }
    }
    // 等待所有数据添加完成
    let result = await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })
    let status = {
        type:type,
        removeNum : curWeekCourses.length,
        addNum : courses.length
    }
    
    return status;
}

function parseSingleCourseInfo(semesterId, curWeek, roomId, roomName, classTime, type) {
    //课程名称	
    let courseName = "";
    //教师	
    let instructorName = "";
    let instructorId = "";
    //上课教室	
    let position = "";
    //选课人数
    let selectedStuNum = 0;
    //周次	
    const week = parseInt(curWeek);
    //星期[节次]	
    const weekDay = parseInt(classTime.weekDay);
    if (type === 0) {
        //课程名称	
        courseName = classTime.courseName;
        //教师	
        classTimetableInstr = classTime.classTimetableInstrVOList[0];
        instructorName = classTimetableInstr.instructorName;
        instructorId = classTimetableInstr.instructorId;
        //选课人数
        selectedStuNum = classTime.selectedStuNum;
    }
    if (type === 1) {
        courseName = classTime.actContent;
        instructorName = classTime.creatorNm;
        selectedStuNum = -1;
    }

    if (type === 2) {
        courseName = classTime.courseName;
        selectedStuNum = classTime.examStudentNum;
        instructorName = classTime.deptInviNumber[0].invigilators[0].name
        instructorId = classTime.deptInviNumber[0].invigilators[0].id
    }

    let periods = []
    if (type === 0 || type === 1) {
        const periodFormat = classTime.periodFormat;
        periods = getPeriodFormatList(periodFormat);
    } else {
        startTime = classTime.startTime;
        endTime = classTime.endTime;
        let morning = 1;
        if (startTime > "12:30" && startTime <= "18:00") {
            morning = 2;
        } else if (startTime > "18:00") {
            morning = 3;
        }
        periods.push({
            morning: morning,
            startPeriod: startTime,
            endPeriod: endTime
        });
    }

    const periodsLen = periods.length;
    let courses = [];

    for (let j = 0; j < periodsLen; j++) {
        const course = {
            semesterId:semesterId,
            courseName: courseName,
            instructorName: instructorName,
            instructorId:instructorId,
            roomId: roomId,
            roomName: roomName,
            selectedStuNum: selectedStuNum,
            weekDay: weekDay,
            weekNum: week,
            morning: periods[j].morning,
            startPeriod: periods[j].startPeriod,
            endPeriod: periods[j].endPeriod,
            type: type
        }
        courses.push(course)
    }
    return courses;
}

function getPeriodFormatList(periodFormat) {
    let periods = [];
    let periodStrList = periodFormat.split("-");
    let start = parseInt(periodStrList[0]);
    let end = parseInt(periodStrList[1]);
    if (start <= 4) {
        if (end <= 4) {
            periods.push({
                "morning": 1,
                "startPeriod": start,
                "endPeriod": end

            });
        } else if (end <= 9) {
            periods.push({
                "morning": 1,
                "startPeriod": start,
                "endPeriod": 4
            });
            periods.push({
                "morning": 2,
                "startPeriod": 5,
                "endPeriod": end
            });
        } else {
            periods.push({
                "morning": 1,
                "startPeriod": start,
                "endPeriod": 4
            });
            periods.push({
                "morning": 2,
                "startPeriod": 5,
                "endPeriod": 9
            });
            periods.push({
                "morning": 3,
                "startPeriod": 9,
                "endPeriod": end
            });
        }
    } else if (start <= 9) {
        if (end <= 9) {
            periods.push({
                "morning": 2,
                "startPeriod": start,
                "endPeriod": end
            });
        } else {
            periods.push({
                "morning": 2,
                "startPeriod": start,
                "endPeriod": 9
            });
            periods.push({
                "morning": 3,
                "startPeriod": 10,
                "endPeriod": end
            });
        }
    } else {
        periods.push({
            "morning": 3,
            "startPeriod": start,
            "endPeriod": end
        });
    }
    return periods;
}

/**
 * 根据1，4-8，10分成1，4，5，6，7，8，10组成的数组
 * @param {} teachingWeekFormat 
 */
function getTeachingWeekList(curWeek, teachingWeekFormat) {
    let weeks = []
    let weekList = teachingWeekFormat.split(",");
    let length = weekList.length;
    for (let i = 0; i < length; i++) {
        if (weekList[i].indexOf("-") > 0) {
            let weekInternal = weekList[i].split("-");
            let start = parseInt(weekInternal[0]);
            let end = parseInt(weekInternal[1]);
            if (start <= curWeek && end >= curWeek) {
                return curWeek;
            }
        } else {
            if (curWeek === parseInt(weekList[i])) {
                return curWeek;
            }
        }
    }
    return 0;
}

async function crawlerCourseList(semesterId, selectWeek, roomId, roomName) {
    let result = [];
    let resultTemp = [];
    console.log("[" + new Date() + "]" + "获取当前学期sessionCode...");
    let curSessionCode = await crawlerCurActiveSession();
    console.log("[" + new Date() + "]" + "当前学期sessionCode：" + curSessionCode);
    console.log("[" + new Date() + "]" + "获取当前学期" + roomName + "中课程数据...");
    resultTemp = await crawlerSingleRoomCourseList(curSessionCode, semesterId,  selectWeek, roomId, roomName);
    result.push(resultTemp);
    console.log("[" + new Date() + "]" + "获取当前学期" + roomName + "中临时活动数据...");
    resultTemp = await crawlerSingleRoomOutsideList(curSessionCode,semesterId,  selectWeek, roomId, roomName);
    result.push(resultTemp);
    console.log("[" + new Date() + "]" + "获取当前学期" + roomName + "中考试列表数据...");
    resultTemp = await crawlerSingleRoomExamList(curSessionCode, semesterId, selectWeek, roomId, roomName);
    result.push(resultTemp);
    let schedualerTotel = schedulerManage.findSchedulerTotelByWhere({
        semesterId:semesterId,
        weekNum:selectWeek
    });
    if(schedualerTotel > 0) {
        
    }
    return result;
}

exports.crawlerCourseList = crawlerCourseList;

async function crawlerSingleRoomCourseList(curSessionCode, semesterId,  selectWeek, roomId, roomName) {

    let url = "https://my.cqu.edu.cn/api/timetable/class/timetable/list/filter?roomName=" + encodeURI(roomName) + "&teachingWeekFormat=" + selectWeek + "&periodFormat=&roomId=&roomBuildingId=&sessionId=" + curSessionCode + "&exprProjectId=&pageSize=1000&currentPage=1";

    let options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Microsoft Edge";v="101"',
            'Accept': 'application/json, text/plain, */*',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://my.cqu.edu.cn/tt/university-timetable',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        },
        followRedirect: false,
        gzip: true
    }
    let result = await get(url, options);
    let resultObject = JSON.parse(result.body);
    let courseList = resultObject.data.content;
    result = await parseCourseInfo(semesterId, selectWeek, roomId, roomName, courseList, 0);
    console.log(result);
    return result;
}

async function crawlerSingleRoomOutsideList(curSessionCode, semesterId,  selectWeek, roomId, roomName) {
    let url = "https://my.cqu.edu.cn/api/timetable/class/timetable/act-timetable-outside";
    let form = {
        roomName: roomName,
        teachingWeek: selectWeek,
        roomBuildingId: "",
        sessionId: curSessionCode
    }
    let options = {
        method: 'POST',
        json: true,
        body: form,
        headers: {
            'Host': 'my.cqu.edu.cn',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Microsoft Edge";v="101"',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer undefined',
            'sec-ch-ua-mobile': '?0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36 Edg/101.0.1210.47',
            'sec-ch-ua-platform': '"Windows"',
            'Origin': 'https://my.cqu.edu.cn',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://my.cqu.edu.cn/tt/university-timetable',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        },
        gzip: true
    }
    let result = await post(url, options);
    let courseList = result.body.data;
    result = await parseCourseInfo(semesterId, selectWeek, roomId, roomName, courseList, 1);
    return result;
}

async function crawlerSingleRoomExamList(curSessionCode, semesterId,  selectWeek, roomId, roomName) {
    let url = "https://my.cqu.edu.cn/api/exam/api/all-exam-schedule";
    let form = {
        currentPage: 1,
        endTime: null,
        endWeek: null,
        endWeekDay: null,
        pageSize: 1000,
        roomName: roomName,
        startTime: null,
        startWeek: null,
        startWeekDay: null,
        week: selectWeek
    }
    let options = {
        method: 'POST',
        json: true,
        body: form,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Microsoft Edge";v="101"',
            'Accept': 'application/json, text/plain, */*',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://my.cqu.edu.cn/tt/university-timetable',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Content-Type': 'application/json',
            'Host': 'my.cqu.edu.cn',
            'Origin': 'https://my.cqu.edu.cn',
        },
        followRedirect: false,
        gzip: true
    }
    let result = await post(url, options);
    let courseList = result.body.data.content;
    result = await parseCourseInfo(semesterId, selectWeek,  roomId, roomName, courseList, 2);
    return result;
}

async function crawlerCurActiveSession(selectWeek) {
    let url = "https://my.cqu.edu.cn/api/timetable/cur-active-session";
    let options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Microsoft Edge";v="101"',
            'Accept': 'application/json, text/plain, */*',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://my.cqu.edu.cn/tt/university-timetable',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        },
        followRedirect: false,
        gzip: true
    }
    let result = await get(url, options);
    let session = JSON.parse(result.body);
    return session.msg;
}

/**
 * 获取登录页盐值
 */
async function requestLoginSalt(cookies) {
    /**
     * 封装用户登录信息，包括根据登录页面salt值对密码加密，因此需要先get登录页面解析并获取盐值。
     */
    let cookieList = [];
    cookieList.push("route" + "=" + cookies["route"]);
    cookieList.push("JSESSIONID" + "=" + cookies["JSESSIONID"]);
    cookieList.push("org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=zh_CN");

    let url = "http://authserver.cqu.edu.cn/authserver/login";
    let options = {
        headers: {
            "Host": "authserver.cqu.edu.cn",
            "Connection": "keep-alive",

            "Referer": "http://authserver.cqu.edu.cn/authserver/login?service=http%3A%2F%2Fi.cqu.edu.cn%2Flogin%3Fservice%3Dhttp%3A%2F%2Fi.cqu.edu.cn%2Fnew%2Findex.html",

            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "zh-CN,zh;q=0.9",

            "Cookie": cookieList.join("; ")
        },
    }
    let result = await get(url, options)

    /**
     * cookie管理
     */
    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }

    const htmlString = result.body;
    const start = 'var pwdDefaultEncryptSalt = "';
    var index = htmlString.indexOf(start);
    var end = htmlString.indexOf('";', index)
    var len = start.length;
    var saltStr = htmlString.substring(index + len, end);

    let $ = cheerio.load(htmlString, {
        decodeEntities: false
    })
    let lt = $('input[name=lt]').attr('value');
    let execution = $('input[name=execution]').attr('value');
    let dllt = 'userNamePasswordLogin';
    let _eventId = 'submit';
    let rmShown = '1';
    let userInfo = {
        saltStr: saltStr,
        cookies: cookies,
        lt: lt,
        execution: execution,
        dllt: dllt,
        _eventId: _eventId,
        rmShown: rmShown
    }
    return userInfo;
}

/**
 * 获取验证码图片
 * 
 * @param {Object} cookies 
 */
async function requestCaptchaImg(cookies) {
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    let url = 'http://authserver.cqu.edu.cn/authserver/captcha.html?ts=' + new Date().getMilliseconds();

    let options = {
        encoding: null,
        headers: {
            // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Host": "authserver.cqu.edu.cn",
            "Connection": "keep-alive",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Accept-Encoding": " gzip, deflate",
            "Accept-Language": " zh-CN,zh;q=0.9",
            "Referer": "http://authserver.cqu.edu.cn/authserver/login?service=http%3A%2F%2Fmy.cqu.edu.cn%2Fauthserver%2Fauthentication%2Fcas",
            "Cookie": cookieList.join("; ")
        },
    }
    let result = await get(url, options);
    var imgBase64 = "data:image/jpeg;base64," + result.body.toString('base64');
    return {
        type: 'captchaImg',
        content: imgBase64,
        cookies: cookies
    }
}

/**
 * 判断是否需要验证码
 * @param {*} username 
 * @param {*} cookies 
 */
async function requestIsNeedCaptchaImg(username, cookies) {
    /**
     * 将cookies转化为=链接的数组，为了组装成cookies字符串发生到后端
     */
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    let url = 'http://authserver.cqu.edu.cn/authserver/needCaptcha.html?username=' + username + '&pwdEncrypt2=pwdEncryptSalt'
    let options = {
        headers: {
            // "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Host": "authserver.cqu.edu.cn",
            "Connection": "keep-alive",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Accept": "text/plain, */*; q=0.01",
            "X-Requested-With": " XMLHttpRequest",
            "Accept-Encoding": " gzip, deflate",
            "Accept-Language": " zh-CN,zh;q=0.9",
            "Referer": "http://authserver.cqu.edu.cn/authserver/login?service=http%3A%2F%2Fmy.cqu.edu.cn%2Fauthserver%2Fauthentication%2Fcas",
            "Cookie": cookieList.join("; ")
        },
    }
    let result = await get(url, options);
    let body = result.body;
    return body === "true";
}

async function requestLogin(loginSaltInfo) {
    let cookies = loginSaltInfo.cookies;
    let userInfo = {
        username: loginSaltInfo.username,
        password: loginSaltInfo.password,
        lt: loginSaltInfo.lt,
        execution: loginSaltInfo.execution,
        dllt: loginSaltInfo.dllt,
        _eventId: loginSaltInfo._eventId,
        rmShown: loginSaltInfo.rmShown
    }

    let captchaImg = loginSaltInfo.captchaImg;
    if (captchaImg === '') { //第1次登录
        let isNeedCaptchaImg = await requestIsNeedCaptchaImg(loginSaltInfo.username, cookies);
        if (isNeedCaptchaImg) {
            return requestCaptchaImg(cookies);
        }
    } else {
        userInfo.captchaResponse = captchaImg;
    }

    /**
     * 将cookies转化为=链接的数组，为了组装成cookies字符串发生到后端
     */
    let cookieList = [];
    cookieList.push("route" + "=" + cookies["route"]);
    cookieList.push("JSESSIONID" + "=" + cookies["JSESSIONID"]);
    cookieList.push("org.springframework.web.servlet.i18n.CookieLocaleResolver.LOCALE=zh_CN");


    let url = 'http://authserver.cqu.edu.cn/authserver/login?service=http%3A%2F%2Fi.cqu.edu.cn%2Flogin%3Fservice%3Dhttp%3A%2F%2Fi.cqu.edu.cn%2Fnew%2Findex.html';
    let options = {
        method: 'POST',
        form: userInfo,
        headers: {

            'Host': 'authserver.cqu.edu.cn',
            'Connection': 'keep-alive',

            'Cache-Control': 'max-age=0',

            'Upgrade-Insecure-Requests': '1',
            'Origin': 'http://authserver.cqu.edu.cn',

            'Content-Type': 'application/x-www-form-urlencoded',

            'Referer': url,

            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',

            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",

            "Cookie": cookieList.join("; ")
        },
        //followRedirect: false
    }

    let result = await post(url, options);

    cookieList = result.response['headers']['set-cookie'];
    if (cookieList) {
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    } else {
        return {
            type: 'error',
            content: "用户名或密码错误！"
        }
    }
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    options = {
        headers: {
            'Host': 'authserver.cqu.edu.cn',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Referer': 'http://i.cqu.edu.cn/',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': cookieList.join("; ")
        },
        followRedirect: false,
    }
    result = await get(url, options);


    let ticket_location = result.response['headers']['location'];




    cookieList = [];
    cookieList.push("route" + "=" + cookies["route"]);
    cookieList.push("JSESSIONID" + "=" + cookies["JSESSIONID"]);
    cookieList.push("amp.locale=zh_CN");
    cookieList.push("iPlanetDirectoryPro" + "=" + cookies["iPlanetDirectoryPro"]);;
    options = {
        headers: {

            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",

            "Upgrade-Insecure-Requests": "1",
            "Referer": "http://i.cqu.edu.cn/",

            "Host": "i.cqu.edu.cn",
            "Connection": "keep-alive",


            "Cookie": cookieList.join("; ")
        },
        followRedirect: false,
    }

    result = await get(ticket_location, options);

    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }

    location = 'http://i.cqu.edu.cn/jsonp/userDesktopInfo.json';
    cookieList = [];
    cookieList.push("MOD_AUTH_CAS" + "=" + cookies["MOD_AUTH_CAS"]);

    options = {
        headers: {
            'Host': 'i.cqu.edu.cn',
            'Connection': 'keep-alive',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'http://i.cqu.edu.cn/new/index.html',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false,
    }

    result = await get(location, options);
    let bodyJson = JSON.parse(result.body);
    let user = {
        department: bodyJson.userDepartment,
        userId: bodyJson.userId,
        name: bodyJson.userName,
        sex: bodyJson.userSex,
        userTypeName: bodyJson.userTypeName,
        userType: bodyJson.userType
    }
    return {
        type: 'success',
        user: user
    }
}

/**
 * 根据用户名和密码获取最新的课程表信息
 * 
 * @param {*} username 
 * @param {*} password 
 */
async function requestCourseInfo(location, cookies) {
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    let where = {
        schedulerId: schedulerId
    };
    let resp = await entityManage.findbyWhere("rooms", where);
    let roomList = resp.data;
    let roomCodes = [];
    let roomLen = roomList.length;
    for (let i = 0; i < roomLen; i++) {
        roomCodes.push(roomList[i].roomCode);
    }
    let bodyStr = roomCodes.join('","');

    bodyStr = '["' + bodyStr + '"]';
    console.log(bodyStr)
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }


    cookies['redirect_uri'] = 'https://my.cqu.edu.cn/tt/token-index';
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    url = "https://my.cqu.edu.cn/authserver/oauth/token";

    form = {
        "client_id": "timetable-prod",
        "client_secret": "app-a-1234",
        "code": code,
        "redirect_uri": "https://my.cqu.edu.cn/tt/token-index",
        "grant_type": "authorization_code"
    };

    options = {
        headers: {
            "Host": "my.cqu.edu.cn",
            "Connection": "keep-alive",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic dGltZXRhYmxlLXByb2Q6YXBwLWEtMTIzNA==",
            "sec-ch-ua-mobile": " ?0",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "sec-ch-ua-platform": " \"Windows\"",
            "Origin": " https://my.cqu.edu.cn",
            "Sec-Fetch-Site": " same-origin",
            "Sec-Fetch-Mode": " cors",
            "Sec-Fetch-Dest": " empty",
            "Referer": location,
            "Accept-Encoding": " gzip, deflate, br",
            "Accept-Language": " zh-CN,zh;q=0.9",
            "Cookie": cookieList.join("; ")
        },
        gzip: true,
        form: form,
        followRedirect: false
    }
    result = await post(url, options);

    cookieList = result.response['headers']['set-cookie'];
    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    let body = result.body;
    let bodyJson = JSON.parse(body);
    const access_token = bodyJson.access_token;

    url = "https://my.cqu.edu.cn/api/timetable/class/timetable/room/table-detail?sessionId=1039";
    options = {
        headers: {
            "Host": "my.cqu.edu.cn",
            "Connection": "keep-alive",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + access_token,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": " \"Windows\"",
            "Origin": " https://my.cqu.edu.cn",
            "Sec-Fetch-Site": " same-origin",
            "Sec-Fetch-Mode": " cors",
            "Sec-Fetch-Dest": " empty",
            "Referer": " https://my.cqu.edu.cn/tt/AllCourseSchedule",
            "Accept-Encoding": " gzip, deflate, br",
            "Accept-Language": " zh-CN,zh;q=0.9",
            "Cookie": cookieList.join("; ")
        },
        gzip: true,
        body: bodyStr,
        followRedirect: false
    }
    result = await post(url, options);
    body = result.body;

    logout(access_token, cookies);
    return {
        type: 'courseInfo',
        content: JSON.parse(body)
    }
}

async function logout(access_token, cookies) {
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    cookies["redirect_uri"] = "https://my.cqu.edu.cn/tt/cas";

    let location = "https://my.cqu.edu.cn/authserver/logout";
    let options = {
        headers: {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "my.cqu.edu.cn",
            "Authorization": "Bearer " + access_token,
            "Referer": "https://my.cqu.edu.cn/tt/Home",
            'sec-ch-ua': ' Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": " cors",
            "Sec-Fetch-Site": " same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false
    }
    await get(location, options);

    location = "https://my.cqu.edu.cn/authserver/remove_token";
    await get(location, options);

    options = {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9 ",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "my.cqu.edu.cn",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://my.cqu.edu.cn/tt/Home",
            'sec-ch-ua': ' Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": " navigate",
            "Sec-Fetch-Site": " same-origin",
            "Sec-Fetch-User": " ?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false
    }
    location = "https://my.cqu.edu.cn/authserver/casLogout?redirect_uri=https://my.cqu.edu.cn/tt/cas";
    result = await get(location, options);
    cookieList = result.response['headers']['set-cookie'];

    if (cookieList)
        for (let i = 0; i < cookieList.length; i++) {
            const cookieStr = cookieList[i];
            const cookieMap = cookieStr.split(";")[0].split("=");
            cookies[cookieMap[0]] = cookieMap[1];
        }
    cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }

    options = {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9 ",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Host": "my.cqu.edu.cn",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
            "Cookie": cookieList.join("; ")
        },
        followRedirect: false
    }
    location = "http://authserver.cqu.edu.cn/authserver/logout?service=http://my.cqu.edu.cn/authserver/authentication/cas";
    result = await get(location, options);
}

async function get(paramURL, paramOptions) {
    let [error, response, body] = await utils.WaitClassFunctionEx(request, "get", paramURL, paramOptions);
    return {
        error,
        response,
        body
    };
}

/**
 * 同步请求post URL
 * @param {string} paramURL 请求的URL
 * @param {*} paramOptions 等同于request的options, 请参考其具体使用方法
 * @return {{error:*, response:*, body:*}} 
 */
async function post(paramURL, paramOptions) {
    let [error, response, body] = await utils.WaitClassFunctionEx(request, "post", paramURL, paramOptions);
    return {
        error,
        response,
        body
    };
}


function getCookiesStr(cokkies) {
    let cookieList = [];
    for (let key in cookies) {
        cookieList.push(key + "=" + cookies[key]);
    }
    return cookieList.join(";");
}

//AES-128-CBC加密模式，key需要为16位，key和iv可以一样
function getAesString(data, key0, iv0) { //加密
    key0 = key0.replace(/(^\s+)|(\s+$)/g, "");
    var key = CryptoJS.enc.Utf8.parse(key0);
    var iv = CryptoJS.enc.Utf8.parse(iv0);
    var encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString(); //返回的是base64格式的密文
}

function encryptAES(data, aesKey) { //加密
    if (!aesKey) {
        return data;
    }
    var encrypted = getAesString(randomString(64) + data, aesKey, randomString(16)); //密文
    return encrypted;
}

var $aes_chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'; /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
var aes_chars_len = $aes_chars.length;

function randomString(len) {
    var retStr = '';
    for (i = 0; i < len; i++) {
        retStr += $aes_chars.charAt(Math.floor(Math.random() * aes_chars_len));
    }
    return retStr;
}