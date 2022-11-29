const userManage = require('./../userManage/index');
const entityManage = require('./../entityManage/index');
const updateCourseInfo = require('./../updateCourseInfo/index');

const cloud = require('wx-server-sdk');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
const wxContext = cloud.getWXContext();
const openId = wxContext.OPENID;
const db = cloud.database();
const _ = db.command;


// 修改数据库信息云函数入口函数
exports.main = async (event, context) => {
    try {
        const type = event.type;
        const TABLE = type.replace("Manage", 's');//schdulers
        // 遍历修改数据库信息
        const opt = event.opt;
        let result = {
            data: []
        };
        if (opt === 'findAll') {
            result = await findAll(TABLE);
        } else if (opt === 'findAllRule') {
            result = await findAllRule();
            result.data = result.list;
        } else if (opt === 'findUserListNoRuleComplict') {
            const weekDay = event.weekDay;
            result = await findUserListNoRuleComplict(weekDay);
            result.data = result.list;
        } else if (opt === 'findUserListNoSchedulerComplict') {
            const weekDay = event.weekDay;
            const weekNum = event.weekNum;
            const semesterId = event.semesterId;
            result = await findUserListNoSchedulerComplict(semesterId, weekNum, weekDay);
            result.data = result.list;
        } else if (opt === 'add') {
            var entity = event.entity;
            await add(TABLE, entity)
        } else if (opt === 'edit') {
            var entity = event.entity;
            await update(TABLE, entity)
        } else if (opt === 'remove') {
            var _id = event._id;
            await remove(TABLE, _id)
        } else if (opt === 'findMaxNew') {
            result = await findMaxNew(TABLE);
        } else if (opt === 'findbyWhere') {
            var where = event.where;
            result = await findSchedulerListbyWhere(where);
            result.data = result.list;
            delete result.list;
        } else if (opt === 'findSchedulersbyUserAndWeekNum') {
            var where = event.where;
            result = await findSchedulersbyUserAndWeekNum(where);
            result.data = result.list;
            delete result.list;
        } else if (opt === 'startScheduler') {
            const selectWeek = event.selectWeek;
            const semesterId = event.semesterId;
            await startScheduler(semesterId, selectWeek);
        } else if (opt === 'publishScheduler') {
            const selectWeek = event.selectWeek;
            const semesterId = event.semesterId;
            await publishScheduler(semesterId, selectWeek);
        } else if (opt === 'findRoomByPeriod') {
            const entity = event.entity;
            result = await findRoomByPeriod(entity);
        } else if (opt === 'findSchedulerTotelByWeekNum') {
            const weekNum = event.weekNum;
            const semesterId = event.semesterId;
            result = await findSchedulerTotelByWhere({
                semesterId:semesterId,
                weekNum: weekNum
            });
            result.data = {
                total: result.total
            };
        } else if (opt === 'addCourseAndScheduler') {
            const entity = event.entity;
            await addCourseAndScheduler(entity);
        } else if (opt === 'editCourseAndScheduler') {
            const entity = event.entity;
            await editCourseAndScheduler(entity);
        } else if (opt === 'editScheduler') {
            const schedulers = event.schedulers;
            await editScheduler(schedulers);
        } else if (opt === 'removeCourseAndScheduler') {
            const course = event.course;
            let pageSwitch = await removeCourseAndScheduler(course);
            result.data = {
                pageSwitch: pageSwitch
            };
        }


        return {
            success: true,
            data: result.data
        };
    } catch (e) {
        return {
            success: false,
            errMsg: e
        };
    }
};

