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
 
  try {
    const type = event.type;
    const TABLE = type.replace("Manage",'s');
    // 遍历修改数据库信息
    const opt = event.opt;
    let result = {
      data: []
    };
    if (opt === 'findAll') {
      result = await findAll(TABLE);
    }else if(opt === 'findAllRoom'){
      result = await findAllRoom();
      result.data = result.list;
    } 
    else if (opt === 'add') {
      var entity = event.entity;
      await add(TABLE,entity)
    }else if (opt === 'edit') {
      var entity = event.entity;
      await update(TABLE,entity)
    }else if (opt === 'remove') {
      var _id = event._id;
      await remove(TABLE,_id)
    }else if(opt === 'findMaxNew'){
      result = await findMaxNew(TABLE);
    }else if(opt === 'findbyWhere'){
      var where = event.where;
      result = await findbyWhere(TABLE,where);
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

async function remove(table,_id){
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
  if(tasks.length === 0){
    return {
        data:[],
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

exports.findMaxNew = findMaxNew

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
  if(tasks.length === 0){
    return {
        data:[],
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

async function findAllRoom() {
  const MAX_LIMIT = 100
  // 先取出集合记录总数
  const countResult = await db.collection('rooms').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('rooms').aggregate().lookup({
      from: 'users',
      localField: 'managerId',
      foreignField: '_id',
      as: 'manager',
    })
    .project({
      managerId:0
    })
    .end()
    tasks.push(promise)
  }
  if(tasks.length === 0){
    return {
        list:[],
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

async function findbyWhere(table,where) {
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

  if(tasks.length === 0){
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