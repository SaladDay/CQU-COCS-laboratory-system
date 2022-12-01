const cloud = require('wx-server-sdk');
cloud.init({
    env: "cloud1-4gahuybndcca4024"
});
const wxContext = cloud.getWXContext();
let openId = wxContext.OPENID;
const db = cloud.database();
const _ = db.command;

// 获取openId云函数入口函数
exports.main = async (event, context) => {

    try {
        const type = event.type;
        const TABLE = type.replace("Manage", 's');
        // 遍历修改数据库信息
        const opt = event.opt;
        let result = {
            data: []
        };
        if (opt === 'findAll') {
            console.log("go into entityManage 19 line");
            result = await findAll(TABLE);
        } else if (opt === 'findAllRoom') {
            result = await findAllRoom();
            result.data = result.list;
        } else if(opt === 'findAllEquipType'){
            result = await findAllEquipType()
            result.data = result.list;
        
        }else if(opt === 'requestByEquipNameId'){
            const keyword = event.keyword;
            result =await requestByEquipNameId(keyword)

        }else if(opt === 'findAllEquipRepair'){
            const state = event.state
            result = await findAllEquipRepair(state);
            result.data = result.list;
        }
        else if (opt === 'findAllEquip') {
            result = await findAllEquip();
            result.data = result.list;

        }else if(opt == 'findAllEquipRepairByUserId'){
            var userId = event._id;
            result = await findAllEquipRepairByUserId(userId);
            result.data = result.list;
        }
        else if(opt === 'searchEquipByRooom'){
            var keyWord = event._id;
            result = await searchEquipByRooom(keyWord);
            

        }else if(opt === 'queryMax'){
            var entity = event.entity;
            result = await queryMax(TABLE,entity)
            console.log(result)
            result.data=result.maxNum;
            // result.data = result.list;
        
        }else if(opt === 'querySum'){
            var entity = event.entity;
            result = await querySum(TABLE,entity)
            console.log(result)
            result.data=result.totalSum;
        
        } else if (opt === 'findAllRoomByManagerId') {
            const managerId = event.managerId;
            result = await findAllRoomByManagerId(managerId);
            result.data = result.list;
        } else if (opt === 'add') {
            var entity = event.entity;
            await add(TABLE, entity)
        } else if (opt === 'edit') {
            var entity = event.entity;
            await update(TABLE, entity)
        } else if (opt === 'addRoom') {
            var entity = event.entity;
            await addRoom(TABLE, entity)
        } else if (opt === 'editRoom') {
            var entity = event.entity;
            await updateRoom(TABLE, entity)
        } else if (opt === 'remove') {
            var _id = event._id;
            await remove(TABLE, _id)
        } else if (opt === 'findMaxNew') {
            result = await findMaxNew(TABLE);
        } else if (opt === 'findbyWhere') {
            var where = event.where;
            result = await findbyWhere(TABLE, where);
        } else if (opt === 'findByPage') {
            var pageNum = event.pageNum;
            var maxNum = event.maxNum ? event.maxNum : 10;
            result = await findByPage(TABLE, pageNum, maxNum);
        }else if (opt === 'findEquipByPage') {
            var pageNum = event.pageNum;
            var maxNum = event.maxNum ? event.maxNum : 10;
            result = await findEquipByPage(TABLE, pageNum, maxNum);
            result.data = result.list;
        } else if (opt === 'createRoomCode') {

            var roomId = event.roomId;
            result.data = await createRoomCode(roomId);

        } else if (opt === 'findSchedulerOfSomeMorning') {
            var semesterId = event.semesterId;
            var weekNum = event.weekNum;
            var weekDay = event.weekDay;
            var morning = event.morning;
            result = await findSchedulerOfSomeMorning(semesterId, weekNum, weekDay, morning);

        } else if (opt === 'updateEquipRepair'){
            var updateData = event.updateData;
            await updateEquipRepair(updateData);
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
async function updateEquipRepair(updateData){
    var key = updateData.equipRepairId;
    var repairTime = updateData.repairTime;
    var feedback = updateData.feedback;
    db.collection('equipRepairs').where({_id:key}).update({
        // data 传入需要局部更新的数据
        data: {
          state:1,
          repairDate:repairTime,
          feedback:feedback
        },
        success: function(res) {
            console.log('数据已更新')
            console.log(res.data)
        }
      })

    //   db.collection('equipRepairs').where({_id:key}).add({
    //     data:{
    //         repairDate:repairTime,
    //         feedback:feedback
    //     },
    //     success:(res)=>{
    //         console.log('数据已添加')
    //         console.log(res.data)
    //     }
    //   })

}
exports.updateEquipRepair = updateEquipRepair;

async function findSchedulerOfSomeMorning(semesterId, weekNum, weekDay, morning) {
    const $ = db.command.aggregate
    let result = await db.collection('schedulers')
        .aggregate()
        .match({
            semesterId: semesterId,
            weekNum: weekNum,
            weekDay: weekDay,
            morning: morning
        })
        .lookup({
            from: 'users',
            localField: 'dutyerId',
            foreignField: '_id',
            as: 'dutyers',
        })
        .lookup({
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'rooms',
        })
        .project({
            _id: 1,
            roomId: 1,
            schedualerType: 1,
            type: 1,
            weekDay: 1,
            morning: 1,
            weekNum: 1,
            startPeriod: 1,
            endPeriod: 1,
            dutyer: $.arrayElemAt(['$dutyers', 0]),
            room: $.arrayElemAt(['$rooms', 0])
        })
        .end();

    return {
        data: result.list
    };

}

async function createRoomCode(roomId) {

    const result = await cloud.openapi.wxacode.getUnlimited({
        "page": 'pages/contact/index',
        "scene": roomId,
        "checkPath": false,
        "envVersion": 'develop'
    })
    const buf = result.buffer;

    var base64Img = buf.toString('base64');
    console.log(base64Img)
    return base64Img
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
exports.remove = remove;
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

exports.update = update;

async function add(table, entity) {
    console.log('table')
    console.log(table)
    console.log('entity')

    console.log(entity)



    let tasks = []
    const promise = db.collection(table).add({
        data: entity
    })
    tasks.push(promise)


    let result = await Promise.all(tasks).then(res => {
        console.log(res)
        return res
    }).catch(function (err) {
        return err
    })
}

exports.add = add;
async function querySum(table,entity){
    console.log('table:')

    console.log(table)
    console.log('entity:')
    console.log(entity)
    const $ = db.command.aggregate
    var result = await db.collection(table).aggregate().group({
        _id:'$equipTypeId',//相当于全部分一组
        maxNum:$.max('$ord')//输出这个组内max的最大值
    }).match({_id:entity.equipTypeId}).end()
    // console.log('查找函数被调用,result：')
    // console.log(result)
    if('list[0].maxNum' in result ){
        var totalSum = result.list[0].maxNum
    }else{
        var totalSum = 0
    }
    
    
    console.log('处理后的totalSum为')
    console.log(totalSum)
    return{
        list:totalSum,
        errMsg:'collection.get:ok',
        totalSum:totalSum
    }

}
exports.querySum = querySum;


async function queryMax(table,entity){
    const $ = db.command.aggregate
    // console.log('table的内容')
    // equipTypes
    // console.log('entity的内容')
    // {name: "000030"}
    var result = await db.collection(table).aggregate().group({
        _id:'',//相当于全部分一组
        maxNum:$.max('$nameId')//输出这个组内max的最大值
    }).end()
    console.log("result：")
    console.log(result.list[0].maxNum)
    return{
        list:result.list[0].maxNum,
        errMsg:'collection.get:ok',
        maxNum:result.list[0].maxNum
    }

}
exports.queryMax=queryMax;

async function updateRoom(table, entity) {
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



async function addRoom(table, entity) {
    let tasks = []
    const promise = db.collection(table).add({
        data: entity
    })
    tasks.push(promise)
    let result = await Promise.all(tasks).then(res => {
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
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
        return {
            data: acc.data.concat(cur.data),
            errMsg: acc.errMsg,
        }
    })
}
exports.findMaxNew = findMaxNew;

async function findById(table,_id) {
    
    // 承载所有读操作的 promise 的数组
    const tasks = []
    const promise = db.collection(table).doc(_id).get()
  
    tasks.push(promise)
    if (tasks.length === 0) {
        return {
            data: [],
            errMsg: "collection.get:ok",
        }
    }

    console.log("go into entityManage 141 line in " + new Date());
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
        console.log("go into entityManage 144 line in " + new Date());
        return {
            data: acc.data.concat(cur.data),
            errMsg: acc.errMsg,
        }
    })
}
exports.findById = findById;

async function findAll(table) {
    const MAX_LIMIT = 100
    console.log("go into entityManage 121 line in " + new Date());
    // 先取出集合记录总数
    const countResult = await db.collection(table).count()
    console.log("go into entityManage 123 line in " + new Date());
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

    console.log("go into entityManage 141 line in " + new Date());
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
        console.log("go into entityManage 144 line in " + new Date());
        return {
            data: acc.data.concat(cur.data),
            errMsg: acc.errMsg,
        }
    })
}
exports.findAll = findAll;

async function findAllEquipType() {
    console.log('函数findAllEquipType被调用')
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('equipTypes').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    var lists=[]
    for (let i = 0; i < batchTimes; i++) {
        await db.collection('equipTypes').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
        .then(res=>{
            lists=lists.concat(res.data)
        })
    }
    if (lists.length === 0) {
        return {
            list: [],
            errMsg: "collection.get:ok",
        }
    }
    // 等待所有
    // return (await Promise.all(tasks)).reduce((acc, cur) => {

    //     return {
    //         list: acc.list.concat(cur.list),
    //         errMsg: acc.errMsg,
    //     }
    // })
    return{
        list:lists,
        errMsg:'collection.get:ok'
    }
}
exports.findAllEquipType = findAllEquipType;




async function findAllEquipRepairByUserId(userId){
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('equipRepairs').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    // var _id = userInfo.openId
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('equipRepairs').aggregate().skip(i*MAX_LIMIT).limit(MAX_LIMIT)
            .match({
                'userInfo.openId':userId
            })
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
    console.log('tasks:')
    console.log(tasks)
    const result = await Promise.all(tasks);
    console.log('await promise的结果是')
    console.log(result)

    return result.reduce((acc, cur) => {
        console.log('acc:')
        console.log(acc)
        console.log('cur:')
        console.log(cur)

        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })

}
exports.findAllEquipRepairByUserId = findAllEquipRepairByUserId;

async function findAllEquipRepair(state){
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('equipRepairs').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    // 承载所有读操作的 promise 的数组
    const tasks = []

    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('equipRepairs').aggregate().skip(i*MAX_LIMIT).limit(MAX_LIMIT)
        .match({
            state:state
        })
        .sort({
            creatDate:-1
        }).end()
        tasks.push(promise)
    }
    if (tasks.length === 0) {
        return {
            list: [],
            errMsg: "collection.get:ok",
        }
    }
    // 等待所有
    console.log('tasks:')
    console.log(tasks)
    const result = await Promise.all(tasks);
    console.log('await promise的结果是')
    console.log(result)

    return result.reduce((acc, cur) => {
        console.log('acc:')
        console.log(acc)
        console.log('cur:')
        console.log(cur)

        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })

}
exports.findAllEquipRepair = findAllEquipRepair;