function getAllRuleSQL(schedulerId) {
    const $ = db.command.aggregate
    return db.collection("rules").aggregate()
        .match({
            schedulerId: schedulerId
        })
        .lookup({
            from: 'users',
            localField: 'dutyerId',
            foreignField: '_id',
            as: 'dutyer',
        })
        .unwind({
            path: '$dutyer',
            preserveNullAndEmptyArrays: true
        })
        .lookup({
            from: 'users',
            localField: 'managerId',
            foreignField: '_id',
            as: 'manager',
        })
        .unwind({
            path: '$manager',
            preserveNullAndEmptyArrays: true
        })
        .lookup({
            from: 'rules',
            let: {
                dutyerId: '$dutyerId',
                managerId: '$managerId',
                schedulerId: '$schedulerId',
                weekDay: '$weekDay'
            },
            pipeline: $.pipeline()
                .match(_.expr($.and([
                    $.or([
                        $.eq(['$dutyerId', '$$dutyerId']),
                        $.eq(['$managerId', '$$dutyerId']),
                    ]),
                    $.or([
                        $.gt(['$schedulerId', '$$schedulerId']),
                        $.lt(['$schedulerId', '$$schedulerId'])
                    ]),
                    $.eq(['$weekDay', '$$weekDay'])
                ])))
                .lookup({
                    from: 'users',
                    localField: 'schedulerId',
                    foreignField: '_id',
                    as: 'scheduler',
                })
                .project({
                    _id: 1,
                    weekDay: 1,
                    dutyerId: 1,
                    schedulerId: 1,
                    scheduler: 1,
                    managerId: 1
                })
                .done(),
            as: 'dutyerRules'
        })
        .lookup({
            from: 'rules',
            let: {
                dutyerId: '$dutyerId',
                managerId: '$managerId',
                schedulerId: '$schedulerId',
                weekDay: '$weekDay'
            },
            pipeline: $.pipeline()
                .match(_.expr($.and([
                    $.or([

                        $.eq(['$dutyerId', '$$managerId']),
                        $.eq(['$managerId', '$$managerId'])
                    ]),
                    $.or([
                        $.gt(['$schedulerId', '$$schedulerId']),
                        $.lt(['$schedulerId', '$$schedulerId'])
                    ]),
                    $.eq(['$weekDay', '$$weekDay'])
                ])))
                .lookup({
                    from: 'users',
                    localField: 'schedulerId',
                    foreignField: '_id',
                    as: 'scheduler',
                })
                .project({
                    _id: 1,
                    weekDay: 1,
                    dutyerId: 1,
                    schedulerId: 1,
                    scheduler: 1,
                    managerId: 1
                })
                .done(),
            as: 'managerRules'
        }).sort({
            weekDay: 1
        });
}

async function findAllRule() {
    const $ = db.command.aggregate
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    const MAX_LIMIT = 100;
    // 先取出集合记录总数
    const countResult = await getAllRuleSQL(schedulerId).count("count").end();
    const total = countResult.list[0].count
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = getAllRuleSQL(schedulerId).skip(i * MAX_LIMIT).limit(MAX_LIMIT).end();
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

async function findRuleByWeekDay(schedulerId,weekDay){

    let tasks = []
    const promise = db.collection("rules").aggregate()
        .match({
            schedulerId: schedulerId,
            weekDay:weekDay
        }).end()
    tasks.push(promise)
    return await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })

    
}

function getUserListNoSchedulerComplictSQL(semesterId, weekNum, weekDay, schedulerId) {
    const $ = db.command.aggregate
    return db.collection('users')
        .aggregate()
        .match({
            userType: 0
        })
        .lookup({
            from: 'schedulers',
            let: {
                userId: '$_id',
                weekDay: weekDay,
                weekNum: weekNum,
                semesterId:semesterId,
                schedulerId: schedulerId
            },
            pipeline: $.pipeline()
                .match(_.expr($.and([
                    $.eq(['$dutyerId', '$$userId']),
                    $.or([
                        $.gt(['$schedulerId', '$$schedulerId']),
                        $.lt(['$schedulerId', '$$schedulerId']),
                    ]),
                    $.eq(['$$weekDay', '$weekDay']),
                    $.eq(['$$weekNum', '$weekNum']),
                    $.eq(['$$semesterId', '$semesterId']),
                ])))

                .done(),
            as: 'dutyerSchedulers'
        })
        .project({
            _id: 1,
            name: 1,
            conflictSchedulerId: '$dutyerSchedulers.schedulerId',
            conflict: $.size('$dutyerSchedulers')
        })
}


async function findUserListNoSchedulerComplict(semesterId, weekNum, weekDay) {
    const $ = db.command.aggregate
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    let sql = getUserListNoSchedulerComplictSQL(semesterId, weekNum, weekDay, schedulerId);

    const countResult = await sql.count("count").end();
    const total = countResult.list[0].count;
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        sql = getUserListNoSchedulerComplictSQL(semesterId, weekNum, weekDay, schedulerId);
        const promise = sql.skip(i * MAX_LIMIT).limit(MAX_LIMIT).end();
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


function getUserListNoRuleComplictSQL(weekDay, schedulerId) {
    const $ = db.command.aggregate
    return db.collection('users')
        .aggregate()
        .match({
            userType: 0
        })
        .lookup({
            from: 'rules',
            let: {
                userId: '$_id',
                weekDay: weekDay,
                schedulerId: schedulerId
            },
            pipeline: $.pipeline()
                .match(_.expr($.and([
                    $.or([
                        $.eq(['$dutyerId', '$$userId']),
                        $.eq(['$managerId', '$$userId']),
                    ]),
                    $.or([
                        $.gt(['$schedulerId', '$$schedulerId']),
                        $.lt(['$schedulerId', '$$schedulerId']),
                    ]),
                    $.eq(['$$weekDay', '$weekDay'])
                ])))

                .project({
                    _id: 1,
                    weekDay: 1,
                    dutyerId: 1,
                    schedulerId: 1,
                    managerId: 1
                })
                .done(),
            as: 'dutyerRules'
        })
        .project({
            _id: 1,
            name: 1,
            conflict: $.size('$dutyerRules')
        })

}

async function findUserListNoRuleComplict(weekDay) {
    const $ = db.command.aggregate
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    let sql = getUserListNoRuleComplictSQL(weekDay, schedulerId);

    const countResult = await sql.count("count").end();
    const total = countResult.list[0].count;
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        sql = getUserListNoRuleComplictSQL(weekDay, schedulerId);
        const promise = sql.skip(i * MAX_LIMIT).limit(MAX_LIMIT).end();
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

async function editScheduler(schedulers) {
    let len = schedulers.length;
    let tasks = []
    for (var i = 0; i < len; i++) {
        let entity = schedulers[i];
        let schedulerId = entity.schedulerId;
        delete entity.schedulerId;
        const promise = db.collection("schedulers").doc(schedulerId).update({
            data: entity
        })
        tasks.push(promise)
    }
    let result = await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })
}

