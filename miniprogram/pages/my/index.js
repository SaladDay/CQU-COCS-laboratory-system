// pages/my/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        active:3
    },

    async clearStorage(event){
        app.showLoading("清理中...");
        try {
            await wx.clearStorageSync()
          } catch(e) {
            // Do something when catch error
          }
          app.hideLoading();
          app.globalData.userInfo = null;
          app.globalData.semester = null;
          wx.reLaunch({
            url: '/pages/index/index',
          })
    },

    onChange(event) {
        // event.detail 的值为当前选中项的索引
        // this.setData({
        //     active: event.detail
        // });

        if(event.detail == 1){
            wx.navigateTo({
                url: '../courseQuery/index',
            })
        }
        if(event.detail == 2){
            wx.navigateTo({
                url: '../schedualQuery/index',
            })
        }
        if(event.detail == 0){
            wx.navigateTo({
                url: '../index/index',
            })
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: async function(options) {
        if(!app.globalData.userInfo){
            console.log("index.js onload 请求当前用户")
            await app.requestUserInfo();
            console.log("index.js onload 结束请求当前用户")
            if(app.globalData.userInfo == null){
                console.log("从app.js跳转至login页面...")
                wx.navigateTo({
                  url: '/pages/login/index?nextUrl=/pages/index/index',
                })
            }
        }
        this.setData({
            userInfo: app.globalData.userInfo
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})