async function findAllEquip(){
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('equips').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    // 承载所有读操作的 promise 的数组
    const tasks = []

    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('equips').aggregate().skip(i*MAX_LIMIT).limit(MAX_LIMIT).lookup({
                from: 'equipTypes',
                localField: 'equipTypeId',
                foreignField: '_id',
                as: 'equipType',
            })
            .lookup({
                from: 'rooms',
                localField: 'roomId',
                foreignField: '_id',
                as: 'room',
            })
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
    console.log('tasks:')
    console.log(tasks)
    const result = await Promise.all(tasks);
    console.log('await promise的结果是')
    console.log(result)

    return result.reduce((acc, cur) => {
        console.log('acc:')
        console.log(acc)
        console.log('cur:')
        console.log(cur)

        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })
}
exports.findAllEquip = findAllEquip;



async function findAllRoom() {
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('rooms').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('rooms').aggregate().skip(i*MAX_LIMIT).limit(MAX_LIMIT).lookup({
                from: 'users',
                localField: 'managerId',
                foreignField: '_id',
                as: 'manager',
            })
            .lookup({
                from: 'users',
                localField: 'schedulerId',
                foreignField: '_id',
                as: 'scheduler',
            })
            .project({
                managerId: 0
            })
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
    console.log('tasks:')
    console.log(tasks)
    const result = await Promise.all(tasks);
    console.log('await promise的结果是')
    console.log(result)

    return result.reduce((acc, cur) => {
        console.log('acc:')
        console.log(acc)
        console.log('cur:')
        console.log(cur)

        return {
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })
}
exports.findAllRoom = findAllRoom;

async function findAllRoomByManagerId(managerId) {
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection('rooms').where({
        managerId: managerId
    }).count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('rooms').aggregate()
            .match({
                managerId: managerId
            })
            .lookup({
                from: 'users',
                localField: 'managerId',
                foreignField: '_id',
                as: 'manager',
            })
            .lookup({
                from: 'users',
                localField: 'schedulerId',
                foreignField: '_id',
                as: 'scheduler',
            })
            .project({
                managerId: 0
            })
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

exports.findAllRoomByManagerId = findAllRoomByManagerId;

async function searchEquipByRooom(keyword) {
    let where ={
        roomId:keyword
    }
    const resp = await db.collection('equips').aggregate().match(where).end()

    console.log(resp)
    var result={}
    result.data=resp.list
    result.errMsg=resp.errMsg
    return result

}

exports.searchEquipByRooom = searchEquipByRooom;

async function requestByEquipNameId(keyword) {
    let where ={
        equipNameId:keyword
    }

    const resp = await db.collection('equips').aggregate()
    .match(where)
    .lookup({
        from: 'equipTypes',
        localField: 'equipTypeId',
        foreignField: '_id',
        as: 'equipType',
    })
    .lookup({
        from: 'rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room',
    }).unwind({
        path: '$room',
        preserveNullAndEmptyArrays: true
    })
    .lookup({
        from: 'users',
        localField: 'room.managerId',
        foreignField: '_id',
        as: 'room.manager',
    }).end()
    



    console.log(resp)
    var result={}
    result.data=resp.list
    result.errMsg=resp.errMsg
    return result
}
exports.requestByEquipNameId = requestByEquipNameId;


async function findbyWhere(table, where) {
    const MAX_LIMIT = 100
    // 先取出集合记录总数
    const countResult = await db.collection(table).where(where).count()
    const total = countResult.total
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

exports.findbyWhere = findbyWhere;
async function findEquipByPage(table,pageNum,maxNum){
    console.log('findEquipByPage被调用')
    const MAX_LIMIT = maxNum
    // 先取出集合记录总数
    const countResult = await db.collection('equips').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    const promise = db.collection('equips').aggregate().skip((pageNum - 1) * MAX_LIMIT).limit(MAX_LIMIT)
    .lookup({
        from: 'equipTypes',
        localField: 'equipTypeId',
        foreignField: '_id',
        as: 'equipType',
    })
    .lookup({
        from: 'rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room',
    }).unwind({
        path: '$room',
        preserveNullAndEmptyArrays: true
    })
    .lookup({
        from: 'users',
        localField: 'room.managerId',
        foreignField: '_id',
        as: 'room.manager',
    }).end()
    tasks.push(promise)
    console.log('tasks是')
    console.log(tasks)

    if (tasks.length === 0) {
        return {
            data: [],
            errMsg: "collection.get:ok",
        }
    }
    const result = await Promise.all(tasks);
    console.log('result:')
    console.log(result)
    // 等待所有
    return result.reduce((acc, cur) => {
        console.log('acc:')
        console.log(acc)
        console.log('cur:')
        console.log(cur)

        return {
            
            list: acc.list.concat(cur.list),
            errMsg: acc.errMsg,
        }
    })

}
exports.findEquipByPage = findEquipByPage;


async function findByPage(table, pageNum, maxNum) {
    const MAX_LIMIT = maxNum
    // 先取出集合记录总数
    const countResult = await db.collection(table).count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    const promise = db.collection(table).skip((pageNum - 1) * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
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
exports.findByPage = findByPage;