async function removeCourseAndScheduler(course) {
    var courseId = course._id;
    await removeByWhere("schedulers", {
        courseId: courseId
    });
    await removeByWhere("courses", {
        _id: courseId
    });
    let result = await findSchedulerTotelByWhere({
        weekNum: course.weekNum,
        semesterId:course.semesterId,
        weekDay: course.weekDay,
        morning: course.morning
    });
    if (result.total === 0) {
        let userInfo = await userManage.requestUserInfo();
        let schedulerId = userInfo[0]._id;
        var weekDayRuleList = await findRuleByWeekDay(schedulerId,course.weekDay);
        let schedulers = {
            type: 0,
            dutyerId: weekDayRuleList[0].list[0].dutyerId,
            schedulerId: userInfo[0]._id,
            morning: course.morning,
            weekDay: course.weekDay,
            weekNum: course.weekNum,
            semesterId:course.semesterId
        }
        await addSchedualerByType(0, schedulers);
        return true;
    }
    return false;
}

async function addOrRemoveType0Schecheduler(semesterId, weekNum, weekDay, morning){
    let result = await findSchedulerTotelByWhere({
        weekNum: weekNum
    });
    if (result.total > 0) {
        let userInfo = await userManage.requestUserInfo();
        let schedulerId = userInfo[0]._id;
        var weekDayRuleList = await findRuleByWeekDay(schedulerId, weekDay);
        let schedulers = {
            type: 0,
            dutyerId: weekDayRuleList[0].list[0].dutyerId,
            schedulerId: userInfo[0]._id,
            morning: morning,
            weekDay: weekDay,
            weekNum: weekNum,
            semesterId: semesterId
        }
        await addSchedualerByType(0, schedulers);
    }
}

async function addCourseAndScheduler(entity) {
    let userList = await userManage.requestUserInfo();
    let dutyerId = "";
    if (entity.hasOwnProperty("dutyerId")) {
        dutyerId = entity.dutyerId;
        delete entity.dutyerId;
    }

    let where = {
        _id: entity.roomId
    };
    let resp = await entityManage.findbyWhere("rooms", where);
    let rooms = resp.data;
    let room = rooms[0];
    
    entity.type = 3; //手动输入

    var startPeriod = entity.startPeriod;
    var endPeriod = entity.endPeriod;
    var morning = 1;
    if (startPeriod > 4 && endPeriod < 10) {
        morning = 2;
    } else if (startPeriod >= 10) {
        morning = 3;
    }
    var entityList = []
    if(startPeriod < 5 && endPeriod > 9){
        entity.morning = 1;
        entity.endPeriod = 4;
        entityList.push(JSON.parse(JSON.stringify(entity)))
        entity.morning = 2;
        entity.startPeriod = 5;
        entity.endPeriod = 9;
        entityList.push(JSON.parse(JSON.stringify(entity)))
        entity.morning = 3;
        entity.startPeriod = 10;
        entity.endPeriod = endPeriod;
        entityList.push(JSON.parse(JSON.stringify(entity)))
    }else if(startPeriod < 5 && endPeriod > 4){
        entity.morning = 1;
        entity.endPeriod = 4;
        entityList.push(JSON.parse(JSON.stringify(entity)))
        entity.morning = 2;
        entity.startPeriod = 5;
        entity.endPeriod = endPeriod;
        entityList.push(JSON.parse(JSON.stringify(entity)))
    }else if(startPeriod <= 9 && endPeriod > 9){
        morningList = [2,3];
        entity.morning = 2;
        entity.startPeriod = startPeriod;
        entity.endPeriod = 9;
        entityList.push(JSON.parse(JSON.stringify(entity)))
        entity.morning = 3;
        entity.startPeriod = 10;
        entity.endPeriod = endPeriod;
        entityList.push(JSON.parse(JSON.stringify(entity)))
    }else{
        entity.morning = morning;
        entityList.push(JSON.parse(JSON.stringify(entity)))
    }
    var entityLength = entityList.length;
    for(var i = 0 ; i < entityLength; i++){
        entity = entityList[i];
        
        let result = await add("courses", entity);
       
        
        var _id = result[0]._id;

        if (dutyerId !== "") {
            let scheduler = {
                courseId: _id,
                dutyerId: dutyerId,
                morning: entity.morning,
                roomId: entity.roomId,
                roomName: entity.roomName,
                selectedStuNum: entity.selectedStuNum,
                semesterId:entity.semesterId,
                weekNum: entity.weekNum,
                weekDay: entity.weekDay,
                startPeriod: entity.startPeriod,
                endPeriod: entity.endPeriod,
                schedualerType: 1,
                schedulerId: userList[0]._id,
                type: 3
            };
            await add("schedulers", scheduler);

            //删除该时段坐班
            if(entity.morning < 3 || entity.weekDay <= 5){
                let where = {
                    semesterId:entity.semesterId,
                    weekNum: entity.weekNum,
                    weekDay: entity.weekDay,
                    morning: entity.morning,
                    schedualerType: 0
                };
                await db.collection('schedulers').where(where).remove()
            }
        }
    }
    
}

