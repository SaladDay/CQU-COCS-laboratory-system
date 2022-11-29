// pages/semesterManage/add/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        name: '',
        start: '',
        end: '',
        startShow: false,
        endShow: false,
        minDate: new Date(2020, 0, 1).getTime(),
    },

    onStartDisplay: function (e) {
        this.setData({
            startShow: true
        });
    },

    onStartClose() {
        this.setData({
            startShow: false
        });
    },

    formatDate(date) {
        date = new Date(date);
        return `${date.getFullYear() }-${date.getMonth() + 1}-${date.getDate()}`;
    },
    onStartConfirm(event) {
        this.setData({
            startShow: false,
            start: this.formatDate(event.detail),
        });
    },
    onEndDisplay: function (e) {
        this.setData({
            endShow: true
        });
    },

    onEndClose() {
        this.setData({
            endShow: false
        });
    },

    formatDate(date) {
        date = new Date(date);
        return `${date.getFullYear() }-${date.getMonth() + 1}-${date.getDate()}`;
    },
    onEndConfirm(event) {
        this.setData({
            endShow: false,
            end: this.formatDate(event.detail),
        });
    },

    onSubmit:async function(e){
        wx.showLoading({
          title: '请稍后...',
        })
        var name = this.data.name;
        var start = this.data.start;
        start = new Date(start).getTime();
        var end = this.data.end;
        end = new Date(end).getTime();
        var entity = {
            name:name,
            start:start,
            end:end
        }
        var data = {
            type: 'semesterManage',
            opt: 'add',
            entity:entity
        }
        app.showLoading("加载中...")
        await app.requestCloud(data);
        app.hideLoading();
        wx.navigateBack({
            delta: 1
        })
    },

    onNameChange:function(e){
        this.setData({
            name:e.detail
        });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

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