// pages/semesterManage/add/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        name: '',
        type: 'ruleManage',
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
        weekIndex: 0,
        weekShow: false,

        managerIndex: 0,
        managerShow: false,

        dutyerIndex: 0,
        dutyerShow: false,
        isScheduler:true
    },

    onWeekChange: function (e) {
        const {
            picker,
            value,
            index
        } = e.detail;
        this.setData({
            weekIndex: e.index
        });
        console.log("onManagerChange" + e.detail);
    },

    onWeekClose: function (e) {
        this.setData({
            weekShow: false
        });
    },

    onWeekCancel: function (e) {
        this.setData({
            weekShow: false
        });
    },

    onWeekConfirm: function (e) {
        const {
            index
        } = e.detail;
        this.setData({
            weekIndex: index,
            weekShow: false
        });
        console.log("onManagerChange" + e.detail);
    },

    onWeekDisplay: function (e) {

        this.setData({
            weekShow: true
        });
    },

    onManagerChange: function (e) {
        const {
            picker,
            value,
            index
        } = e.detail;
        this.setData({
            managerIndex: e.index
        });
        console.log("onManagerChange" + e.detail);
    },

    onClose: function (e) {
        this.setData({
            managerShow: false
        });
    },

    onManagerCancel: function (e) {
        this.setData({
            managerShow: false
        });
    },

    onManagerConfirm: function (e) {
        const {
            index
        } = e.detail;
        this.setData({
            managerIndex: index,
            managerShow: false
        });
        console.log("onManagerChange" + e.detail);
    },

    onManagerDisplay: function (e) {
        this.setData({
            managerShow: true
        });
    },

    onDutyerChange: function (e) {
        const {
            picker,
            value,
            index
        } = e.detail;
        this.setData({
            dutyerIndex: e.index
        });
        console.log("onDutyerChange" + e.detail);
    },

    onDutyClose: function (e) {
        this.setData({
            dutyerShow: false
        });
    },

    onDutyerCancel: function (e) {
        this.setData({
            dutyerShow: false
        });
    },

    onDutyerConfirm: function (e) {
        const {
            index
        } = e.detail;
        this.setData({
            dutyerIndex: index,
            dutyerShow: false
        });
        console.log("onDutyChange" + e.detail);
    },

    onDutyerDisplay: function (e) {
        this.setData({
            dutyerShow: true
        });

    },

    onSubmit: async function (e) {
        var userInfo = app.globalData.userInfo;
        wx.showLoading({
            title: '请稍后...',
        })
        var entity = {
            _id: this.data._id,
            weekDay: this.data.weekList[this.data.weekIndex].value,
            dutyerId: this.data.dutyerIdList[this.data.dutyerIndex],
            managerId: this.data.managerIdList[this.data.managerIndex],
            schedulerId: userInfo._id,
            isScheduler:this.data.isScheduler
        }
        var data = {
            type: "rules",
            opt: 'edit',
            entity: entity
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

    onIsSchedulerChange:function(e){
        this.setData({
            isScheduler: e.detail
        });
        console.log("onIsSchedulerChange" + e.detail);
    },

    onNameChange: function (e) {
        this.setData({
            name: e.detail
        });
    },

    requestUserList: async function () {
        var data = {
            type: "schedulerManage",
            opt: 'findUserListNoRuleComplict',
            weekDay:this.data.weekList[this.data.weekIndex].value
        }
        var resp = await app.requestCloud(data);
        var data = resp.result.data;
        if (!data) {
            return;
        }
        var len = data.length;
        var managerList = [];
        var dutyerList = [];
        var managerIdList = [];
        var dutyerIdList = [];
        var user = null;
        for (var i = 0; i < len; i++) {

            user = data[i];
            var dutyer = {}
            if(user.conflict === 1){
                dutyer.text = user.name + "(冲突)";
                dutyer.disabled = true;
            }else{
                dutyer.text = user.name;
            }
            managerList.push(dutyer);
            managerIdList.push(user._id);
            dutyerList.push(dutyer);
            dutyerIdList.push(user._id);

        }
        
        this.setData({
            dutyerIdList: dutyerIdList,
            managerIdList: managerIdList,
            managerList: managerList,
            dutyerList: dutyerList
        });
        console.log(resp)
    },

    init_cloud: async function () {
        await this.requestUserList();
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        
        var data = JSON.parse(options.data);
        this.setData(data);
        console.log(data);
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