async function editCourseAndScheduler(entity) {
    let dutyerId = "";
    let schedulerId = "";
    if (entity.hasOwnProperty("dutyerId")) {
        dutyerId = entity.dutyerId;
        schedulerId = entity.schedulerId;
        delete entity.dutyerId;
        delete entity.schedulerId;
    }

    var startPeriod = entity.startPeriod;
    var endPeriod = entity.endPeriod;
    var morning = 1;
    if(typeof startPeriod === 'string'){
        if (startPeriod > '12:30' && endPeriod < "18:20") {
            morning = 2;
        } else if (startPeriod >= '18:20') {
            morning = 3;
        }
    }else{
        if (startPeriod > 4 && endPeriod < 10) {
            morning = 2;
        } else if (startPeriod >= 10) {
            morning = 3;
        }
    }
    
    
    
    entity.morning = morning;
     //手动输入

    let where = {
        _id: entity.roomId
    };
    let resp = await entityManage.findbyWhere("rooms", where);
    let rooms = resp.data;
    let room = rooms[0];
    entity.roomName = room.name;
    var courseId = entity._id;

    resp = await entityManage.findById("courses", courseId);
    let oldcourse = resp.data;
    if(oldcourse.weekNum !== entity.weekNum || oldcourse.weekDay !== entity.weekDay || oldcourse.morning !== entity.morning){
        //修改了时段，shan'chu
        if (dutyerId !== "") {
            //检查旧课程时间段是否应该排版，若应该排版，则添加排版数据;
            let where = {
                courseId:_.neq(courseId),
                semesterId:oldcourse.semesterId,
                weekNum: oldcourse.weekNum,
                weekDay: oldcourse.weekDay,
                morning: oldcourse.morning
            };
            resp = await findSchedulerTotelByWhere(where)
            if(oldcourse.weekDay <= 5 && oldcourse.morning < 3 && resp.total ==0){
                let userInfo = await userManage.requestUserInfo();
                let schedulerId = userInfo[0]._id;
                var weekDayRuleList = await findRuleByWeekDay(schedulerId, oldcourse.weekDay);
                let schedulers = {
                    type: 0,
                    dutyerId: weekDayRuleList[0].list[0].dutyerId,
                    schedulerId: schedulerId,
                    morning: oldcourse.morning,
                    weekDay: oldcourse.weekDay,
                    weekNum: oldcourse.weekNum,
                    semesterId: oldcourse.semesterId
                }
                await addSchedualerByType(0, schedulers);
            }
            //检查新时间段是否有排版数据，若有，则删除该时段排版数据
            if(entity.morning < 3 || entity.weekDay <= 5){
                let where = {
                    semesterId:entity.semesterId,
                    weekNum: entity.weekNum,
                    weekDay: entity.weekDay,
                    morning: entity.morning,
                    schedualerType: 0
                };
                await db.collection('schedulers').where(where).remove()
            }
        }
    }else{//未修改时段

    }

    await update("courses", entity);

    
    if (dutyerId !== "") {

        resp = await entityManage.findbyWhere("schedulers", {courseId:courseId});
        let schedulers = resp.data;
        
        if(schedulers.length > 0){
            scheduler = {
                _id:schedulers[0]._id,
                courseId: courseId,
                dutyerId: dutyerId,
                morning: morning,
                roomId: entity.roomId,
                selectedStuNum: entity.selectedStuNum,
                semesterId:entity.semesterId,
                schedulerId:schedulerId,
                weekNum: entity.weekNum,
                weekDay: entity.weekDay,
                startPeriod: entity.startPeriod,
                endPeriod: entity.endPeriod,
                schedualerType:1,
                type: entity.type,
            }
            await update("schedulers", scheduler);
        }
    }
}

