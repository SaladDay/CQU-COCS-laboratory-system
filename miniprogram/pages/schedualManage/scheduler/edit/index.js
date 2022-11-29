// pages/schedualManage/scheduler/edit/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        weekDayMap: {
            1: "周一",
            2: "周二",
            3: "周三",
            4: "周四",
            5: "周五",
            6: "周六",
            7: "周日"
        },
        morningMap: {
            1: '上午',
            2: "下午",
            3: "晚上"
        },
    },

    onPickerDisplay: function (e) {
        var index = e.currentTarget.dataset.id;
        var schedulerList = this.data.schedulerList;
        schedulerList[index].dutyerShow = true;
        this.setData({
            schedulerList: schedulerList
        });
    },

    onPickerCancel: function (e) {
        const {
            index
        } = e.detail;
        var id = e.currentTarget.dataset.id;
        var schedulerList = this.data.schedulerList;
        schedulerList[id].dutyerShow = false;
        this.setData({
            schedulerList: schedulerList
        });
    },

    onPickerConfirm: function (e) {
        const {
            index
        } = e.detail;
        var id = e.currentTarget.dataset.id;
        var schedulerList = this.data.schedulerList;
        schedulerList[id].dutyerIndex = index;
        schedulerList[id].dutyerShow = false;
        this.setData({
            schedulerList: schedulerList
        });
    },

    onSubmit:async function(e){
        var schedulerList = this.data.schedulerList;
        var schedulerIdList = this.data.schedulerIdList;
        var userIdList = this.data.userIdList;
        var schedulers = [];
        var len = schedulerList.length ;
        for(var i = 0 ; i < len; i ++){
            var scheduler = schedulerList[i];
            var dutyerIndex = scheduler.dutyerIndex;
            var dutyerId = userIdList[dutyerIndex];
            var schedulerId = schedulerIdList[i];
            console.log("schedulerId:"+schedulerId);
            schedulers.push({
                dutyerId:dutyerId,
                schedulerId:schedulerId
            });
        }

        var data = {
            type: "schedulerManage",
            opt: 'editScheduler',
            schedulers: schedulers
        }
        
        await app.requestCloud(data);
        wx.hideLoading({
            success: (res) => {
              wx.navigateBack({
                delta: 1
              })
            },
          })
    },

    requestUserList: async function () {
        var semester = app.globalData.semester;
        var data = {
            type: "schedulerManage",
            opt: 'findUserListNoSchedulerComplict',
            weekDay:this.data.scheduler.weekDay,
            weekNum:this.data.scheduler.weekNum,
            semesterId:semester._id,
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

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        
        var data = JSON.parse(options.data);
        var userMap = data.userMap;
        var curSchedulers = data.curSchedulers;
        var userIdList = [];
        for (var userId in userMap) {
            userIdList.push(userId);
        }
        console.log("curSchedulers start。。。。");
        console.log(userMap);

        console.log("curSchedulers end");
        var len = curSchedulers.length;
        var schedulerList = [];
        var schedulerIdList = [];
        var schedulerMap = {};
        var scheduler = null;
        for (var i = 0; i < len; i++) {
            scheduler = curSchedulers[i];
            var schedualerType = scheduler.schedualerType;
            var _id = scheduler._id;
            var schedulerAlias = "";
            if(schedualerType === 1){
                var roomName = scheduler.room.name;
                var period = "[" + scheduler.startPeriod + "-" + scheduler.endPeriod + "]";
                var stuNum = "[人数：" + scheduler.selectedStuNum + "]";
                schedulerAlias = roomName + period + stuNum;
            }else{
                schedulerAlias = "坐班";
            }
           
            var dutyerId = scheduler.dutyerId;
            var dutyerIndex = userIdList.indexOf(dutyerId);

            schedulerList.push({
                title: schedulerAlias,
                dutyerIndex: dutyerIndex,
                dutyerShow: false
            });
            schedulerIdList.push(_id);
            schedulerMap[_id] = scheduler;
        }
        var morning = scheduler.morning;
        morning = this.data.morningMap[morning];

        var weekNum = scheduler.weekNum;
        var weekDay = scheduler.weekDay;
        weekDay = this.data.weekDayMap[weekDay];
        var title = "第" + weekNum + "周" + weekDay + morning + "排班编辑";
        console.log(scheduler);
        this.setData({
            title: title,
            schedulerList: schedulerList,
            schedulerIdList: schedulerIdList,
            schedulerMap: schedulerMap,
            scheduler:scheduler,
            userMap:userMap
        });
        await this.requestUserList();
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