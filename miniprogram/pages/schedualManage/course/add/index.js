// pages/semesterManage/add/index.js
var app = getApp();
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    type: 'ruleManage',
    weekDayList: [
      {
        values: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
        className: '星期',
        defaultIndex: 0,
      },
      {
        values: ['上午', '下午', '晚上'],
        className: '时间',
        defaultIndex: 1,
      },
    ],
    weekList: [{
        text: '星期一',
        value: 1
      }, {
        text: '星期二',
        value: 2
      }, {
        text: '星期三',
        value: 3
      },
      {
        text: '星期四',
        value: 4
      }, {
        text: '星期五',
        value: 5
      }, {
        text: '星期六',
        value: 6
      }, {
        text: '星期日',
        value: 7
      }
    ],
    
    weekNum:1,
    weekDay:1,
    startPeriod:1,
    endPeriod:4,

    roomIndex: 0,
    roomShow: false,

    dutyerIndex: 0,
    dutyerShow: false
  },

  onStepperChange:function(e){
    var id = e.currentTarget.id;
    var index = e.detail;
    var data = {};
    data[id] = index;
    
    if(id === "startPeriod" && index > this.data.endPeriod){
      data["endPeriod"] = index;
    }
    if(id === "endPeriod" && index < this.data.startPeriod){
      data["startPeriod"] = index;
    }
    this.setData(data);
  },

  onPickerCancel: function (e) {
    var id = e.currentTarget.dataset.id;
    if(id === 'room'){
      this.setData({
        roomShow: false
      });
    }else{
      this.setData({
        dutyerShow: false
      });
    }
  },

  onPickerConfirm: function (e) {
    const {
      index
    } = e.detail;
    var id = e.currentTarget.dataset.id;
    if(id === 'room'){
      this.setData({
        roomIndex: index,
        roomShow: false
      });
    }else{
      this.setData({
        dutyerIndex: index,
        dutyerShow: false
      });
    }
  },

  onPickerDisplay: function (e) {
    console.log(e)
    var id = e.currentTarget.dataset.id;
    if(id === 'room'){
      this.setData({
        roomShow: true
      });
    }else{
      this.setData({
        dutyerShow: true
      });
    }
  },

  onSubmit: async function (e) {
    wx.showLoading({
      title: '请稍后...',
    })
    var semester = app.globalData.semester;
    var entity = {
      courseName: this.data.courseName,
      instructorName: this.data.instructorName,
      selectedStuNum: this.data.selectedStuNum,
      semesterId:semester._id,
      weekNum: this.data.weekNum,
      weekDay: this.data.weekDay,
      startPeriod: this.data.startPeriod,
      endPeriod: this.data.endPeriod,
      roomId: this.data.roomIdList[this.data.roomIndex],
      roomName: this.data.roomName,
      type: 3,
      instructorId:this.data.instructorId,
    }

    if(this.data.schedulerTotal > 0){
      entity.dutyerId = this.data.userIdList[this.data.dutyerIndex]
    }
    
    var data = {
        type: "schedulerManage",
        opt: 'addCourseAndScheduler',
        entity: entity
    }

    await app.requestCloud(data);
    wx.navigateBack({
        delta: 1
      })
  },

  requestUserList: async function () {
    var semester = app.globalData.semester;
    var data = {
        type: "schedulerManage",
        opt: 'findUserListNoSchedulerComplict',
        semesterId:semester._id,
        weekDay:this.data.weekDay,
        weekNum:this.data.weekNum
    }
    var resp = await app.requestCloud(data);
    var data = resp.result.data;
    if (!data) {
        return;
    }
    var len = data.length;
    var userList = [];
    var userIdList = [];
    var user = null;
    for (var i = 0; i < len; i++) {

        user = data[i];
        var dutyer = {}
        if(user.conflict === 1){
            dutyer.text = user.name + "(冲突:"+ this.data.userMap[user.conflictSchedulerId[0]].name+")";
            dutyer.disabled = true;
        }else{
            dutyer.text = user.name;
        }
        userList.push(dutyer);
        userIdList.push(user._id);

    }
    
    this.setData({
        userIdList: userIdList,
        userList: userList,
    });
    console.log(resp)
},
  init_cloud: async function () {
    await this.requestIsScheduled();
    await this.requestUserList();
  },

  requestRoomsByCourse:async function(e){
    this.setData({
      loading:true
    });
    var entity = {
      weekNum:this.data.weekNum,
      weekDay:this.data.weekDay,
      startPeriod:this.data.startPeriod,
      endPeriod:this.data.endPeriod
    }
    var data = {
        type: "schedulerManage",
        opt: 'findRoomByPeriod',
        entity:entity
    }
    var resp = await app.requestCloud(data);

    console.log(resp);
    var rooms = resp.result.data;
    var length = rooms.length;
    
    if(length === 0){
      Dialog.alert({
        message: '该时间段没有空闲教室，请更换时间！',
      }).then(() => {
        // on close
      });
      this.setData({
        roomList:[],
        dutyerShow: false,
        loading:false
      });
      return;
    }
    var roomList = [];
    var roomIdList = [];
    for(var i = 0 ; i < length ; i++){
      var room = rooms[i];
      roomList.push(room.name);
      roomIdList.push(room._id);
    }
    this.setData({
      roomList:roomList,
      roomIdList:roomIdList,
      loading:false
    });
  },

  requestIsScheduled:async function(){
    var semester = app.globalData.semester;
    var  data ={
        type: "schedulerManage",
        opt: 'findSchedulerTotelByWeekNum',
        semesterId:semester._id,
        weekNum:this.data.weekNum
      }
    var resp = await app.requestCloud(data);
    
    var total = resp.result.data.total;
    this.setData({
      schedulerTotal:total
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var data = JSON.parse(options.data);
    var selectWeek = data.selectWeek;
    data.weekNum = selectWeek;
    this.setData(data);
    this.init_cloud();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})