async function findSchedulerTotelByWhere(where) {
    let result = await db.collection('schedulers').where(where).count();
    console.log(result);
    return result;
}

async function findRoomByPeriod(entity) {
    let start = entity.startPeriod;
    let end = entity.endPeriod;
    let mornings = [];
    if (start <= 4) {
        mornings.push(1);
        if (end > 4 && end < 10) {
            mornings.push(2);
        }
        if (end > 10) {
            mornings.push(2);
            mornings.push(3);
        }
    } else if (start > 4 && start < 10) {
        mornings.push(2);
        if (end > 10) {
            mornings.push(3);
        }
    } else {
        mornings.push(3);
    }
    let result = await db.collection('courses')
        .aggregate()
        .match({
            semesterId: entity.semesterId,
            weekNum: entity.weekNum,
            weekDay: entity.weekDay,
            morning: _.in(mornings)
        })
        .project({
            roomId: 1,
            _id: 0
        })
        .group({
            _id: '$roomId'
        })
        .end();
    let roomIdList = [];
    const data = result.list;
    let length = data.length;
    for (var i = 0; i < length; i++) {
        roomIdList.push(data[i]._id);
    }
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    result = await db.collection('rooms').where({
            _id: _.nin(roomIdList),
            schedulerId:schedulerId
        })
        .orderBy('name', 'asc')
        .get()
    return result;

}

