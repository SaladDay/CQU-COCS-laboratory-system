// pages/semesterManage/add/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        name: '',
        type: 'roomManage',
        managerIndex: 0,
        show: false,
        schedulerShow: false,
        schedulerIndex: 0
    },

    onClose: function (e) {
        var type = e.currentTarget.dataset.id;
        if (type === "manager") {
            this.setData({
                show: false
            });
        } else {
            this.setData({
                schedulerShow: false
            });
        }

    },

    onConfirm: function (e) {
        const {
            index
        } = e.detail;
        var type = e.currentTarget.dataset.id;
        if (type === "manager") {
            this.setData({
                managerIndex: index,
                show: false
            });
        } else {
            this.setData({
                schedulerIndex: index,
                schedulerShow: false
            });
        }
    },

    onDisplay: function (e) {
        const {
            index
        } = e.detail;
        var type = e.currentTarget.dataset.id;
        if (type === "manager") {
            this.setData({
                show: true
            });
        } else {
            this.setData({
                schedulerShow: true
            });
        }
    },

    onSubmit: async function (e) {
        wx.showLoading({
            title: '请稍后...',
        })
        var entity = {
            name: this.data.name,
            roomCode: this.data.roomCode,
            managerId: this.data._idList[this.data.managerIndex],
            schedulerId: this.data.schedulerIdList[this.data.schedulerIndex]
        }
        var data = {
            type: this.data.type,
            opt: 'add',
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

    onNameChange: function (e) {
        this.setData({
            name: e.detail
        });
    },

    onRoomCodeChange: function (e) {
        this.setData({
            roomCode: e.detail
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function (options) {
        var data = {
            type: "userManage",
            opt: 'findAll'
        }
        var resp = await app.requestCloud(data);
        var data = resp.result.data;
        if (!data) {
            return;
        }
        var len = data.length;
        var userList = [];
        var schedulerList = [];
        var _idList = [];
        var schedulerIdList = [];

        for (var i = 0; i < len; i++) {
            var user = data[i];
            var _id = user._id;
            userList.push(user.name);
            _idList.push(_id);

            if (user.scheduler) {
                schedulerIdList.push(_id);
                schedulerList.push(user.name);
            }
        }
        
        this.setData({
            _idList: _idList,
            userList: userList,
            schedulerList: schedulerList,
            schedulerIdList: schedulerIdList,
        });

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