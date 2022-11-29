// pages/semesterManage/index.js
var app = getApp();
var moment = require('..//utils/moment');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        title:"当前值班人员信息",
        modelName:'roomManage',
        list:[],
        list_more_sign:[]
    },

    onAddClick:function(e){
        wx.navigateTo({
          url: '../'+this.data.modelName+'/add/index',
        })
    },

    onEditClick:function(e){
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        wx.navigateTo({
            url: '../'+this.data.modelName+'/edit/index?data='+JSON.stringify(data),
        })
    },

    onRemoveClick:async function(e){
        wx.showLoading({
          title: '请稍后...',
        })
        var id= e.currentTarget.dataset.id;
        var data = this.data.list[id];
        var _id = data._id;
        data = {
            type: this.data.modelName,
            opt: 'remove',
            _id:_id
          }
        await app.requestCloud(data);
        wx.hideLoading({
            success: (res) => {
                this.refresh();
            },
          })
    },

    onMoreClick:function(e){
        var id= e.currentTarget.dataset.id;
        var list_more_sign = this.data.list_more_sign;
        var len = list_more_sign.length;
        for(var i = 0 ; i < len ; i++){
            if(i === id){
                list_more_sign[i] = !this.data.list_more_sign[i];
            }else{
                list_more_sign[i] = false;
            }
        }
        
        this.setData({
            list_more_sign:list_more_sign
        })
    },

    refresh: async function(scene){
        var roomId = scene;
        var semester = app.globalData.semester;
        var curWeekDay = new moment().weekday();
        curWeekDay = curWeekDay === 0?7:curWeekDay;
        var semesterId = semester._id;
        var weekNum = app.globalData.curWeek;
        var weekDay = curWeekDay;
        var morning = 1;
        var curTime = new moment().format('HH:mm');
        if(curTime > '12:30'){
            morning = 2;
            if(curTime > '18:30'){
                morning = 3;
            }
        }
        var data  =  {
            type: "entityManage",
            opt: 'findSchedulerOfSomeMorning',
            semesterId:semesterId,
            weekNum:weekNum,
            weekDay:weekDay,
            morning:2
          }
        var resp = await app.requestCloud(data);
        data = resp.result.data;
        if(!data){
            data = [];
        }else{
            var dutyer = data[0].dutyer;
            var scheduler = data[0];
            var schedualerType = scheduler.schedualerType;
            if(schedualerType !== 0){
                for(var i = 0 ; i < data.length ; i ++){
                    if(roomId === data[i].roomId){
                        dutyer = data[i].dutyer;
                        console.log(i)
                        break;
                    }
                }
            }
            console.log(dutyer)
            if(dutyer.hasOwnProperty('tel')){
                wx.makePhoneCall({
                    phoneNumber: dutyer.tel
                })
            }
        }

        this.setData({
           list:data
        });
    },

    formatDate:function(time){
        var date = new Date(time);
        return ""+date.getFullYear()+"-"+(date.getMonth()+1)+"-"+(date.getDate()) 
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad:function (options) {
        
        const scene = decodeURIComponent(options.scene); 
        this.refresh(scene);
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