async function startScheduler(semesterId,selectWeek) {
    // let resp = await findAllRule();
    // let ruleList = resp.list;
    // let schedulerList = [];
    // let userPointTotel = 0;
    // for(var i = 0 ; i < ruleList.length ; i++){
    //     var rule = ruleList[i];
    //     var dutyer = rule.dutyer;
    //     var manager = rule.manager;
    //     var dutyerExist = false;
    //     var managerExist = false;
    //     for (var j = 0 ; j < schedulerList.length ;j ++){
    //         if(dutyer._id === schedulerList[j].dutyer._id){
    //             dutyerExist = true;
    //         }
    //         if(manager._id === schedulerList[j].manager._id){
    //             managerExist = true;
    //         }
    //     }
    //     if(!managerExist){
    //         userPointTotel = userPointTotel + manager.point;
    //         schedulerList.push(manager);
    //     }
    //     if(!dutyerExist){
    //         userPointTotel = userPointTotel + manager.point;
    //         schedulerList.push(dutyer);
    //     }
    // }

    // resp = await updateCourseInfo.findCourseList(semesterId, selectWeek);

    // let courseList = resp.list;

    // length = courseList.length;
    // let courseMap = {
    //     1: {
    //         1: [],
    //         2: [],
    //         3: []
    //     },
    //     2: {
    //         1: [],
    //         2: [],
    //         3: []
    //     },
    //     3: {
    //         1: [],
    //         2: [],
    //         3: []
    //     },
    //     4: {
    //         1: [],
    //         2: [],
    //         3: []
    //     },
    //     5: {
    //         1: [],
    //         2: [],
    //         3: []
    //     },
    //     6: {
    //         1: [],
    //         2: [],
    //         3: []
    //     },
    //     7: {
    //         1: [],
    //         2: [],
    //         3: []
    //     }
    // };
    // let pointMap = {
    //     1: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     },
    //     2: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     },
    //     3: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     },
    //     4: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     },
    //     5: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     },
    //     6: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     },
    //     7: {
    //         1: {},
    //         2: {},
    //         3: {}
    //     }
    // }
    // for (let i = 0; i < length; i++) {
    //     let course = courseList[i];
    //     course.schedulerId = schedulerId;
    //     let weekDay = course.weekDay;
    //     let morning = course.morning;
    //     courseMap[weekDay][morning].push(course);
    // }
    // let pointTotel = 0;
    // for(let weekDayCourse in courseMap){
    //     for(let morningCourse in courseMap[weekDayCourse]){
    //         let courseLen =  courseMap[weekDayCourse][morningCourse].length;
    //         if(courseLen < 4){
    //             pointMap[weekDayCourse][morningCourse] = 1;
    //         }else if(courseLen < 7){
    //             pointMap[weekDayCourse][morningCourse] = 2;
    //         }else{
    //             pointMap[weekDayCourse][morningCourse] = 3;
    //         }
    //         let point = 0.7;
    //         if(weekDayCourse < 6 && morningCourse < 3){
    //             if(courseLen == 0){
    //                 point = 0.7;
    //             }else if(courseLen < 4){
    //                 point = 1;
    //             }else if(courseLen < 7){
    //                 point = 2;
    //             }else{
    //                 point = 3;
    //             }
    //         }else{
    //             if(courseLen == 0){
    //                 point = 0;
    //             }else if(courseLen < 4){
    //                 point = 1.5;
    //             }else if(courseLen < 7){
    //                 point = 3;
    //             }else{
    //                 point = 4.5;
    //             }
    //         }
    //         pointMap[weekDayCourse][morningCourse] = point;
    //         pointTotel = pointTotel + point;
    //     }
    // }

    // for(var i = 0; i < schedulerList.length ; i ++){
    //     var point = schedulerList[i].point;
    //     schedulerList[i].userPoint = pointTotel * point / userPointTotel;
    // }

    




    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    let where = {
        semesterId:semesterId,
        weekNum: selectWeek,
        schedulerId: schedulerId
    };
    resp = await entityManage.findbyWhere("schedulers", where);
    let schedulerList = resp.data;
    let length = schedulerList.length;
    let schedulerMap = {
        1: {
            1: [],
            2: [],
            3: []
        },
        2: {
            1: [],
            2: [],
            3: []
        },
        3: {
            1: [],
            2: [],
            3: []
        },
        4: {
            1: [],
            2: [],
            3: []
        },
        5: {
            1: [],
            2: [],
            3: []
        },
        6: {
            1: [],
            2: [],
            3: []
        },
        7: {
            1: [],
            2: [],
            3: []
        }
    };
    let schedulerCourseMap = {};
    for (let i = 0; i < length; i++) {
        let scheduler = schedulerList[i];
        let weekDay = scheduler.weekDay;
        let morning = scheduler.morning;
        schedulerMap[weekDay][morning].push(scheduler);
        let schedualerType = scheduler.schedualerType;
        if (schedualerType === 1) {
            let courseId = scheduler.courseId;
            schedulerCourseMap[courseId] = true;
        }
    }

    resp = await updateCourseInfo.findCourseList(semesterId, selectWeek);

    let courseList = resp.list;

    resp = await findAllRule();
    let ruleList = resp.list;

    length = courseList.length;
    let courseMap = {
        1: {
            1: [],
            2: [],
            3: []
        },
        2: {
            1: [],
            2: [],
            3: []
        },
        3: {
            1: [],
            2: [],
            3: []
        },
        4: {
            1: [],
            2: [],
            3: []
        },
        5: {
            1: [],
            2: [],
            3: []
        },
        6: {
            1: [],
            2: [],
            3: []
        },
        7: {
            1: [],
            2: [],
            3: []
        }
    };
    for (let i = 0; i < length; i++) {
        let course = courseList[i];
        course.schedulerId = schedulerId;
        let weekDay = course.weekDay;
        let morning = course.morning;
        courseMap[weekDay][morning].push(course);
    }

    length = ruleList.length;
    let ruleMap = {}
    for (let i = 0; i < length; i++) {
        let rule = ruleList[i];
        let weekDay = rule.weekDay;
        ruleMap[weekDay] = rule;
    }

    for (let weekDay in courseMap) {
        let weekDayCourseMap = courseMap[weekDay];
        let weekDayRule = ruleMap[weekDay];
        for (let morning in weekDayCourseMap) {
            var morningCourseList = weekDayCourseMap[morning];
            morningCourseList.sort(function (a, b) {
                var aRoomName = a.room.name;
                var bRoomName = b.room.name;
                if (aRoomName < bRoomName) {
                    return -1;
                }
                if (aRoomName > bRoomName) {
                    return 1;
                }
                return 0;
            });
            var morningCourseListLen = morningCourseList.length;
            if (morningCourseListLen === 0 && weekDayRule.isScheduler) { //坐班

                weekDay = parseInt(weekDay);
                morning = parseInt(morning);
                let weekDayMorningSchedulerList = schedulerMap[weekDay][morning];
                let isHasZeroType = false;
                if (weekDayMorningSchedulerList.length > 0) {
                    for (let i = 0; i < weekDayMorningSchedulerList.length; i++) {
                        let weekDayMorningScheduler = weekDayMorningSchedulerList[i];
                        if (weekDayMorningScheduler.schedualerType !== 0) {
                            await entityManage.remove("schedulers", weekDayMorningScheduler._id);
                        } else {
                            isHasZeroType = true;
                        }
                    }
                }
                if (!isHasZeroType) {
                    if (weekDay < 6 && morning < 3) {
                        let schedulers = {
                            type: 0,
                            dutyerId: weekDayRule.dutyerId,
                            schedulerId: schedulerId,
                            morning: morning,
                            weekDay: weekDay,
                            weekNum: selectWeek,
                            semesterId:semesterId
                        }
                        await addSchedualerByType(0, schedulers);
                    }
                }
            } else { //值班
                var segment = 0;
                if (morningCourseListLen > 4) {
                    segment = Math.floor(morningCourseListLen / 2);
                    if (morningCourseListLen % 2 === 1) {
                        segment = segment + 1;
                    }
                }

                if (segment === 0) {
                    for (var i = 0; i < morningCourseListLen; i++) {
                        morningCourseList[i].dutyerId = weekDayRule.dutyerId;
                        if (!schedulerCourseMap[morningCourseList[i]._id]) {
                            await addSchedualerByType(1, morningCourseList[i]);
                        }
                    }
                } else {
                    for (var i = 0; i < segment; i++) {
                        morningCourseList[i].dutyerId = weekDayRule.dutyerId;
                        if (!schedulerCourseMap[morningCourseList[i]._id]) {
                            await addSchedualerByType(1, morningCourseList[i]);
                        }
                    }
                    for (var i = segment; i < morningCourseListLen; i++) {
                        morningCourseList[i].dutyerId = weekDayRule.managerId;
                        if (!schedulerCourseMap[morningCourseList[i]._id]) {
                            await addSchedualerByType(1, morningCourseList[i]);
                        }
                    }
                }
            }
        }
    }
}

