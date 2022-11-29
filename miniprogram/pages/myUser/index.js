// pages/semesterManage/add/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        _id: '',
        modelName: 'userManage',
        name: '',
        maintain: true,
        scheduler: false,
        userTypeList:['实验人员','学生','教师'],
        userType:1,
        userTypeShow:false,
        manager:false
    },

    onSubmit: async function (e) {
        wx.showLoading({
            title: '请稍后...',
        })
        var entity = {
            _id: this.data._id,
            userType:this.data.userType,
            userTypeName:this.data.userTypeList[this.data.userType],
        }
        if(this.data.tel){
            entity.tel = this.data.tel;
        }
        if(this.data.userType === 0){
            entity.manager = this.data.manager;
            entity.maintain = this.data.maintain;
            entity.scheduler = this.data.scheduler;
        }
        var data = {
            type: this.data.modelName,
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

    onTelChange: function (e) {
        this.setData({
            tel: e.detail
        });
    },


    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var data = app.globalData.userInfo;
        this.setData(data);
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