async function autoScheduler(schedulerList,pointMap,courseMap){

}

async function addScheduler(courseList) {

    resp = await findAllRule();
    let ruleList = resp.list;

    let length = courseList.length;
    let courseMap = {
        1: {
            1: [],
            2: [],
            3: []
        },
        2: {
            1: [],
            2: [],
            3: []
        },
        3: {
            1: [],
            2: [],
            3: []
        },
        4: {
            1: [],
            2: [],
            3: []
        },
        5: {
            1: [],
            2: [],
            3: []
        },
        6: {
            1: [],
            2: [],
            3: []
        },
        7: {
            1: [],
            2: [],
            3: []
        }
    };
    for (let i = 0; i < length; i++) {
        let course = courseList[i];
        course.schedulerId = schedulerId;
        let weekDay = course.weekDay;
        let morning = course.morning;
        courseMap[weekDay][morning].push(course);
    }

    length = ruleList.length;
    let ruleMap = {}
    for (let i = 0; i < length; i++) {
        let rule = ruleList[i];
        let weekDay = rule.weekDay;
        ruleMap[weekDay] = rule;
    }

    for (let weekDay in courseMap) {
        let weekDayCourseMap = courseMap[weekDay];
        let weekDayRule = ruleMap[weekDay];
        for (let morning in weekDayCourseMap) {
            var morningCourseList = weekDayCourseMap[morning];
            morningCourseList.sort(function (a, b) {
                var aRoomName = a.room.name;
                var bRoomName = b.room.name;
                if (aRoomName < bRoomName) {
                    return -1;
                }
                if (aRoomName > bRoomName) {
                    return 1;
                }
                return 0;
            });
            var morningCourseListLen = morningCourseList.length;
            if (morningCourseListLen === 0 && weekDayRule.isScheduler) {
                weekDay = parseInt(weekDay);
                morning = parseInt(morning);
                if (weekDay < 6 && morning < 3) {
                    let schedulers = {
                        type: 0,
                        dutyerId: weekDayRule.dutyerId,
                        schedulerId: schedulerId,
                        morning: morning,
                        weekDay: weekDay,
                        weekNum: selectWeek
                    }
                    await addSchedualerByType(0, schedulers);
                }
            } else {
                var segment = 0;
                if (morningCourseListLen > 4) {
                    segment = Math.floor(morningCourseListLen / 2);
                    if (morningCourseListLen % 2 === 1) {
                        segment = segment + 1;
                    }
                }

                if (segment === 0) {
                    for (var i = 0; i < morningCourseListLen; i++) {
                        morningCourseList[i].dutyerId = weekDayRule.dutyerId;
                        await addSchedualerByType(1, morningCourseList[i]);
                    }
                } else {
                    for (var i = 0; i < segment; i++) {
                        morningCourseList[i].dutyerId = weekDayRule.dutyerId;
                        await addSchedualerByType(1, morningCourseList[i]);
                    }
                    for (var i = segment; i < morningCourseListLen; i++) {
                        morningCourseList[i].dutyerId = weekDayRule.managerId;
                        await addSchedualerByType(1, morningCourseList[i]);
                    }
                }
            }
        }
    }
}

async function publishScheduler(semesterId, selectWeek) {
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    let where = {
        weekNum: selectWeek,
        semesterId:semesterId,
        schedulerId: schedulerId
    };
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('schedulers')
        .aggregate()
        .match(where)
        .count('count')
        .end()

    let total = 0;
    if (countResult.list.length > 0) {
        total = countResult.list[0].count;
    }
    if (total === 0) {
        return {
            list: [],
            errMsg: ''
        }
    }
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('schedulers')
            .where(where)
            .update({
                data: {
                    finish: true
                }
            })
        tasks.push(promise)
    }
    if (tasks.length === 0) {
        return {
            errMsg: "collection.get:ok",
        }
    }
    // 等待所有
    (await Promise.all(tasks)).reduce((acc, cur) => {
        return {
            errMsg: acc.errMsg,
        }
    })
}

async function addSchedualerByType(schedualerType, entity) {
    let scheduler = {
        schedualerType: schedualerType,
        dutyerId: entity.dutyerId,
        schedulerId: entity.schedulerId,
        weekDay: entity.weekDay,
        morning: entity.morning,
        weekNum: entity.weekNum,
        semesterId:entity.semesterId
    }
    if (schedualerType == 1) {
        scheduler.courseId = entity._id;
        scheduler.type = entity.type;
        scheduler.roomId = entity.roomId;
        scheduler.startPeriod = entity.startPeriod;
        scheduler.endPeriod = entity.endPeriod;
        scheduler.selectedStuNum = entity.selectedStuNum;
    }
    await add("schedulers", scheduler);
}

async function removeByWhere(table, where) {
    let tasks = []
    const promise = db.collection(table).where(where).remove();
    tasks.push(promise)
    let result = await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })
}

async function remove(table, _id) {
    let tasks = []
    const promise = db.collection(table).doc(_id).remove();
    tasks.push(promise)
    let result = await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })
}

async function update(table, entity) {
    let tasks = []
    let _id = entity._id;
    delete entity._id;
    const promise = db.collection(table).doc(_id).update({
        data: entity
    })
    tasks.push(promise)
    let result = await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })
}

async function add(table, entity) {
    let tasks = []
    const promise = db.collection(table).add({
        data: entity
    })
    tasks.push(promise)
    return await Promise.all(tasks).then(res => {
        return res
    }).catch(function (err) {
        return err
    })
}

async function findMaxNew(table) {
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection(table).count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection(table).orderBy('start', 'desc').skip(i * MAX_LIMIT).limit(1).get()
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
        const promise = db.collection(table).orderBy('start', 'desc').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
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

async function findSchedulersbyUserAndWeekNum(where) {
    let userInfo = await userManage.requestUserInfo();
    let schedulerId = userInfo[0]._id;
    where.schedulerId = schedulerId;

    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('schedulers')
        .aggregate()
        .match(where)
        .count('count')
        .end()

    let total = 0;
    if (countResult.list.length > 0) {
        total = countResult.list[0].count;
    }
    if (total === 0) {
        return {
            list: [],
            errMsg: ''
        }
    }
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('schedulers')
            .aggregate()
            .match(where)
            .lookup({
                from: 'courses',
                localField: 'courseId',
                foreignField: '_id',
                as: 'course',
            })
            .unwind({
                path: '$course',
                preserveNullAndEmptyArrays: true
            })
            .lookup({
                from: 'rooms',
                localField: 'roomId',
                foreignField: '_id',
                as: 'room',
            })
            .unwind({
                path: '$room',
                preserveNullAndEmptyArrays: true
            })
            .lookup({
                from: 'users',
                localField: 'dutyerId',
                foreignField: '_id',
                as: 'dutyer',
            })
            .unwind({
                path: '$dutyer',
                preserveNullAndEmptyArrays: true
            })
            .skip(i * MAX_LIMIT).limit(MAX_LIMIT)
            .end()
        tasks.push(promise)
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {

        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })
}

async function findSchedulerListbyWhere(where) {
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('schedulers')
        .aggregate()
        .match(where)
        .count('count')
        .end()

    let total = 0;
    if (countResult.list.length > 0) {
        total = countResult.list[0].count;
    }
    if (total === 0) {
        return {
            list: [],
            errMsg: ''
        }
    }
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('schedulers')
            .aggregate()
            .match(where)
            .lookup({
                from: 'courses',
                localField: 'courseId',
                foreignField: '_id',
                as: 'course',
            })
            .unwind({
                path: '$course',
                preserveNullAndEmptyArrays: true
            })
            .lookup({
                from: 'rooms',
                localField: 'roomId',
                foreignField: '_id',
                as: 'room',
            })
            .unwind({
                path: '$room',
                preserveNullAndEmptyArrays: true
            })
            .lookup({
                from: 'users',
                localField: 'dutyerId',
                foreignField: '_id',
                as: 'dutyer',
            })
            .unwind({
                path: '$dutyer',
                preserveNullAndEmptyArrays: true
            })
            .skip(i * MAX_LIMIT).limit(MAX_LIMIT)
            .end()
        tasks.push(promise)
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })
}


async function findbyWhere(table, where) {
    const MAX_LIMIT = 100;
    // 先取出集合记录总数
    const countResult = await db.collection(table).where(where).count();
    const total = countResult.total;
    if (total === 0) {
        return {
            data: [],
            errMsg: ""
        }
    }
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection(table).where(where).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
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